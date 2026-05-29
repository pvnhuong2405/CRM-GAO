"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SessionProvider } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <main className="flex flex-1 flex-col h-screen overflow-y-auto">
          <Header />
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
