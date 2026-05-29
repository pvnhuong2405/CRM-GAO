"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ProductsPage() {
  const [productData, setProductData] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: "", skuCode: "", name: "", packagingKg: 10, retailPrice: 0, b2bPrice: 0, sieuThiPrice: 0 });

  const fetchData = async () => {
    const [pRes, gRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/customer-groups")
    ]);
    const pData = await pRes.json();
    const gData = await gRes.json();

    if (Array.isArray(gData)) setGroups(gData);
    
    if (pData.products && pData.prices && Array.isArray(gData)) {
      const retailGroup = gData.find(g => g.name === "Le");
      const b2bGroup = gData.find(g => g.name === "B2B");
      const sieuThiGroup = gData.find(g => g.name === "SieuThi" || g.name === "Siêu thị");

      const mapped = pData.products.map((p: any) => {
        const retailPrice = pData.prices.find((pl: any) => pl.productId === p.id && pl.groupId === retailGroup?.id);
        const b2bPrice = pData.prices.find((pl: any) => pl.productId === p.id && pl.groupId === b2bGroup?.id);
        const sieuThiPrice = pData.prices.find((pl: any) => pl.productId === p.id && pl.groupId === sieuThiGroup?.id);
        
        return {
          id: p.id,
          skuCode: p.skuCode,
          name: p.name,
          packagingKg: p.packagingKg,
          retailPrice: retailPrice ? retailPrice.price : 0,
          b2bPrice: b2bPrice ? b2bPrice.price : 0,
          sieuThiPrice: sieuThiPrice ? sieuThiPrice.price : 0,
          stock: Math.floor(Math.random() * 100) + 10 // stock mẫu
        };
      });
      setProductData(mapped);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    const isEditing = !!form.id;
    const url = isEditing ? `/api/products/${form.id}` : "/api/products";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    
    if (res.ok) {
      alert(isEditing ? "Cập nhật thành công" : "Thêm sản phẩm thành công");
      setIsModalOpen(false);
      setForm({ id: "", skuCode: "", name: "", packagingKg: 10, retailPrice: 0, b2bPrice: 0, sieuThiPrice: 0 });
      fetchData();
    } else {
      const err = await res.json();
      alert("Lỗi: " + err.error);
    }
  };

  const handleEdit = (item: any) => {
    setForm({
      id: item.id,
      skuCode: item.skuCode,
      name: item.name,
      packagingKg: item.packagingKg,
      retailPrice: item.retailPrice,
      b2bPrice: item.b2bPrice,
      sieuThiPrice: item.sieuThiPrice
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá sản phẩm này? Các bảng giá liên quan cũng sẽ bị xoá.")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Xoá thành công");
      fetchData();
    }
  };

  const handleStockChange = async (id: string, newStock: number) => {
    setProductData(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    await fetch(`/api/products/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: newStock })
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm & Bảng giá</h1>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setForm({ id: "", skuCode: "", name: "", packagingKg: 10, retailPrice: 0, b2bPrice: 0, sieuThiPrice: 0 });
        }}>
          <DialogTrigger render={<Button className="bg-green-600 hover:bg-green-700">+ Thêm sản phẩm mới</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Mã SP (SKU)</label>
                  <Input value={form.skuCode} onChange={e => setForm({...form, skuCode: e.target.value})} placeholder="VD: ST25-10" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Trọng lượng (kg)</label>
                  <Input type="number" value={form.packagingKg} onChange={e => setForm({...form, packagingKg: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tên sản phẩm</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: Gạo ST25" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-green-700">Giá Bán Lẻ (VND)</label>
                  <Input type="number" value={form.retailPrice} onChange={e => setForm({...form, retailPrice: Number(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-blue-700">Giá B2B (VND)</label>
                  <Input type="number" value={form.b2bPrice} onChange={e => setForm({...form, b2bPrice: Number(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-purple-700">Giá Siêu Thị (VND)</label>
                  <Input type="number" value={form.sieuThiPrice} onChange={e => setForm({...form, sieuThiPrice: Number(e.target.value)})} />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700">Lưu sản phẩm</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-green-50">
              <TableHead className="font-medium">Mã SP</TableHead>
              <TableHead className="font-medium">Tên sản phẩm</TableHead>
              <TableHead className="font-medium">Giá bán lẻ</TableHead>
              <TableHead className="font-medium text-blue-700">Giá B2B</TableHead>
              <TableHead className="font-medium text-purple-700">Giá Siêu Thị</TableHead>
              <TableHead className="font-medium">Tồn kho</TableHead>
              <TableHead className="font-medium text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productData.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell className="text-gray-600">{item.skuCode}</TableCell>
                <TableCell className="font-medium text-gray-800">{item.name} ({item.packagingKg}kg)</TableCell>
                <TableCell className="text-gray-800 font-medium">
                  {item.retailPrice.toLocaleString()} ₫
                </TableCell>
                <TableCell className="text-blue-600 font-bold">
                  {item.b2bPrice.toLocaleString()} ₫
                </TableCell>
                <TableCell className="text-purple-600 font-bold">
                  {item.sieuThiPrice.toLocaleString()} ₫
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      className="w-20 h-8" 
                      defaultValue={item.stock} 
                      onBlur={(e) => handleStockChange(item.id, Number(e.target.value))}
                    />
                    <span className="text-sm text-gray-500">bao</span>
                  </div>
                </TableCell>
                <TableCell className="text-center space-x-3">
                  <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-blue-600">✏️</button>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600">🗑️</button>
                </TableCell>
              </TableRow>
            ))}
            {productData.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-gray-500">Chưa có sản phẩm nào</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
