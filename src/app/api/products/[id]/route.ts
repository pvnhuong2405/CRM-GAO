import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { skuCode, name, packagingKg, retailPrice, b2bPrice } = body;

    if (!skuCode || !name || !packagingKg) {
      return NextResponse.json({ error: "Vui lòng nhập đủ thông tin sản phẩm" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { skuCode, name, packagingKg, basePrice: retailPrice || 0 }
    });

    const groups = await prisma.customerGroup.findMany();
    const retailGroup = groups.find(g => g.name === "Le");
    const b2bGroup = groups.find(g => g.name === "B2B");

    if (retailGroup && retailPrice !== undefined) {
      await prisma.priceList.upsert({
        where: { productId_groupId: { productId: product.id, groupId: retailGroup.id } },
        update: { price: retailPrice },
        create: { productId: product.id, groupId: retailGroup.id, price: retailPrice }
      });
    }
    
    if (b2bGroup && b2bPrice !== undefined) {
      await prisma.priceList.upsert({
        where: { productId_groupId: { productId: product.id, groupId: b2bGroup.id } },
        update: { price: b2bPrice },
        create: { productId: product.id, groupId: b2bGroup.id, price: b2bPrice }
      });
    }

    return NextResponse.json({ message: "Cập nhật sản phẩm thành công", product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Xoá sản phẩm thành công" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
