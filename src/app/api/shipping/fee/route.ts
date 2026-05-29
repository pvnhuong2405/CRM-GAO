import { NextResponse } from "next/server";
import { calculateShippingFee } from "@/lib/shipping/service";

export async function POST(req: Request) {
  try {
    const { provider, address, totalWeightKg } = await req.json();

    if (!provider || !address) {
      return NextResponse.json({ error: "Thiếu thông tin provider hoặc address" }, { status: 400 });
    }

    const fee = await calculateShippingFee(provider, address, totalWeightKg || 0);

    return NextResponse.json({ fee, provider });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
