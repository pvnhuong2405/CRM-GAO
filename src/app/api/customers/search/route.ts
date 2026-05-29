export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { phone: { contains: query } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: { group: true },
      take: 10
    });

    const results = customers.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      groupId: c.groupId,
      groupName: c.group.name
    }));

    if (results.length > 0) {
      return NextResponse.json({ found: true, customers: results });
    } else {
      return NextResponse.json({ found: false, customers: [] });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
