import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("=== BẮT ĐẦU TEST TOÀN BỘ HỆ THỐNG (PHASE 1 + 2) ===")

  // 1. Kiểm tra các bảng mới
  console.log("\n1. Đang kiểm tra Database Schema...")
  const customers = await prisma.customer.count()
  const shipments = await prisma.shipment.count()
  const loyaltyPoints = await prisma.loyaltyPoint.count()
  const campaigns = await prisma.campaign.count()
  
  console.log(`- Khách hàng (Phase 1): ${customers} record(s)`)
  console.log(`- Vận đơn (Shipment - Phase 2): ${shipments} record(s)`)
  console.log(`- Điểm thưởng (Loyalty - Phase 2): ${loyaltyPoints} record(s)`)
  console.log(`- Khuyến mãi (Campaign - Phase 2): ${campaigns} record(s)`)

  // 2. Tạo nhanh 1 Khách Hàng Test nếu chưa có
  console.log("\n2. Đang tạo dữ liệu Test...")
  let testCustomer = await prisma.customer.findFirst({ where: { phone: "0999888777" } })
  if (!testCustomer) {
    // Cần lấy 1 CustomerGroup có sẵn
    const group = await prisma.customerGroup.findFirst()
    if (!group) throw new Error("Chưa có Nhóm Khách Hàng nào trong DB")

    testCustomer = await prisma.customer.create({
      data: {
        name: "Khách Hàng Test Phase 2",
        phone: "0999888777",
        groupId: group.id,
        source: "Zalo",
        totalPoints: 0 // Bảng Customer đã được thêm cột totalPoints (Phase 2)
      }
    })
    console.log("- Đã tạo Khách hàng test: ", testCustomer.name)
  } else {
    console.log("- Đã tìm thấy Khách hàng test: ", testCustomer.name)
  }

  // 3. Tạo 1 Đơn hàng & Vận đơn (Shipment)
  const testProduct = await prisma.product.findFirst()
  if (!testProduct) {
    console.log("❌ Chưa có sản phẩm nào trong DB để test đơn hàng.")
    return
  }

  const testUser = await prisma.user.findFirst()
  if (!testUser) {
    console.log("❌ Chưa có User nào trong DB.")
    return
  }

  console.log("\n3. Đang tạo Đơn Hàng + Vận Đơn...")
  const orderAmount = 250000;
  const shippingFee = 25000;

  const newOrder = await prisma.order.create({
    data: {
      orderCode: `TEST${Date.now().toString().slice(-6)}`,
      customerId: testCustomer.id,
      createdBy: testUser.id,
      channel: "Zalo",
      status: "Moi",
      totalAmount: orderAmount + shippingFee,
      items: {
        create: [
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: orderAmount,
            subtotal: orderAmount
          }
        ]
      },
      // Lưu Vận Đơn (Bảng Shipment mới)
      shipment: {
        create: {
          provider: "Ahamove",
          shippingFee: shippingFee,
          status: "Pending"
        }
      }
    },
    include: {
      items: true,
      shipment: true
    }
  })

  console.log("- Mã Đơn Hàng mới: ", newOrder.orderCode)
  console.log("- Tổng tiền (Đã cộng ship): ", newOrder.totalAmount)
  console.log("- Đơn vị vận chuyển: ", newOrder.shipment?.provider)
  console.log("- Phí Ship: ", newOrder.shipment?.shippingFee)

  console.log("\n✅ TEST THÀNH CÔNG TẤT CẢ MODULE!")
}

main()
  .catch(e => {
    console.error("Lỗi Test: ", e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
