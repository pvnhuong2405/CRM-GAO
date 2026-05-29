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

    const mapped = receivables.map(r => {
      let mappedStatus = r.status === "ChuaThanhToan" ? "Chưa thanh toán" : r.status === "ThanhToanMotPhan" ? "Thanh toán một phần" : r.status === "DaThanhToan" ? "Đã thanh toán" : "Đã hủy";
      
      const now = new Date();
      if ((r.status === "ChuaThanhToan" || r.status === "ThanhToanMotPhan") && new Date(r.dueDate) < now) {
        const diffTime = Math.abs(now.getTime() - new Date(r.dueDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        mappedStatus = `Quá hạn (${diffDays} ngày)`;
      }

      return {
        id: r.id,
        customer: r.customer,
        order: r.order,
        totalDebt: r.totalDebt,
        paidAmount: r.paidAmount,
        dueDate: r.dueDate,
        status: mappedStatus,
        createdAt: r.createdAt
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
