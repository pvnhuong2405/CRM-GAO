export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
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

      const order = await tx.order.update({
        where: { id: params.id },
        data: { status: dbStatus as any }
      });

      // Nếu đơn bị hủy và trước đó chưa hủy -> Cộng trả lại tồn kho
      if (dbStatus === "Huy" && existingOrder.status !== "Huy") {
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
      }

      // Xử lý cộng điểm tích lũy khi Hoàn Thành (Phase 2 - Loyalty)
      if (dbStatus === "HoanThanh" && existingOrder.status !== "HoanThanh") {
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
