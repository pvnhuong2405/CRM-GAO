"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Sale" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    
    const data = await res.json();
    if (res.ok) {
      setSuccess("Tạo tài khoản thành công! Đang chuyển hướng...");
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-gray-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-green-700">Tạo tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">Hệ thống CRM Gạo Văn B</p>
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {success && <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-600">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Họ tên nhân viên</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email đăng nhập</label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input
              type="password"
              required
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vai trò (Phân quyền)</label>
            <select
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="Sale">Nhân viên Sale</option>
              <option value="Kho">Nhân viên Kho</option>
              <option value="Admin">Quản trị viên (Admin)</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Tạo tài khoản
          </button>
        </form>
      </div>
    </div>
  );
}
