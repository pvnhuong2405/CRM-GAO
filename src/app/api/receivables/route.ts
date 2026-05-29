export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const receivables = await prisma.receivable.findMany({
      include: {
        customer: true,
        order: true
      },
      orderBy: { createdAt: "desc" }
    });

    const mapped = receivables.map(r => ({
      id: r.id,
      customer: r.customer,
      order: r.order,
      totalDebt: r.totalDebt,
      paidAmount: r.paidAmount,
      dueDate: r.dueDate,
      status: r.status === "ChuaThanhToan" ? "Chưa thanh toán" : r.status === "ThanhToanMotPhan" ? "Thanh toán một phần" : r.status === "DaThanhToan" ? "Đã thanh toán" : "Đã hủy",
      createdAt: r.createdAt
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
