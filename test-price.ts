import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const customer = await prisma.customer.findFirst({ where: { phone: "0911223344" } })
  console.log("Customer:", customer)
  
  const prices = await prisma.priceList.findMany({ where: { groupId: customer?.groupId } })
  console.log("Prices for customer group:", prices)
}
main()
