export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Only Admin can debug data." }, { status: 403 });
  }

  const customer = await prisma.customer.findFirst({ where: { phone: "0911223344" } });
  const prices = await prisma.priceList.findMany();
  return NextResponse.json({ customer, prices });
}
