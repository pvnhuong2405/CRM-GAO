import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const orders = await prisma.order.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" }
    });
    
    // Map status
    const mapped = orders.map(o => ({
      id: o.id,
      orderCode: o.orderCode,
      channel: o.channel,
      status: o.status === "Moi" ? "Mới" : o.status === "ChoGiao" ? "Chờ giao" : o.status === "DangGiao" ? "Đang giao" : o.status === "HoanThanh" ? "Hoàn thành" : "Hủy",
      totalAmount: o.totalAmount,
      createdAt: o.createdAt
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
