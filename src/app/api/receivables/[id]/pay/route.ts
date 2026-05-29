import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body.amount ?? body.paidAmount);

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const receivable = await tx.receivable.findUnique({ where: { id: params.id } });
      if (!receivable) throw new Error("Không tìm thấy công nợ");

      const remainingDebt = receivable.totalDebt - receivable.paidAmount;
      if (amount > remainingDebt) {
        throw new Error(`Số tiền thanh toán (${amount}) vượt quá dư nợ còn lại (${remainingDebt})`);
      }

      // Tăng atomic để chống race condition
      const updated = await tx.receivable.update({
        where: { id: params.id },
        data: {
          paidAmount: { increment: amount }
        }
      });

      // Cập nhật trạng thái sau khi đã tăng tiền an toàn
      let status = "ThanhToanMotPhan";
      if (updated.paidAmount >= updated.totalDebt) {
        status = "DaThanhToan";
      }

      const finalReceivable = await tx.receivable.update({
        where: { id: params.id },
        data: { status: status as any }
      });

      return finalReceivable;
    });

    return NextResponse.json({ message: "Thanh toán thành công", receivable: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
