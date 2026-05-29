"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, MessageSquare, CheckCircle2, History } from "lucide-react";

type ReminderCustomer = {
  id: string;
  name: string;
  phone: string;
  lastOrderDate: string;
  lastOrderAmount: number;
  totalKg: number;
  avgKgPerDay: number | null;
  familySize: number | null;
  estimatedDaysLeft: number;
  status: "need_reminder" | "reminded" | "purchased";
};

// Mock data Phase 2
const MOCK_DATA: ReminderCustomer[] = [
  {
    id: "1",
    name: "Cô Lan Quận 7",
    phone: "0901234567",
    lastOrderDate: "2024-04-15T08:00:00Z",
    lastOrderAmount: 250000,
    totalKg: 10,
    avgKgPerDay: 0.5,
    familySize: 4,
    estimatedDaysLeft: -2,
    status: "need_reminder",
  },
  {
    id: "2",
    name: "Chú Bình Tân Bình",
    phone: "0987654321",
    lastOrderDate: "2024-04-20T10:30:00Z",
    lastOrderAmount: 120000,
    totalKg: 5,
    avgKgPerDay: 0.3,
    familySize: 2,
    estimatedDaysLeft: 1,
    status: "need_reminder",
  },
  {
    id: "3",
    name: "Chị Hoa Thủ Đức",
    phone: "0911223344",
    lastOrderDate: "2024-04-25T14:00:00Z",
    lastOrderAmount: 500000,
    totalKg: 20,
    avgKgPerDay: 0.8,
    familySize: 6,
    estimatedDaysLeft: 5,
    status: "purchased",
  },
];

export default function RemindersPage() {
  const [customers, setCustomers] = useState<ReminderCustomer[]>(MOCK_DATA);
  const [search, setSearch] = useState("");
  const [isSending, setIsSending] = useState<string | null>(null);

  const handleSendZalo = async (customer: ReminderCustomer) => {
    setIsSending(customer.id);
    try {
      const res = await fetch("/api/zalo/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: customer.phone,
          customerName: customer.name,
          message: `Dạ Gạo Văn B chào ${customer.name}. Không biết đợt gạo trước nhà mình dùng đã sắp hết chưa ạ? Anh/chị cần đặt thêm cứ nhắn em giao qua tận nơi nhé!`,
        }),
      });

      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, status: "reminded" } : c))
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(null);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nhắc Mua Lại (Zalo)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Danh sách khách hàng sắp hết gạo dựa trên dự đoán lịch sử mua hàng.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Danh sách cần nhắc nhở</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm tên, SĐT..."
                  className="pl-8 w-[250px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Đơn gần nhất</TableHead>
                  <TableHead className="text-center">Số Kg / Người</TableHead>
                  <TableHead>Dự đoán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(c.lastOrderDate), "dd/MM/yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mua {c.totalKg}kg
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm">{c.familySize || "?"} người</div>
                      <div className="text-xs text-muted-foreground">
                        ~{c.avgKgPerDay || "?"}kg/ngày
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.estimatedDaysLeft < 0 ? (
                        <span className="text-destructive font-medium text-sm">
                          Đã hết {Math.abs(c.estimatedDaysLeft)} ngày
                        </span>
                      ) : c.estimatedDaysLeft <= 3 ? (
                        <span className="text-orange-500 font-medium text-sm">
                          Còn ~{c.estimatedDaysLeft} ngày
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Còn ~{c.estimatedDaysLeft} ngày
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.status === "need_reminder" ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Chưa nhắc
                        </Badge>
                      ) : c.status === "reminded" ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Đã gửi Zalo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Đã mua lại
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.status === "need_reminder" ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-[#0068ff] hover:bg-[#0054cc] text-white"
                          disabled={isSending === c.id}
                          onClick={() => handleSendZalo(c)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {isSending === c.id ? "Đang gửi..." : "Gửi Zalo"}
                        </Button>
                      ) : c.status === "reminded" ? (
                        <Button size="sm" variant="outline" className="text-blue-600" disabled>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Đã nhắc
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled>
                          <History className="w-4 h-4 mr-2" />
                          Hoàn tất
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy khách hàng nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
