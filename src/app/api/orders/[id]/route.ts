export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    const mappedOrder = {
      id: order.id,
      orderCode: order.orderCode,
      customer: order.customer,
      items: order.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      })),
      channel: order.channel,
      status: order.status === "Moi" ? "Mới" : order.status === "ChoGiao" ? "Chờ giao" : order.status === "DangGiao" ? "Đang giao" : order.status === "HoanThanh" ? "Hoàn thành" : "Hủy",
      totalAmount: order.totalAmount,
      note: order.note,
      createdAt: order.createdAt
    };

    return NextResponse.json(mappedOrder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();
    let dbStatus = "Moi";
    if (status === "Chờ giao" || status === "Đang đóng gói") dbStatus = "ChoGiao";
    else if (status === "Đang giao") dbStatus = "DangGiao";
    else if (status === "Hoàn thành") dbStatus = "HoanThanh";
    else if (status === "Hủy" || status === "Hủy đơn") dbStatus = "Huy";

    const result = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: params.id },
        include: { items: true } // Cần items để cộng trả lại kho
      });
      if (!existingOrder) throw new Error("Không tìm thấy đơn hàng");

      // Validate logic chuyển trạng thái
      if (existingOrder.status === "Huy") {
        throw new Error("Đơn hàng đã hủy không thể cập nhật trạng thái khác");
      }
      if (existingOrder.status === dbStatus) {
        throw new Error(`Đơn hàng đang ở trạng thái ${status}`);
      }

      if (dbStatus === "Huy") {
        const checkReceivable = await tx.receivable.findFirst({
          where: { orderId: params.id }
        });
        if (checkReceivable && checkReceivable.paidAmount > 0) {
          throw new Error(`Đơn hàng này đã được thanh toán công nợ (${checkReceivable.paidAmount.toLocaleString()} ₫). Không thể hủy trực tiếp. Vui lòng liên hệ Kế toán để xử lý hoàn tiền trước!`);
        }
      }

      // Lock row an toàn hoặc dùng updateMany để tránh Race Condition khi Hoàn Thành
      if (dbStatus === "HoanThanh") {
        const updatedCount = await tx.order.updateMany({
          where: { id: params.id, status: { not: "HoanThanh" } },
          data: { status: dbStatus as any }
        });
        if (updatedCount.count === 0) {
          throw new Error("Đơn hàng đã được hoàn thành bởi người khác");
        }
      } else {
        await tx.order.update({
          where: { id: params.id },
          data: { status: dbStatus as any }
        });
      }

      // Fetch lại order sau khi update
      const order = await tx.order.findUnique({ where: { id: params.id } }) || existingOrder;

      // Nếu đơn bị hủy và trước đó chưa hủy -> Cộng trả lại tồn kho
      if (dbStatus === "Huy") {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
        
        // Hủy luôn công nợ
        await tx.receivable.updateMany({
          where: { orderId: order.id },
          data: { status: "DaHuy" }
        });
        // Hoàn lại điểm nếu khách đã dùng hoặc đã được cộng
        const loyaltyRecords = await tx.loyaltyPoint.findMany({
          where: { orderId: order.id }
        });
        
        let pointAdjustment = 0;
        for (const lp of loyaltyRecords) {
          if (lp.type === "Redeem") {
            pointAdjustment += lp.points; // Trả lại điểm đã xài
          } else if (lp.type === "Earn") {
            pointAdjustment -= lp.points; // Thu hồi điểm đã tích
          }
        }
        
        if (pointAdjustment !== 0) {
          await tx.customer.update({
            where: { id: order.customerId },
            data: { totalPoints: { increment: pointAdjustment } }
          });
        }
        
        await tx.loyaltyPoint.deleteMany({ where: { orderId: order.id } });
      }

      // Xử lý cộng điểm tích lũy khi Hoàn Thành (Phase 2 - Loyalty)
      if (dbStatus === "HoanThanh") {
        const customer = await tx.customer.findUnique({ where: { id: order.customerId } });
        if (customer) {
          const pointsEarned = Math.floor(order.totalAmount / 100000);
          if (pointsEarned > 0) {
            await tx.customer.update({
              where: { id: order.customerId },
              data: { totalPoints: { increment: pointsEarned } }
            });
            await tx.loyaltyPoint.create({
              data: {
                customerId: order.customerId,
                orderId: order.id,
                points: pointsEarned,
                type: "Earn",
                note: `Tích điểm từ Đơn hàng ${order.orderCode}`
              }
            });
          }
        }
      }

      return order;
    });

    return NextResponse.json({ message: "Cập nhật thành công", order: result });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
