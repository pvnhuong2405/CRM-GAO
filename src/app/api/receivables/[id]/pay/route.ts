import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const amount = body.amount ?? body.paidAmount;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const receivable = await tx.receivable.findUnique({ where: { id: params.id } });
      if (!receivable) throw new Error("Không tìm thấy công nợ");

      const newPaidAmount = receivable.paidAmount + Number(amount);
      let status = "ThanhToanMotPhan";
      if (newPaidAmount >= receivable.totalDebt) {
        status = "DaThanhToan";
      }

      const updated = await tx.receivable.update({
        where: { id: params.id },
        data: {
          paidAmount: newPaidAmount,
          status: status as any
        }
      });
      return updated;
    });

    return NextResponse.json({ message: "Thanh toán thành công", receivable: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
