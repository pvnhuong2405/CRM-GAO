import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, customerName, templateId, message } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Số điện thoại không được để trống" },
        { status: 400 }
      );
    }

    // MÔ PHỎNG: Log lịch sử nhắn tin ra console (Sau này thay bằng DB)
    console.log(`[MOCK ZALO API] Đang gửi tin nhắn Zalo ZNS tới: ${phone}...`);
    console.log(`[MOCK ZALO API] Tên khách: ${customerName || "Khách hàng"}`);
    console.log(`[MOCK ZALO API] Nội dung: ${message || "Cảm ơn quý khách đã mua gạo!"}`);

    // Giả lập thời gian delay của API thật (1 giây)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // MÔ PHỎNG: Trả về kết quả thành công
    return NextResponse.json(
      {
        success: true,
        message: "Gửi tin nhắn Zalo (mô phỏng) thành công",
        data: {
          messageId: `mock-msg-${Date.now()}`,
          status: "delivered",
          sentAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Zalo Mock API Error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi gửi tin nhắn Zalo" },
      { status: 500 }
    );
  }
}
