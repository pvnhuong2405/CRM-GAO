import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { customers } = await req.json();

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({ error: "Invalid data format or empty array" }, { status: 400 });
    }

    // Filter valid customers
    const validCustomers = customers.filter(c => c.name && c.phone && c.groupId);

    if (validCustomers.length === 0) {
       return NextResponse.json({ error: "No valid customers found in the file." }, { status: 400 });
    }

    const dataToInsert = validCustomers.map(c => ({
      name: c.name,
      phone: c.phone.replace(/[^0-9]/g, ''), // Ensure phone only has digits
      groupId: c.groupId,
      source: c.source || "Khac"
    }));

    // Bulk insert using Prisma createMany with skipDuplicates to ignore existing phones
    const result = await prisma.customer.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Imported ${result.count} customers successfully. Skipped duplicates.`,
      count: result.count
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
