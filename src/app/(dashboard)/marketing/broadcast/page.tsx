"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Users, History, AlertCircle } from "lucide-react";

export default function BroadcastPage() {
  const [targetGroup, setTargetGroup] = useState<"all" | "vip" | "inactive">("all");
  const [message, setMessage] = useState("Chào anh/chị, hiện tại Gạo Văn B đang có chương trình khuyến mãi tháng này. Giảm giá 10% cho các đơn hàng gạo ST25.");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ total: number; success: number; failed: number } | null>(null);

  // Giả lập số lượng khách hàng theo nhóm
  const groupCounts = {
    all: 2500,
    vip: 120,
    inactive: 850,
  };

  const handleBroadcast = async () => {
    setIsSending(true);
    setSendStatus(null);
    
    // Gọi API giả lập
    try {
      // Vì là giả lập Broadcast (gửi hàng loạt) nên ta call API 1 lần báo là thành công 
      // Trong thực tế sẽ đẩy vào Queue (RabbitMQ / BullMQ) để gửi dần
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSendStatus({
        total: groupCounts[targetGroup],
        success: groupCounts[targetGroup] - 5, // giả lập rớt mạng 5 tin
        failed: 5,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Broadcast (Gửi Zalo Hàng Loạt)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gửi tin nhắn Khuyến mãi, Chăm sóc khách hàng tới hàng ngàn khách hàng cùng lúc (Mô phỏng).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form cấu hình */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tạo chiến dịch tin nhắn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Tệp khách hàng nhận tin</Label>
              <div className="flex flex-col gap-2">
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${targetGroup === "all" ? "border-green-500 bg-green-50" : "hover:bg-muted"}`}
                  onClick={() => setTargetGroup("all")}
                >
                  <div className="font-medium text-sm flex justify-between">
                    <span>Tất cả khách hàng (Đã từng mua)</span>
                    <Badge variant="secondary">{groupCounts.all} KH</Badge>
                  </div>
                </div>
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${targetGroup === "vip" ? "border-green-500 bg-green-50" : "hover:bg-muted"}`}
                  onClick={() => setTargetGroup("vip")}
                >
                  <div className="font-medium text-sm flex justify-between">
                    <span className="text-amber-600">Khách hàng VIP (Mua nhiều, thường xuyên)</span>
                    <Badge variant="secondary">{groupCounts.vip} KH</Badge>
                  </div>
                </div>
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${targetGroup === "inactive" ? "border-green-500 bg-green-50" : "hover:bg-muted"}`}
                  onClick={() => setTargetGroup("inactive")}
                >
                  <div className="font-medium text-sm flex justify-between">
                    <span className="text-slate-500">Khách hàng ngủ đông (&gt;60 ngày chưa mua)</span>
                    <Badge variant="secondary">{groupCounts.inactive} KH</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Nội dung tin nhắn Zalo (ZNS)</Label>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Độ dài: {message.length}/500 ký tự. Hệ thống tự điền tên khách hàng (vd: Chào anh Tâm,...).
              </p>
            </div>

            <Button 
              className="w-full bg-[#0068ff] hover:bg-[#0054cc] text-white" 
              onClick={handleBroadcast}
              disabled={isSending || message.trim() === ""}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? "Đang gửi hàng loạt..." : `Bắn tin cho ${groupCounts[targetGroup]} khách hàng`}
            </Button>
          </CardContent>
        </Card>

        {/* Kết quả */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trạng thái gửi (Realtime)</CardTitle>
            </CardHeader>
            <CardContent>
              {sendStatus ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                    <span className="text-sm font-medium">Tổng tệp:</span>
                    <span className="font-bold">{sendStatus.total}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg bg-green-50">
                    <span className="text-sm font-medium text-green-700">Thành công (Đã nhận):</span>
                    <span className="font-bold text-green-700">{sendStatus.success}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg bg-red-50">
                    <span className="text-sm font-medium text-red-700">Thất bại (Chưa Follow OA / Lỗi số):</span>
                    <span className="font-bold text-red-700">{sendStatus.failed}</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-center text-muted-foreground">
                      Chi phí ZNS ước tính (Mock): <strong className="text-amber-600">{(sendStatus.success * 200).toLocaleString('vi-VN')} đ</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <History className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">Chưa có tiến trình nào đang chạy.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
