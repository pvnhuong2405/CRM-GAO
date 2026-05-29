"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Save, Settings2, Key, BellRing, PackageSearch } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Đã lưu cấu hình hệ thống thành công!");
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-green-600" /> Cài đặt Hệ thống
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý API Keys và các thông số vận hành</p>
        </div>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={loading}>
          <Save className="h-4 w-4 mr-2" /> {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* API Zalo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
              <BellRing className="h-5 w-5" /> Kết nối Zalo ZNS (Marketing)
            </CardTitle>
            <CardDescription>Cấu hình Access Token và Refresh Token để gửi tin nhắn Zalo tự động</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zalo App ID</Label>
                <Input placeholder="Nhập App ID..." defaultValue="43521234908123" />
              </div>
              <div className="space-y-2">
                <Label>Zalo Secret Key</Label>
                <Input type="password" placeholder="Nhập Secret Key..." defaultValue="***********" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>OA Access Token</Label>
                <Input type="password" placeholder="Nhập Access Token..." defaultValue="ey.zalo.access.token.mock" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Vận Chuyển */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <PackageSearch className="h-5 w-5" /> Kết nối Đơn Vị Vận Chuyển
            </CardTitle>
            <CardDescription>Thiết lập Token kết nối Ahamove, Giao Hàng Nhanh</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ahamove API Key</Label>
                <Input type="password" placeholder="Ahamove Token..." defaultValue="aha_test_9912384" />
              </div>
              <div className="space-y-2">
                <Label>Ahamove Phone Number</Label>
                <Input placeholder="SĐT đăng ký Ahamove..." defaultValue="0909123456" />
              </div>
              <div className="space-y-2">
                <Label>GHN API Token</Label>
                <Input type="password" placeholder="GHN Token..." defaultValue="ghn_mock_token_71283" />
              </div>
              <div className="space-y-2">
                <Label>GHN Shop ID</Label>
                <Input placeholder="Shop ID..." defaultValue="SHOP_9912" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông số chung */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
              <Key className="h-5 w-5" /> Thông Số Vận Hành (Loyalty)
            </CardTitle>
            <CardDescription>Các tham số ảnh hưởng tới thuật toán tích điểm</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tỷ lệ Tích điểm (VNĐ / 1 điểm)</Label>
                <Input type="number" defaultValue={100000} />
              </div>
              <div className="space-y-2">
                <Label>Giá trị quy đổi (1 điểm = VNĐ)</Label>
                <Input type="number" defaultValue={1000} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
