"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CreateOrderPage() {
  const router = useRouter();
  
  // Nguồn đơn
  const [channel, setChannel] = useState("Zalo");

  // Autocomplete khách hàng
  const [phone, setPhone] = useState("");
  const [suggestedCustomers, setSuggestedCustomers] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tạo khách hàng mới
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: "", phone: "", groupId: "", source: "Zalo" });

  const [productsData, setProductsData] = useState<{ products: any[], prices: any[] }>({ products: [], prices: [] });
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  // Shipping state
  const [address, setAddress] = useState("");
  const [provider, setProvider] = useState<"Ahamove" | "GHN">("Ahamove");
  const [shippingFee, setShippingFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  // Loyalty points
  const [usedPoints, setUsedPoints] = useState(0);

  useEffect(() => {
    // Fetch products and groups on mount
    Promise.all([
      fetch("/api/products").then(res => res.json()),
      fetch("/api/customer-groups").then(res => res.json())
    ]).then(([pData, gData]) => {
      if (pData.products) setProductsData(pData);
      if (Array.isArray(gData)) setGroups(gData);
    });
  }, []);

  const handleSearchCustomer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    setCustomer(null); // Reset selected customer if typing
    
    if (val.length >= 2) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(async () => {
        const res = await fetch(`/api/customers/search?query=${val}`);
        const data = await res.json();
        if (data.found && data.customers.length > 0) {
          setSuggestedCustomers(data.customers);
          setShowSuggestions(true);
        } else {
          setSuggestedCustomers([]);
          setShowSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestedCustomers([]);
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (cust: any) => {
    setCustomer(cust);
    setPhone(cust.phone);
    setShowSuggestions(false);
    setAddress(""); // Reset address when customer changes
    setShippingFee(0);
    setUsedPoints(0);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerForm.name || !newCustomerForm.phone || !newCustomerForm.groupId) {
      return alert("Vui lòng nhập đủ Tên, SĐT và chọn Nhóm khách hàng");
    }
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomerForm)
    });
    if (res.ok) {
      const data = await res.json();
      alert("Tạo khách hàng mới thành công!");
      setIsNewCustomerModalOpen(false);
      
      // Auto select the newly created customer
      const groupName = groups.find(g => g.id === newCustomerForm.groupId)?.name;
      selectCustomer({
        id: data.customer?.id || data.id,
        name: newCustomerForm.name,
        phone: newCustomerForm.phone,
        groupId: newCustomerForm.groupId,
        groupName: groupName
      });
      setNewCustomerForm({ name: "", phone: "", groupId: "", source: "Zalo" });
    } else {
      const err = await res.json();
      alert("Lỗi tạo khách hàng: " + err.error);
    }
  };

  const getPriceForCustomer = (productId: string) => {
    if (!customer) return 0;
    const priceRecord = productsData.prices.find(p => p.productId === productId && p.groupId === customer.groupId);
    return priceRecord ? priceRecord.price : 0;
  };

  const handleAddItem = () => {
    if (!selectedProductId || quantity < 1 || !customer) return;
    
    const prod = productsData.products.find(p => p.id === selectedProductId);
    const unitPrice = getPriceForCustomer(selectedProductId);
    
    const newItems = [...orderItems, {
      productId: selectedProductId,
      name: prod.name,
      quantity: quantity,
      unitPrice: unitPrice
    }];
    setOrderItems(newItems);
    
    setSelectedProductId("");
    setQuantity(1);
    
    // Auto calculate fee
    autoCalculateFee(address, provider, newItems);
  };

  const handleRemoveItem = (idx: number) => {
    const newItems = orderItems.filter((_, i) => i !== idx);
    setOrderItems(newItems);
    autoCalculateFee(address, provider, newItems);
  };

  const autoCalculateFee = async (currentAddress: string, currentProvider: string, currentItems: any[]) => {
    if (!currentAddress || currentItems.length === 0) {
      setShippingFee(0);
      return;
    }
    setIsCalculatingFee(true);
    
    const totalWeightKg = currentItems.reduce((acc, item) => {
       const p = productsData.products.find(x => x.id === item.productId);
       return acc + (item.quantity * (p?.packagingKg || 1));
    }, 0);

    try {
      const res = await fetch("/api/shipping/fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: currentProvider, address: currentAddress, totalWeightKg })
      });
      const data = await res.json();
      if (data.fee !== undefined) {
        setShippingFee(data.fee);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculatingFee(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress(val);
  };

  const handleAddressBlur = () => {
    autoCalculateFee(address, provider, orderItems);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "Ahamove" | "GHN";
    setProvider(val);
    autoCalculateFee(address, val, orderItems);
  };

  const handleSaveOrder = async () => {
    if (!customer || orderItems.length === 0) return alert("Vui lòng điền đủ KH và Sản phẩm");

    const isB2B = customer.groupName === "B2B" || customer.groupName === "Siêu thị" || customer.groupName === "SieuThi";
    
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customer.id,
        items: orderItems,
        channel: channel,
        isB2B,
        shipping: {
          address,
          provider,
          shippingFee
        },
        usedPoints
      })
    });
    
    if (res.ok) {
      alert("Lưu đơn hàng thành công!");
      router.push("/orders");
    } else {
      alert("Có lỗi xảy ra khi lưu đơn");
    }
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tạo Đơn Hàng Mới</h1>
        <div className="flex items-center gap-2">
          <Label className="font-medium text-gray-700">Kênh bán (Nguồn):</Label>
          <select 
            className="border rounded-md px-3 py-1.5 bg-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="Zalo">Zalo</option>
            <option value="Facebook">Facebook</option>
            <option value="Web">Web</option>
            <option value="Phone">Điện thoại</option>
            <option value="Khác">Khác</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="bg-gray-50 border-b pb-4">
            <CardTitle className="text-lg flex justify-between items-center">
              <span>1. Khách hàng</span>
              <Button size="sm" variant="outline" className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setIsNewCustomerModalOpen(true)}>
                + Khách mới
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="relative">
              <Label>Tìm kiếm Số điện thoại / Tên</Label>
              <Input 
                placeholder="Nhập 0901... hoặc Tên khách" 
                value={phone}
                onChange={handleSearchCustomer}
                autoComplete="off"
              />
              {showSuggestions && suggestedCustomers.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestedCustomers.map(c => (
                    <li 
                      key={c.id} 
                      className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b last:border-0"
                      onClick={() => selectCustomer(c)}
                    >
                      <div className="font-medium">{c.phone} - {c.name}</div>
                      <div className="text-xs text-gray-500">Nhóm: <span className="text-green-600">{c.groupName}</span></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {customer ? (
              <div className={`p-3 border rounded-lg ${customer.groupName === 'B2B' || customer.groupName === 'SieuThi' || customer.groupName === 'Siêu thị' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                <p className="font-semibold text-gray-900">{customer.name}</p>
                <p className="text-sm text-gray-600 mt-1">SĐT: {customer.phone}</p>
                <p className="text-sm text-gray-600 mt-1">Nhóm giá: <strong className="text-indigo-600">{customer.groupName}</strong></p>
                {customer.totalPoints > 0 && (
                  <p className="text-sm text-orange-600 mt-1">Điểm tích lũy: <strong>{customer.totalPoints}</strong></p>
                )}
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-lg text-center text-gray-400 text-sm">
                Chưa chọn khách hàng
              </div>
            )}
            
            <div className="pt-2">
              <Label>Địa chỉ giao hàng</Label>
              <Input 
                placeholder="Nhập chi tiết địa chỉ để tự động tính phí ship..." 
                value={address}
                onChange={handleAddressChange}
                onBlur={handleAddressBlur}
                disabled={!customer}
              />
              <p className="text-xs text-gray-400 mt-1 italic">* Phí giao hàng tự động tính theo địa chỉ</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gray-50 border-b pb-4">
            <CardTitle className="text-lg">2. Sản phẩm & Giao hàng</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col h-full">
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <Label className="text-xs">Sản phẩm</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 mt-1"
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  disabled={!customer}
                >
                  <option value="">-- Chọn Gạo --</option>
                  {productsData.products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.packagingKg}kg)</option>
                  ))}
                </select>
              </div>
              <div className="w-16">
                <Label className="text-xs">SL</Label>
                <Input type="number" min={1} className="h-9" value={quantity} onChange={e => setQuantity(Number(e.target.value))} disabled={!customer} />
              </div>
              <Button size="sm" className="h-9 bg-green-600 hover:bg-green-700" onClick={handleAddItem} disabled={!selectedProductId || !customer}>Thêm</Button>
            </div>
            
            <div className="flex-1 overflow-auto bg-white border rounded-md">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 font-medium">Tên SP</th>
                    <th className="p-2 font-medium text-center">SL</th>
                    <th className="p-2 font-medium text-right">Đơn giá</th>
                    <th className="p-2 font-medium text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orderItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2 font-medium text-gray-800">{item.name}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right text-gray-600">{item.unitPrice.toLocaleString()} ₫</td>
                      <td className="p-2 text-center text-red-400 hover:text-red-600 cursor-pointer" onClick={() => handleRemoveItem(idx)}>✕</td>
                    </tr>
                  ))}
                  {orderItems.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">Chưa có sản phẩm</td></tr>}
                </tbody>
              </table>
            </div>

            {orderItems.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tiền hàng:</span>
                  <span className="font-medium">{totalAmount.toLocaleString()} ₫</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Giao hàng:</span>
                    <select 
                      className="border rounded px-2 py-0.5 text-xs bg-gray-50 outline-none" 
                      value={provider} 
                      onChange={handleProviderChange}
                    >
                      <option value="Ahamove">Ahamove</option>
                      <option value="GHN">GHN</option>
                    </select>
                    {isCalculatingFee && <span className="text-xs text-orange-500 animate-pulse">Đang tính...</span>}
                  </div>
                  <span className="font-medium text-orange-600">+{shippingFee.toLocaleString()} ₫</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Trừ điểm tích lũy:</span>
                    <Input 
                      type="number" 
                      className="w-16 h-6 text-xs text-right p-1" 
                      min={0} 
                      max={customer?.totalPoints || 0}
                      value={usedPoints}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val <= (customer?.totalPoints || 0)) setUsedPoints(val);
                      }}
                    />
                  </div>
                  <span className="font-medium text-indigo-600">-{ (usedPoints * 1000).toLocaleString() } ₫</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t text-lg font-bold">
                  <span>Tổng thanh toán:</span>
                  <span className="text-red-600">{(totalAmount + shippingFee - (usedPoints * 1000)).toLocaleString()} ₫</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push('/orders')}>Hủy Bỏ</Button>
        <Button className="bg-green-600 hover:bg-green-700 px-8" onClick={handleSaveOrder} disabled={orderItems.length === 0 || !customer}>
          TẠO ĐƠN HÀNG
        </Button>
      </div>

      {/* Modal Tạo Khách Hàng Mới */}
      <Dialog open={isNewCustomerModalOpen} onOpenChange={setIsNewCustomerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Khách Hàng Nhanh</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Họ và Tên</Label>
              <Input value={newCustomerForm.name} onChange={e => setNewCustomerForm({...newCustomerForm, name: e.target.value})} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input value={newCustomerForm.phone} onChange={e => setNewCustomerForm({...newCustomerForm, phone: e.target.value})} placeholder="0901234567" />
            </div>
            <div>
              <Label>Nhóm bảng giá</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newCustomerForm.groupId} 
                onChange={e => setNewCustomerForm({...newCustomerForm, groupId: e.target.value})}
              >
                <option value="">-- Chọn nhóm --</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <Button onClick={handleCreateCustomer} className="w-full bg-green-600 hover:bg-green-700">Lưu và Chọn khách này</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
