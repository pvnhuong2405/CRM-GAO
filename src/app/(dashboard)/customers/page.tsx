"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", phone: "", groupId: "", source: "Zalo" });

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importGroupId, setImportGroupId] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const fetchData = async () => {
    const [cRes, gRes] = await Promise.all([
      fetch("/api/customers"),
      fetch("/api/customer-groups")
    ]);
    const cData = await cRes.json();
    const gData = await gRes.json();
    
    if (Array.isArray(gData)) setGroups(gData);
    if (Array.isArray(cData)) {
      const gMap = gData.reduce((acc: any, g: any) => ({ ...acc, [g.id]: g.name }), {});
      const mapped = cData.map(c => ({
        ...c,
        groupName: gMap[c.groupId] || "Chưa phân loại"
      }));
      setCustomers(mapped);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    const isEditing = !!form.id;
    const url = isEditing ? `/api/customers/${form.id}` : "/api/customers";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    
    if (res.ok) {
      alert(isEditing ? "Cập nhật thành công" : "Thêm khách hàng thành công");
      setIsModalOpen(false);
      setForm({ id: "", name: "", phone: "", groupId: "", source: "Zalo" });
      fetchData();
    } else {
      const err = await res.json();
      alert("Lỗi: " + err.error);
    }
  };

  const handleEdit = (item: any) => {
    setForm({
      id: item.id,
      name: item.name,
      phone: item.phone,
      groupId: item.groupId,
      source: item.source || "Zalo"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá khách hàng này?")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Xoá thành công");
      fetchData();
    }
  };

  const handleViewHistory = async (customer: any) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
    setCustomerOrders([]); // Reset old data
    
    const res = await fetch(`/api/customers/${customer.id}/orders`);
    if (res.ok) {
      const data = await res.json();
      setCustomerOrders(data);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const handleImport = async () => {
    if (!importFile) return alert("Vui lòng chọn file Excel/CSV");
    if (!importGroupId) return alert("Vui lòng chọn Nhóm để gán cho các khách hàng này");

    setIsImporting(true);
    try {
      let data: any[] = [];
      if (importFile.name.endsWith('.csv')) {
        const text = await importFile.text();
        const result = Papa.parse(text, { header: true });
        data = result.data;
      } else {
        const arrayBuffer = await importFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      }

      // Map data to expected format
      const formattedData = data.map((row: any) => ({
        name: row["Tên"] || row["Name"] || row["Họ Tên"] || row["name"],
        phone: row["SĐT"] || row["Số điện thoại"] || row["Phone"] || row["phone"],
        groupId: importGroupId,
        source: row["Nguồn"] || row["Source"] || "Zalo"
      })).filter(c => c.name && c.phone);

      if (formattedData.length === 0) {
        setIsImporting(false);
        return alert("Không tìm thấy dữ liệu hợp lệ trong file (Cần có cột Tên/Name và SĐT/Phone)");
      }

      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers: formattedData })
      });
      
      const resData = await res.json();
      if (res.ok) {
        alert(resData.message);
        setIsImportModalOpen(false);
        setImportFile(null);
        fetchData();
      } else {
        alert("Lỗi import: " + resData.error);
      }
    } catch (err: any) {
      alert("Lỗi đọc file: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Danh sách khách hàng</h1>
        
        <div className="flex gap-2">
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => setIsImportModalOpen(true)}>
            📤 Nhập Excel/CSV
          </Button>

          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setForm({ id: "", name: "", phone: "", groupId: "", source: "Zalo" });
          }}>
            <DialogTrigger render={<Button className="bg-green-600 hover:bg-green-700">+ Thêm mới</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{form.id ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}</DialogTitle>
              </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Tên khách hàng</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: Nguyễn Văn A" />
              </div>
              <div>
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="VD: 0901234567" />
              </div>
              <div>
                <label className="text-sm font-medium">Nhóm khách hàng</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.groupId} 
                  onChange={e => setForm({...form, groupId: e.target.value})}
                >
                  <option value="">-- Chọn nhóm --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Nguồn khách hàng</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.source} 
                  onChange={e => setForm({...form, source: e.target.value})}
                >
                  <option value="Zalo">Zalo</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Web">Web</option>
                  <option value="Phone">Phone (Gọi điện)</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
                <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700">Lưu thông tin</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Modal Import */}
        <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nhập Khách Hàng từ File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-200">
                <p className="font-medium">Hướng dẫn:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>File hỗ trợ: .xlsx, .csv</li>
                  <li>Bắt buộc phải có cột <strong>Tên</strong> (hoặc Name) và <strong>SĐT</strong> (hoặc Phone).</li>
                  <li>Các số điện thoại đã tồn tại sẽ bị bỏ qua tự động.</li>
                </ul>
              </div>
              <div>
                <label className="text-sm font-medium">Chọn file dữ liệu</label>
                <Input type="file" accept=".xlsx,.csv" onChange={e => setImportFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="text-sm font-medium">Gán Nhóm mặc định cho các khách này</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={importGroupId} 
                  onChange={e => setImportGroupId(e.target.value)}
                >
                  <option value="">-- Chọn nhóm --</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || !importFile || !importGroupId}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isImporting ? "Đang xử lý..." : "Tiến hành Import"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Lịch sử mua hàng - {selectedCustomer?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4 overflow-x-auto max-h-[70vh] overflow-y-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Mã Đơn</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Kênh</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerOrders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium text-green-700">{o.orderCode}</TableCell>
                      <TableCell>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                      <TableCell>{o.channel}</TableCell>
                      <TableCell className="text-right font-medium">{o.totalAmount.toLocaleString()} ₫</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          o.status === "Hoàn thành" ? "bg-green-100 text-green-800" :
                          o.status === "Hủy" ? "bg-red-100 text-red-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {o.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {customerOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">Khách hàng này chưa có đơn hàng nào.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-4">
        <Input 
          placeholder="🔍 Tìm theo Tên hoặc Số điện thoại..." 
          className="max-w-md mb-4"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Table>
          <TableHeader>
            <TableRow className="bg-[#7cb342] hover:bg-[#7cb342]">
              <TableHead className="text-white font-medium">Họ tên</TableHead>
              <TableHead className="text-white font-medium">Số điện thoại</TableHead>
              <TableHead className="text-white font-medium">Nhóm</TableHead>
              <TableHead className="text-white font-medium">Nguồn</TableHead>
              <TableHead className="text-white font-medium text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-gray-800">{c.name}</TableCell>
                <TableCell className="text-gray-600">{c.phone}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.groupName === 'B2B' || c.groupName === 'Siêu thị' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {c.groupName}
                  </span>
                </TableCell>
                <TableCell className="text-gray-500">{c.source}</TableCell>
                <TableCell className="text-center space-x-3">
                  <button onClick={() => handleViewHistory(c)} className="text-gray-400 hover:text-indigo-600" title="Xem lịch sử">🕒</button>
                  <button onClick={() => handleEdit(c)} className="text-gray-400 hover:text-blue-600" title="Sửa">✏️</button>
                  <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-600" title="Xóa">🗑️</button>
                </TableCell>
              </TableRow>
            ))}
            {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">Không tìm thấy khách hàng</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
