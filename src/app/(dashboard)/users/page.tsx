"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  
  const [form, setForm] = useState({ id: "", name: "", email: "", password: "", role: "sale", isActive: true });
  const [resetPassForm, setResetPassForm] = useState({ id: "", name: "", password: "" });

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.email || (!form.id && !form.password)) {
      return alert("Vui lòng điền đủ Tên, Email và Mật khẩu!");
    }

    const isEditing = !!form.id;
    const url = isEditing ? `/api/users/${form.id}` : "/api/users";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    
    if (res.ok) {
      alert(isEditing ? "Cập nhật thành công" : "Tạo tài khoản thành công");
      setIsModalOpen(false);
      setForm({ id: "", name: "", email: "", password: "", role: "sale", isActive: true });
      fetchUsers();
    } else {
      const err = await res.json();
      alert("Lỗi: " + err.error);
    }
  };

  const handleEdit = (item: any) => {
    setForm({
      id: item.id,
      name: item.name,
      email: item.email,
      password: "", // Không hiển thị pass cũ
      role: item.role,
      isActive: item.isActive
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (item: any) => {
    if (!confirm(`Bạn có chắc muốn ${item.isActive ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) return;
    const res = await fetch(`/api/users/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive })
    });
    if (res.ok) fetchUsers();
  };

  const handleResetPassword = async () => {
    if (!resetPassForm.password) return alert("Vui lòng nhập mật khẩu mới");
    const res = await fetch(`/api/users/${resetPassForm.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassForm.password })
    });
    if (res.ok) {
      alert("Đổi mật khẩu thành công!");
      setIsResetPassModalOpen(false);
      setResetPassForm({ id: "", name: "", password: "" });
    } else {
      alert("Đổi mật khẩu thất bại!");
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Quản trị viên</span>;
      case 'accounting': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Kế toán</span>;
      case 'kho': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Thủ kho</span>;
      default: return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Nhân viên Sale</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản (Nhân viên)</h1>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setForm({ id: "", name: "", email: "", password: "", role: "sale", isActive: true });
        }}>
          <DialogTrigger render={<Button className="bg-green-600 hover:bg-green-700">+ Tạo tài khoản mới</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Sửa tài khoản" : "Tạo tài khoản mới"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Họ tên nhân viên</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: Nguyễn Văn A" />
              </div>
              <div>
                <label className="text-sm font-medium">Email đăng nhập</label>
                <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!!form.id} placeholder="VD: sale1@gaovanb.com" />
              </div>
              {!form.id && (
                <div>
                  <label className="text-sm font-medium">Mật khẩu</label>
                  <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Nhập mật khẩu" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Chức vụ (Phân quyền)</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.role} 
                  onChange={e => setForm({...form, role: e.target.value})}
                >
                  <option value="sale">Nhân viên Sale</option>
                  <option value="kho">Thủ kho (Quản lý Hàng & Đơn)</option>
                  <option value="accounting">Kế toán (Công nợ & Doanh thu)</option>
                  <option value="admin">Quản trị viên (Toàn quyền)</option>
                </select>
              </div>
              <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700">Lưu thông tin</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Họ tên</TableHead>
              <TableHead>Email đăng nhập</TableHead>
              <TableHead>Phân quyền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-gray-800">{u.name}</TableCell>
                <TableCell className="text-gray-600">{u.email}</TableCell>
                <TableCell>{getRoleBadge(u.role)}</TableCell>
                <TableCell>
                  {u.isActive ? (
                    <span className="text-green-600 font-medium text-sm">Đang hoạt động</span>
                  ) : (
                    <span className="text-red-600 font-medium text-sm">Đã khóa</span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" className="text-orange-600 border-orange-200" onClick={() => {
                    setResetPassForm({ id: u.id, name: u.name, password: "" });
                    setIsResetPassModalOpen(true);
                  }}>
                    Đổi Pass
                  </Button>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200" onClick={() => handleEdit(u)}>
                    Sửa
                  </Button>
                  <Button variant="outline" size="sm" className={u.isActive ? "text-red-600 border-red-200" : "text-green-600 border-green-200"} onClick={() => handleToggleStatus(u)}>
                    {u.isActive ? "Khóa" : "Mở khóa"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">Chưa có tài khoản nào</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Reset Password */}
      <Dialog open={isResetPassModalOpen} onOpenChange={setIsResetPassModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cấp lại mật khẩu - {resetPassForm.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Mật khẩu mới</label>
              <Input type="text" value={resetPassForm.password} onChange={e => setResetPassForm({...resetPassForm, password: e.target.value})} placeholder="Nhập mật khẩu mới" />
            </div>
            <Button onClick={handleResetPassword} className="w-full bg-orange-500 hover:bg-orange-600 text-white">Xác nhận đổi mật khẩu</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
