import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, phone, groupId, source } = body;

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: { name, phone, groupId, source }
    });

    return NextResponse.json({ message: "Cập nhật thành công", customer });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.customer.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Xóa thành công" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
