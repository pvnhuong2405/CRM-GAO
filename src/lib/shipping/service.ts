/**
 * Mock thư viện gọi API Ahamove / GHN
 * Trong thực tế sẽ dùng node-fetch hoặc axios để gọi Ahamove API
 */

export const calculateShippingFee = async (
  provider: "Ahamove" | "GHN" | "ViettelPost",
  address: string,
  totalWeightKg: number
): Promise<number> => {
  // Giả lập độ trễ gọi API
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!address || address.length < 5) {
    throw new Error("Địa chỉ không hợp lệ");
  }

  // Logic giả lập:
  // - Ahamove (Nội thành HCM): ~5k/km. Giả lập random từ 20k - 45k. Dưới 10kg thì rẻ hơn.
  // - GHN (Toàn quốc): ~30k + 5k/kg vượt mức.
  
  if (provider === "Ahamove") {
    const baseFee = 20000;
    const weightFee = totalWeightKg > 10 ? (totalWeightKg - 10) * 2000 : 0;
    // Giả lập random theo địa chỉ dài/ngắn
    const distanceFee = (address.length % 5) * 5000; 
    return baseFee + weightFee + distanceFee;
  }

  if (provider === "GHN") {
    const baseFee = 35000;
    const weightFee = totalWeightKg > 5 ? (totalWeightKg - 5) * 5000 : 0;
    return baseFee + weightFee;
  }

  return 30000; // Default
};

export const createShipmentOrder = async (
  provider: "Ahamove" | "GHN" | "ViettelPost",
  orderId: string,
  customerName: string,
  phone: string,
  address: string,
  totalAmount: number,
  note: string
) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Trả về Tracking Code giả lập
  const prefix = provider === "Ahamove" ? "AHA" : provider === "GHN" ? "GHN" : "VTP";
  const trackingCode = `${prefix}${Math.floor(Math.random() * 100000000).toString()}`;

  return {
    success: true,
    trackingCode,
    status: "Pending",
    provider
  };
};
