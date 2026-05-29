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

    const itemsTotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
    const shippingFee = shipping ? Number(shipping.shippingFee) || 0 : 0;
    
    // Quy đổi điểm: 1 điểm = 1000 VNĐ
    const pointsToUse = usedPoints ? Number(usedPoints) : 0;
    const pointsDiscount = pointsToUse * 1000;
    
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
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice
            }))
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
        const cust = await tx.customer.findUnique({ where: { id: customerId } });
        if (cust && (cust.totalPoints || 0) >= pointsToUse) {
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
    const orders = await prisma.order.findMany({
      include: { 
        customer: true, 
        shipment: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Map về format UI cũ
    const mapped = orders.map(o => ({
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
      items: o.items
    }));
    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
