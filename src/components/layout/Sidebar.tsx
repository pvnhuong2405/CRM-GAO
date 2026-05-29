"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Box, Settings, LogOut, Award } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as string;

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin"] },
    { href: "/customers", icon: Users, label: "Khách hàng", roles: ["admin", "sale"] },
    { href: "/orders", icon: FileText, label: "Đơn hàng", roles: ["admin", "sale", "kho"] },
    { href: "/products", icon: Box, label: "Sản phẩm", roles: ["admin", "sale"] },
    { href: "/receivables", icon: FileText, label: "Công nợ B2B", roles: ["admin", "sale"] },
    { href: "/marketing/reminders", icon: Users, label: "Nhắc mua lại (Zalo)", roles: ["admin", "sale"] },
    { href: "/marketing/broadcast", icon: FileText, label: "Broadcast Zalo", roles: ["admin", "sale"] },
    { href: "/marketing/loyalty", icon: Award, label: "Tích Điểm (Loyalty)", roles: ["admin", "sale"] },
    { href: "/users", icon: Users, label: "Quản lý nhân sự", roles: ["admin"] },
    { href: "/settings", icon: Settings, label: "Cấu hình", roles: ["admin"] },
  ];

  const visibleNavs = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="hidden w-64 flex-col border-r bg-white md:flex">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <span className="text-xl font-bold flex items-center" style={{ color: "#7cb342" }}>
          {/* Logo icon (Wheat/Rice) + GẠO VĂN B */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-yellow-500">
            <path d="M2 22 5.5 18.5"/>
            <path d="M4.5 15.5 8 19"/>
            <path d="M2.5 17.5 7 22"/>
            <path d="M8 12 12 16"/>
            <path d="M10 10 14 14"/>
            <path d="M12 8 16 12"/>
            <path d="M14 6 18 10"/>
            <path d="M16 4 20 8"/>
            <path d="M18 2 22 6"/>
          </svg>
          GẠO VĂN B
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleNavs.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-green-600" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
