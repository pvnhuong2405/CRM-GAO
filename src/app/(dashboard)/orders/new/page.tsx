"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateOrderPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<any>(null);
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
    // Fetch products on mount
    fetch("/api/products").then(res => res.json()).then(data => {
      if(data.products) setProductsData(data);
    });
  }, []);

  const handleSearchCustomer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    
    if (val.length >= 10) {
      const res = await fetch(`/api/customers/search?query=${val}`);
      const data = await res.json();
      if (data.found) {
        setCustomer(data.customer);
      } else {
        setCustomer(null);
      }
    } else {
      setCustomer(null);
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
    
    setOrderItems([...orderItems, {
      productId: selectedProductId,
      name: prod.name,
      quantity: quantity,
      unitPrice: unitPrice
    }]);
    
    setSelectedProductId("");
    setQuantity(1);
  };

  const calculateFee = async () => {
    if (!address || orderItems.length === 0) return;
    setIsCalculatingFee(true);
    
    // Tính tổng kg
    const totalWeightKg = orderItems.reduce((acc, item) => {
       const p = productsData.products.find(x => x.id === item.productId);
       return acc + (item.quantity * (p?.packagingKg || 1));
    }, 0);

    try {
      const res = await fetch("/api/shipping/fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, address, totalWeightKg })
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

  const handleSaveOrder = async () => {
    if (!customer || orderItems.length === 0) return alert("Vui lòng điền đủ KH và Sản phẩm");

    const isB2B = customer.groupName === "B2B" || customer.groupName === "Siêu thị" || customer.groupName === "SieuThi";
    
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customer.id,
        items: orderItems,
        channel: "Phone",
        isB2B,
        // Dữ liệu tạo vận đơn Shipment
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
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-800">Tạo Đơn Hàng Mới</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Khách hàng (Tự động tải Nhóm & Giá)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nhập Số điện thoại (Ví dụ: 0901234567)</Label>
            <Input 
              placeholder="0901..." 
              value={phone}
              onChange={handleSearchCustomer}
              maxLength={11}
            />
          </div>
          {customer && (
            <div className={`p-4 border rounded-lg ${customer.groupName === 'B2B' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
              <p className="font-medium text-gray-900">{customer.name}</p>
              <p className="text-sm text-gray-600 mt-1">Nhóm áp dụng bảng giá: <strong>{customer.groupName}</strong></p>
            </div>
          )}
          
          <div className="pt-2">
            <Label>Địa chỉ giao hàng</Label>
            <Input 
              placeholder="Ví dụ: 123 Nguyễn Văn Linh, Quận 7, TP.HCM" 
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Sản phẩm & Vận chuyển</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-4 p-4 border rounded bg-gray-50">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label>Sản phẩm</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
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
              <div className="w-24">
                <Label>Số lượng</Label>
                <Input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} disabled={!customer} />
              </div>
              <div className="w-32">
                <Label>Đơn giá</Label>
                <Input value={selectedProductId ? getPriceForCustomer(selectedProductId).toLocaleString() : 0} disabled />
              </div>
              <Button onClick={handleAddItem} disabled={!selectedProductId || !customer}>Thêm</Button>
            </div>
          </div>
          
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b"><th className="pb-2">Tên SP</th><th className="pb-2">SL</th><th className="pb-2 text-right">Đơn giá</th><th className="pb-2 text-right">Thành tiền</th></tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-3 font-medium">{item.name}</td>
                  <td className="py-3">{item.quantity}</td>
                  <td className="py-3 text-right">{item.unitPrice.toLocaleString()} ₫</td>
                  <td className="py-3 text-right text-green-600 font-medium">{(item.quantity * item.unitPrice).toLocaleString()} ₫</td>
                </tr>
              ))}
              {orderItems.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-400">Chưa có sản phẩm</td></tr>}
            </tbody>
              {orderItems.length > 0 && (
                <>
                  <tr>
                    <td colSpan={3} className="py-2 text-right text-gray-600">Tạm tính:</td>
                    <td className="py-2 text-right">{totalAmount.toLocaleString()} ₫</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-2 text-right text-gray-600">
                      <div className="flex items-center justify-end gap-2">
                        <span>Đơn vị giao hàng:</span>
                        <select 
                          className="border rounded p-1 text-sm" 
                          value={provider} 
                          onChange={(e) => setProvider(e.target.value as "Ahamove" | "GHN")}
                        >
                          <option value="Ahamove">Ahamove (Nội thành HCM)</option>
                          <option value="GHN">GHN (Toàn quốc)</option>
                        </select>
                        <Button size="sm" variant="outline" onClick={calculateFee} disabled={isCalculatingFee || !address}>
                          {isCalculatingFee ? "Đang tính..." : "Tính Phí Ship"}
                        </Button>
                      </div>
                    </td>
                    <td className="py-2 text-right text-orange-600">+{shippingFee.toLocaleString()} ₫</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-2 text-right text-gray-600">
                      <div className="flex items-center justify-end gap-2">
                        <span>Dùng điểm tích lũy:</span>
                        <div className="flex flex-col items-end">
                          <Input 
                            type="number" 
                            className="w-24 h-8 text-right" 
                            min={0} 
                            max={customer?.totalPoints || 0}
                            value={usedPoints}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val <= (customer?.totalPoints || 0)) {
                                setUsedPoints(val);
                              }
                            }}
                          />
                          <span className="text-xs text-gray-500">Tối đa: {customer?.totalPoints || 0} điểm</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-right text-indigo-600">
                      -{ (usedPoints * 1000).toLocaleString() } ₫
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-4 font-bold text-right">TỔNG CỘNG KHÁCH TRẢ:</td>
                    <td className="py-4 font-bold text-right text-red-600 text-lg">{(totalAmount + shippingFee - (usedPoints * 1000)).toLocaleString()} ₫</td>
                  </tr>
                </>
              )}
          </table>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => router.push('/orders')}>Hủy</Button>
        <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveOrder} disabled={orderItems.length === 0}>
          Lưu Đơn Hàng
        </Button>
      </div>
    </div>
  );
}
