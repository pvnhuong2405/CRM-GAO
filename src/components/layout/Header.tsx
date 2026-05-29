"use client";

import { useSession } from "next-auth/react";
import { User, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
      <div className="flex items-center">
        <button className="md:hidden mr-4 text-gray-500">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      <div className="flex items-center space-x-4">
        {["Admin", "Sale"].includes(session?.user?.role as string) && (
          <Link href="/orders/new">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Tạo đơn
            </Button>
          </Link>
        )}
        <div className="flex items-center space-x-2 border-l pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-700">{session?.user?.name || "User"}</span>
        </div>
      </div>
    </header>
  );
}
