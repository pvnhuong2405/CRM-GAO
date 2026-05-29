import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { stock } = await req.json();

    if (stock === undefined) {
      return NextResponse.json({ error: "Thiếu dữ liệu tồn kho" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { stock: Number(stock) }
    });

    return NextResponse.json({ message: "Cập nhật tồn kho thành công", stock: product.stock });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
