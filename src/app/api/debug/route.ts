export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const customer = await prisma.customer.findFirst({ where: { phone: "0911223344" } });
  const prices = await prisma.priceList.findMany();
  return NextResponse.json({ customer, prices });
}
