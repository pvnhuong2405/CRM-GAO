"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, RefreshCw, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    if(Array.isArray(data)) {
      setOrders(data);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleChangeStatus = async (orderId: string, newStatus: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      alert("Cập nhật trạng thái thành công!");
      fetchOrders();
    } else {
      alert("Cập nhật thất bại");
    }
  };

  const handlePushShipment = async (orderId: string) => {
    if (!confirm("Bạn có chắc muốn đẩy đơn hàng này qua đối tác vận chuyển?")) return;
    const res = await fetch(`/api/shipping/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId })
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Đẩy đơn thành công! Mã Tracking: ${data.trackingCode}`);
      fetchOrders();
    } else {
      alert(`Lỗi: ${data.error}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Mới": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Đang đóng gói": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Đang giao": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Hoàn thành": return "bg-green-50 text-green-700 border-green-200";
      case "Hủy": return "bg-red-50 text-red-700 border-red-200";
      default: return "";
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all") {
      if (statusFilter === "new" && o.status !== "Mới") return false;
      if (statusFilter === "packing" && o.status !== "Đang đóng gói") return false;
      if (statusFilter === "delivering" && o.status !== "Đang giao") return false;
      if (statusFilter === "done" && o.status !== "Hoàn thành") return false;
      if (statusFilter === "cancel" && o.status !== "Hủy") return false;
    }
    
    if (dateFilter !== "all") {
      const orderDate = new Date(o.createdAt);
      const today = new Date();
      if (dateFilter === "today") {
        if (orderDate.toDateString() !== today.toDateString()) return false;
      } else if (dateFilter === "week") {
        const diffTime = Math.abs(today.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays > 7) return false;
      }
    }
    
    return true;
  });

  const ordersToday = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Danh sách đơn hàng</h1>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-green-800 shadow-sm">
            <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
            <span className="font-medium">Hôm nay: <span className="font-bold">{ordersToday} đơn</span></span>
          </div>
          <Link href="/orders/new">
            <Button className="bg-green-600 hover:bg-green-700"><Plus className="mr-2 h-4 w-4" /> Tạo Đơn Nhanh</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-t-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center space-x-3">
          <span className="mr-2 font-medium text-gray-500">Lọc:</span>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="new">Mới</SelectItem>
              <SelectItem value="packing">Đang đóng gói</SelectItem>
              <SelectItem value="delivering">Đang giao</SelectItem>
              <SelectItem value="done">Hoàn thành</SelectItem>
              <SelectItem value="cancel">Hủy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={(val) => setDateFilter(val || "all")}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Thời gian" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="week">7 ngày qua</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" className="text-gray-500" onClick={fetchOrders}><RefreshCw className="mr-2 h-4 w-4" /> Làm mới</Button>
        </div>
        <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
          <Download className="mr-2 h-4 w-4" /> Xuất Excel
        </Button>
      </div>

      <div className="rounded-b-xl border-x border-b border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12"><Checkbox /></TableHead>
              <TableHead>Mã Đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Kênh</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Vận chuyển</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((o) => (
              <TableRow key={o.id}>
                <TableCell><Checkbox /></TableCell>
                <TableCell>
                  <div 
                    className="font-bold text-green-700 cursor-pointer hover:underline"
                    onClick={() => { setSelectedOrder(o); setIsModalOpen(true); }}
                  >
                    {o.orderCode}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">{o.customer?.name || "Khách ẩn danh"}</div>
                  <div className="text-xs text-gray-500">{o.customer?.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">{o.channel}</Badge>
                </TableCell>
                <TableCell className="font-medium text-gray-800">
                  {o.totalAmount?.toLocaleString()} ₫
                </TableCell>
                <TableCell>
                  {o.shipment ? (
                    <div className="flex flex-col space-y-1">
                      <Badge variant="secondary" className="w-fit">{o.shipment.provider}</Badge>
                      {o.shipment.trackingCode ? (
                        <a href="#" className="text-xs text-blue-600 hover:underline">
                          Mã: {o.shipment.trackingCode}
                        </a>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-orange-50 text-orange-700 border-orange-200" onClick={() => handlePushShipment(o.id)}>
                          Đẩy đơn
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Tự giao</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(o.createdAt).toLocaleString("vi-VN")}
                </TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={(val) => handleChangeStatus(o.id, val)}>
                    <SelectTrigger className={`h-8 w-32 ${getStatusColor(o.status)} font-medium`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mới">Mới</SelectItem>
                      <SelectItem value="Đang đóng gói">Đang đóng gói</SelectItem>
                      <SelectItem value="Đang giao">Đang giao</SelectItem>
                      <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
                      <SelectItem value="Hủy">Hủy đơn</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">Không tìm thấy đơn hàng nào phù hợp.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Chi tiết đơn hàng */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Đơn hàng: <span className="text-green-700">{selectedOrder?.orderCode}</span></DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 py-4 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-gray-500 mb-1">Khách hàng</p>
                  <p className="font-medium text-gray-900">{selectedOrder.customer?.name}</p>
                  <p>{selectedOrder.customer?.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Kênh đặt hàng</p>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">{selectedOrder.channel}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Trạng thái hiện tại</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Ngày đặt</p>
                  <p>{new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 text-gray-800">Sản phẩm đã mua</h3>
                <div className="border rounded-lg overflow-x-auto">
                  <Table className="w-full min-w-[500px]">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Tên mặt hàng</TableHead>
                        <TableHead className="text-center">Số lượng</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items && selectedOrder.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-gray-800">{item.product?.name || "SP đã bị xoá"}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right text-gray-600">{item.unitPrice.toLocaleString()} ₫</TableCell>
                          <TableCell className="text-right font-medium">{(item.quantity * item.unitPrice).toLocaleString()} ₫</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-dashed text-sm">
                <div className="space-y-2 text-right w-64">
                  {selectedOrder.shipment && (
                    <div className="flex justify-between text-gray-600">
                      <span>Phí vận chuyển ({selectedOrder.shipment.provider}):</span>
                      <span>+{selectedOrder.shipment.shippingFee.toLocaleString()} ₫</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Tổng thanh toán:</span>
                    <span className="text-red-600">{selectedOrder.totalAmount.toLocaleString()} ₫</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
