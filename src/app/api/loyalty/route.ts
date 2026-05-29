import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    if (customerId) {
      // Lấy lịch sử điểm của 1 khách hàng cụ thể
      const history = await prisma.loyaltyPoint.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        include: { order: true }
      });
      return NextResponse.json(history);
    } else {
      // Lấy danh sách khách hàng xếp hạng theo điểm
      const customers = await prisma.customer.findMany({
        where: { totalPoints: { gt: 0 } },
        orderBy: { totalPoints: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          phone: true,
          totalPoints: true,
          createdAt: true
        }
      });
      return NextResponse.json(customers);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
