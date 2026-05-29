import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (body.stock === undefined || isNaN(Number(body.stock))) {
      return NextResponse.json({ error: "Dữ liệu tồn kho không hợp lệ" }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { stock: Number(body.stock) }
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("PATCH stock error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
