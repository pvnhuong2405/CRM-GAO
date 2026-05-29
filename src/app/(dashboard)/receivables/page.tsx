"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<any[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const fetchData = async () => {
    const res = await fetch("/api/receivables");
    if (res.ok) {
      const data = await res.json();
      const mapped = data.map((r: any) => ({
        id: r.id,
        customerName: r.customer?.name || "Không rõ",
        orderCode: r.order?.orderCode || "N/A",
        totalDebt: r.totalDebt || 0,
        paidAmount: r.paidAmount || 0,
        dueDate: r.dueDate ? new Date(r.dueDate).toLocaleDateString("vi-VN") : "N/A",
        status: r.status
      }));
      setReceivables(mapped);
      
      const sum = mapped.reduce((acc: number, curr: any) => {
        if (curr.status === "Đã hủy") return acc;
        return acc + (curr.totalDebt - curr.paidAmount);
      }, 0);
      setTotalDebt(sum);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPaymentModal = (item: any) => {
    setSelectedReceivable(item);
    setPaymentAmount(item.totalDebt - item.paidAmount); // Gợi ý thanh toán nốt phần còn lại
    setIsModalOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedReceivable || paymentAmount <= 0) return;

    const res = await fetch(`/api/receivables/${selectedReceivable.id}/pay`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAmount: paymentAmount })
    });

    if (res.ok) {
      alert("Thanh toán thành công!");
      setIsModalOpen(false);
      fetchData();
    } else {
      const err = await res.json();
      alert("Lỗi: " + err.error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý công nợ B2B</h1>
          <p className="text-gray-500 mt-1">Tổng Số tiền nợ: <span className="font-bold text-red-600 text-xl">{totalDebt.toLocaleString()} VNĐ</span></p>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi nhận thanh toán</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedReceivable && (
              <>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>Khách hàng: <strong>{selectedReceivable.customerName}</strong></p>
                  <p>Mã Đơn: <strong>{selectedReceivable.orderCode}</strong></p>
                  <p>Số tiền nợ còn lại: <strong className="text-red-600">{(selectedReceivable.totalDebt - selectedReceivable.paidAmount).toLocaleString()} ₫</strong></p>
                </div>
                <div>
                  <label className="text-sm font-medium">Khách hàng trả số tiền (VND):</label>
                  <Input 
                    type="number" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(Number(e.target.value))} 
                    max={selectedReceivable.totalDebt - selectedReceivable.paidAmount}
                  />
                </div>
                <Button onClick={handlePayment} className="w-full bg-green-600 hover:bg-green-700">Lưu thanh toán</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-sm">
              <th className="p-4 font-medium">Khách hàng</th>
              <th className="p-4 font-medium">Mã Đơn hàng</th>
              <th className="p-4 font-medium">Hạn thanh toán</th>
              <th className="p-4 font-medium text-right">Giá trị Đơn</th>
              <th className="p-4 font-medium text-right text-red-600">Số tiền Nợ</th>
              <th className="p-4 font-medium text-right">Đã Thanh toán</th>
              <th className="p-4 font-medium text-center">Trạng thái</th>
              <th className="p-4 font-medium text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {receivables.length > 0 ? receivables.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{r.customerName}</td>
                <td className="p-4 text-gray-600">{r.orderCode}</td>
                <td className="p-4 text-red-600 font-medium">{r.dueDate}</td>
                <td className="p-4 text-right font-medium">{r.totalDebt.toLocaleString()} ₫</td>
                <td className="p-4 text-right font-bold text-red-600">
                  {r.status === 'Đã hủy' ? '0' : (r.totalDebt - r.paidAmount).toLocaleString()} ₫
                </td>
                <td className="p-4 text-right text-gray-600">{r.paidAmount.toLocaleString()} ₫</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    r.status === 'Đã thanh toán' ? 'bg-green-100 text-green-800' : 
                    r.status === 'Đã hủy' ? 'bg-gray-100 text-gray-600' : 
                    r.status.includes('Quá hạn') ? 'bg-red-600 text-white shadow-sm' :
                    r.status === 'Thanh toán một phần' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {r.status !== 'Đã thanh toán' && r.status !== 'Đã hủy' && (
                    <button onClick={() => openPaymentModal(r)} className="text-green-600 hover:underline">Thanh toán</button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500 py-8">
                  Chưa có dữ liệu công nợ nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
