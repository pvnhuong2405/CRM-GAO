export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized. Vui lòng đăng nhập lại." }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const body = await req.json();
    const { customerId, items, channel, note, isB2B, shipping, usedPoints } = body;

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return NextResponse.json({ error: "Khách hàng không tồn tại" }, { status: 404 });

    // Lấy giá trị thực tế từ Server
    const productIds = items.map((i: any) => i.productId);
    const priceLists = await prisma.priceList.findMany({
      where: { productId: { in: productIds }, groupId: customer.groupId }
    });
    
    // Fallback basePrice nếu không có trong PriceList
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    let itemsTotal = 0;
    const validatedItems: any[] = [];
    for (const item of items) {
      const priceRecord = priceLists.find(p => p.productId === item.productId);
      const product = products.find(p => p.id === item.productId);
      if (!product) return NextResponse.json({ error: "Sản phẩm không hợp lệ" }, { status: 400 });

      const unitPrice = priceRecord ? priceRecord.price : product.basePrice;
      const subtotal = item.quantity * unitPrice;
      itemsTotal += subtotal;
      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal
      });
    }

    const shippingFee = shipping ? Number(shipping.shippingFee) || 0 : 0;
    
    // Quy đổi điểm: 1 điểm = 1000 VNĐ
    const pointsToUse = usedPoints ? Number(usedPoints) : 0;
    if (pointsToUse > 0 && customer.totalPoints < pointsToUse) {
      return NextResponse.json({ error: "Khách hàng không đủ điểm tích lũy" }, { status: 400 });
    }

    let pointsDiscount = pointsToUse * 1000;
    // Cap discount
    if (pointsDiscount > itemsTotal + shippingFee) {
      pointsDiscount = itemsTotal + shippingFee;
    }
    
    const totalAmount = itemsTotal + shippingFee - pointsDiscount;
    const orderCode = `DH${Date.now().toString().slice(-6)}`;
    
    const result = await prisma.$transaction(async (tx) => {
      // 0. Kiểm tra tồn kho trước khi tạo
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error("Sản phẩm không tồn tại.");
        if (product.stock < item.quantity) {
          throw new Error(`Sản phẩm "${product.name}" không đủ tồn kho (còn ${product.stock}, yêu cầu ${item.quantity}).`);
        }
      }

      // 1. Tạo Order & OrderItems
      const order = await tx.order.create({
        data: {
          orderCode,
          customerId,
          createdBy: userId,
          channel: channel || "Phone",
          status: "Moi",
          totalAmount,
          note,
          items: {
            create: validatedItems
          },
          ...(shipping && {
            shipment: {
              create: {
                provider: shipping.provider,
                shippingFee: shippingFee,
                trackingCode: null, // Sẽ lấy từ API khi đẩy đơn
                status: "Pending"
              }
            }
          })
        }
      });

      // 1.1 Trừ tồn kho
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // 2. Xử lý Công nợ nếu là nhóm B2B/Siêu thị
      if (isB2B) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        
        await tx.receivable.create({
          data: {
            customerId,
            orderId: order.id,
            totalDebt: totalAmount,
            paidAmount: 0,
            dueDate,
            status: "ChuaThanhToan"
          }
        });
      }

      // 3. Xử lý trừ điểm khách hàng nếu có sử dụng
      if (pointsToUse > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { totalPoints: { decrement: pointsToUse } }
        });
        await tx.loyaltyPoint.create({
          data: {
            customerId,
            orderId: order.id,
            points: pointsToUse,
            type: "Redeem",
            note: `Dùng điểm giảm giá Đơn hàng ${order.orderCode}`
          }
        });
      }

      return order;
    });

    return NextResponse.json({ message: "Lưu đơn hàng thành công", orderId: result.id });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: { 
        customer: true, 
        shipment: true,
        items: {
          include: { product: true }
        },
        receivables: true
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Map về format UI cũ
    const mapped = orders.map(o => {
      let paymentStatus = "Thu tiền tươi";
      if (o.receivables && o.receivables.length > 0) {
        const r = o.receivables[0];
        if (r.status === "ChuaThanhToan") paymentStatus = "Nợ toàn bộ";
        else if (r.status === "ThanhToanMotPhan") paymentStatus = "Nợ (đã thu 1 phần)";
        else if (r.status === "DaThanhToan") paymentStatus = "Đã thu đủ";
        else if (r.status === "DaHuy") paymentStatus = "Đã hủy nợ";
      }

      return {
        id: o.id,
        orderCode: o.orderCode,
        customerId: o.customerId,
        customer: o.customer,
        createdBy: o.createdBy,
        channel: o.channel,
        status: o.status === "Moi" ? "Mới" : o.status === "ChoGiao" ? "Chờ giao" : o.status === "DangGiao" ? "Đang giao" : o.status === "HoanThanh" ? "Hoàn thành" : "Hủy",
        totalAmount: o.totalAmount,
        note: o.note,
        createdAt: o.createdAt,
        shipment: o.shipment,
        items: o.items,
        paymentStatus
      };
    });
    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
