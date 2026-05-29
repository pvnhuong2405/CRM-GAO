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
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" }
    });
    const prices = await prisma.priceList.findMany();
    
    return NextResponse.json({
      products,
      prices
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { skuCode, name, packagingKg, retailPrice, b2bPrice, sieuThiPrice, stock } = body;

    if (!skuCode || !name || !packagingKg) {
      return NextResponse.json({ error: "Vui lòng nhập đủ thông tin sản phẩm" }, { status: 400 });
    }

    const groups = await prisma.customerGroup.findMany();
    const retailGroup = groups.find(g => g.name === "Le");
    const b2bGroup = groups.find(g => g.name === "B2B");
    const sieuThiGroup = groups.find(g => g.name === "SieuThi");

    const priceData = [];
    if (retailGroup && retailPrice !== undefined) {
      priceData.push({ groupId: retailGroup.id, price: retailPrice });
    }
    if (b2bGroup && b2bPrice !== undefined) {
      priceData.push({ groupId: b2bGroup.id, price: b2bPrice });
    }
    if (sieuThiGroup && sieuThiPrice !== undefined) {
      priceData.push({ groupId: sieuThiGroup.id, price: sieuThiPrice });
    }

    const newProduct = await prisma.product.create({
      data: {
        skuCode, 
        name, 
        packagingKg, 
        basePrice: retailPrice || 0, 
        stock: stock || 0,
        priceLists: {
          create: priceData
        }
      }
    });

    return NextResponse.json({ message: "Thêm sản phẩm thành công", product: newProduct });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
