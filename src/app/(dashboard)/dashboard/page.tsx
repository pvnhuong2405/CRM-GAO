export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import RevenueChart from "@/components/dashboard/RevenueChart";

function getVNDateString(date: Date) {
  const vnTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  return `${vnTime.getDate().toString().padStart(2, '0')}/${(vnTime.getMonth() + 1).toString().padStart(2, '0')}`;
}

export default async function DashboardPage() {
  const orders = await prisma.order.findMany();
  const customers = await prisma.customer.findMany();
  
  const totalRevenue = orders.reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  
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
          <span className="text-green-600 text-sm font-medium">↑ 12.5% vs tháng trước</span>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
          <h2 className="text-gray-500 font-medium mb-1">Đơn hàng mới</h2>
          <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
          <span className="text-green-600 text-sm font-medium">↑ 8.1% vs tháng trước</span>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500">
          <h2 className="text-gray-500 font-medium mb-1">Khách hàng mới</h2>
          <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
          <span className="text-green-600 text-sm font-medium">↑ 5.3% vs tháng trước</span>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Biểu đồ doanh thu (7 ngày gần nhất)</h2>
        <RevenueChart data={chartData} />
      </div>
    </div>
  );
}
