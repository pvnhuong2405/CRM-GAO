export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import RevenueChart from "@/components/dashboard/RevenueChart";

function getVNDateString(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit'
  }).format(date);
}

export default async function DashboardPage() {
  const orders = await prisma.order.findMany();
  const customers = await prisma.customer.findMany();
  
  const totalRevenue = orders.reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  
  // Tính toán số liệu tăng trưởng
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const ordersThisMonth = orders.filter(o => o.createdAt >= startOfThisMonth);
  const ordersLastMonth = orders.filter(o => o.createdAt >= startOfLastMonth && o.createdAt < startOfThisMonth);
  const customersThisMonth = customers.filter(c => c.createdAt >= startOfThisMonth);
  const customersLastMonth = customers.filter(c => c.createdAt >= startOfLastMonth && c.createdAt < startOfThisMonth);

  const revenueThisMonth = ordersThisMonth.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const revenueLastMonth = ordersLastMonth.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  
  const calculateGrowth = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? "100" : "0";
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const revenueGrowth = calculateGrowth(revenueThisMonth, revenueLastMonth);
  const ordersGrowth = calculateGrowth(ordersThisMonth.length, ordersLastMonth.length);
  const customersGrowth = calculateGrowth(customersThisMonth.length, customersLastMonth.length);
  
  const renderGrowth = (val: string) => {
    const num = Number(val);
    if (num > 0) return <span className="text-green-600 text-sm font-medium">↑ {num}% vs tháng trước</span>;
    if (num < 0) return <span className="text-red-600 text-sm font-medium">↓ {Math.abs(num)}% vs tháng trước</span>;
    return <span className="text-gray-500 text-sm font-medium">- 0% vs tháng trước</span>;
  };
  
  // Tính doanh thu 7 ngày gần nhất
  const chartDataMap: Record<string, number> = {};
  
  // Tạo khung 7 ngày (bao gồm cả hôm nay) với giá trị 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getVNDateString(d);
    chartDataMap[dateStr] = 0;
  }

  // Cộng dồn doanh thu vào ngày tương ứng
  orders.forEach((o: any) => {
    const d = new Date(o.createdAt);
    const dateStr = getVNDateString(d);
    if (chartDataMap[dateStr] !== undefined) {
      chartDataMap[dateStr] += (o.totalAmount || 0);
    }
  });

  const chartData = Object.keys(chartDataMap).map(date => ({
    date,
    revenue: chartDataMap[date]
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan (Dashboard)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
          <h2 className="text-gray-500 font-medium mb-1">Tổng Doanh Thu</h2>
          <p className="text-3xl font-bold text-gray-900">{totalRevenue.toLocaleString()} ₫</p>
          {renderGrowth(revenueGrowth)}
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
          <h2 className="text-gray-500 font-medium mb-1">Đơn hàng mới</h2>
          <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
          {renderGrowth(ordersGrowth)}
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500">
          <h2 className="text-gray-500 font-medium mb-1">Khách hàng mới</h2>
          <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
          {renderGrowth(customersGrowth)}
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Biểu đồ doanh thu (7 ngày gần nhất)</h2>
        <RevenueChart data={chartData} />
      </div>
    </div>
  );
}
