import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createShipmentOrder } from "@/lib/shipping/service";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Thiếu orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, shipment: true }
    });

    if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
    if (!order.shipment) return NextResponse.json({ error: "Đơn hàng này không có dữ liệu vận chuyển" }, { status: 400 });
    if (order.shipment.trackingCode) return NextResponse.json({ error: "Đơn hàng đã được đẩy qua đơn vị vận chuyển" }, { status: 400 });

    const result = await createShipmentOrder(
      order.shipment.provider as "Ahamove" | "GHN" | "ViettelPost",
      order.id,
      order.customer?.name || "Khách",
      order.customer?.phone || "000",
      "Mock Address",
      order.totalAmount,
      order.note || ""
    );

    if (result.success) {
      await prisma.shipment.update({
        where: { id: order.shipment.id },
        data: {
          trackingCode: result.trackingCode,
          status: "Delivering" // Mock: Đã đẩy qua ĐVVC
        }
      });
      // Tự động đổi trạng thái đơn hàng sang "Chờ giao" hoặc "Đang giao"
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "DangGiao" }
      });
      return NextResponse.json({ success: true, trackingCode: result.trackingCode });
    } else {
      return NextResponse.json({ error: "Lỗi từ Đơn vị vận chuyển" }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
