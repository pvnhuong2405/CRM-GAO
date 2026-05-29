export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: { group: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, groupId, source } = body;

    if (!name || !phone || !groupId) {
      return NextResponse.json({ error: "Vui lòng nhập đủ thông tin" }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: "Số điện thoại đã tồn tại" }, { status: 400 });
    }

    const newCustomer = await prisma.customer.create({
      data: { name, phone, groupId, source: source || "Zalo" }
    });

    return NextResponse.json({ message: "Thêm khách hàng thành công", customer: newCustomer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
