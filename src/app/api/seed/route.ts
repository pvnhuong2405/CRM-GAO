export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only Admin can seed data." }, { status: 403 });
    }

    // 1. Clear database
    await prisma.receivable.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.priceList.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.customerGroup.deleteMany();
    await prisma.user.deleteMany();

    // 2. Tạo User Admin
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: "admin@gaovanb.com",
        name: "Admin Văn B",
        role: "admin",
        passwordHash,
      }
    });

    const saleHash = await bcrypt.hash("sale123", 10);
    await prisma.user.create({
      data: {
        email: "sale1@gaovanb.com",
        name: "Nhân viên Sale 1",
        role: "sale",
        passwordHash: saleHash,
      }
    });

    // 3. Tạo Customer Groups
    const leGroup = await prisma.customerGroup.create({ data: { name: "Le", description: "Khách lẻ mua theo túi" } });
    const b2bGroup = await prisma.customerGroup.create({ data: { name: "B2B", description: "Đại lý, quán ăn nhỏ" } });
    const sieuthiGroup = await prisma.customerGroup.create({ data: { name: "SieuThi", description: "Siêu thị đối tác" } });

    // 4. Tạo Sản phẩm gạo
    const p1 = await prisma.product.create({
      data: {
        skuCode: "ST25-05", name: "Gạo ST25 Ông Cua", packagingKg: 5, basePrice: 180000, stock: 100
      }
    });
    const p2 = await prisma.product.create({
      data: {
        skuCode: "ST24-10", name: "Gạo ST24 Sóc Trăng", packagingKg: 10, basePrice: 300000, stock: 50
      }
    });
    const p3 = await prisma.product.create({
      data: {
        skuCode: "NHI-25", name: "Gạo Nhài Thơm", packagingKg: 25, basePrice: 450000, stock: 200
      }
    });

    // 5. Tạo Price Lists
    await prisma.priceList.createMany({
      data: [
        { productId: p1.id, groupId: leGroup.id, price: 180000 },
        { productId: p1.id, groupId: b2bGroup.id, price: 165000 },
        { productId: p1.id, groupId: sieuthiGroup.id, price: 160000 },
        { productId: p2.id, groupId: leGroup.id, price: 300000 },
        { productId: p2.id, groupId: b2bGroup.id, price: 280000 },
        { productId: p3.id, groupId: leGroup.id, price: 450000 },
        { productId: p3.id, groupId: b2bGroup.id, price: 410000 },
        { productId: p3.id, groupId: sieuthiGroup.id, price: 400000 },
      ]
    });

    // 6. Tạo Khách hàng
    await prisma.customer.create({
      data: { name: "Nguyễn Văn A", phone: "0901234567", groupId: leGroup.id, source: "Zalo" }
    });
    await prisma.customer.create({
      data: { name: "Trần Thị B", phone: "0987654321", groupId: leGroup.id, source: "Facebook" }
    });
    await prisma.customer.create({
      data: { name: "Đại lý Minh Trí", phone: "0911223344", groupId: b2bGroup.id, source: "Phone" }
    });

    return NextResponse.json({ message: "Seed dữ liệu lên Supabase thành công!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
