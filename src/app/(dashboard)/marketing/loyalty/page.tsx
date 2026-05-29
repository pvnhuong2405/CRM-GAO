"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Gift, Search, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LoyaltyPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch("/api/loyalty");
    const data = await res.json();
    if(Array.isArray(data)) setCustomers(data);
  };

  const handleViewHistory = async (customer: any) => {
    setSelectedCustomer(customer);
    const res = await fetch(`/api/loyalty?customerId=${customer.id}`);
    const data = await res.json();
    if(Array.isArray(data)) setHistory(data);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <Award className="h-6 w-6 text-indigo-600" /> Tích Điểm Đổi Quà (Loyalty)
          </h1>
          <p className="text-gray-500 mt-1">Cấu hình hệ thống: 100.000 VNĐ = 1 điểm (1 điểm = 1.000 VNĐ khi trừ vào đơn).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">Bảng Xếp Hạng Khách Hàng</h2>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Khách hàng</TableHead>
                <TableHead className="text-center">Số Điểm</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-bold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.phone}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-sm font-bold">
                      {c.totalPoints} Điểm
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleViewHistory(c)} className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                      Lịch sử
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">Chưa có khách hàng nào được tích điểm.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
            Lịch sử Điểm - {selectedCustomer ? selectedCustomer.name : "Vui lòng chọn Khách hàng"}
          </h2>
          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Tổng điểm hiện có:</span>
                  <span className="text-xl font-bold text-indigo-600">{selectedCustomer.totalPoints}</span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Lý do</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(h.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        {h.type === "Earn" ? (
                          <span className="text-green-600 font-bold">+{h.points}</span>
                        ) : (
                          <span className="text-red-600 font-bold">-{h.points}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{h.note}</TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-gray-500">Không có lịch sử.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
              <Info className="h-10 w-10 text-indigo-200 mb-2" />
              Chọn một khách hàng bên trái để xem chi tiết lịch sử tích và tiêu điểm.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
