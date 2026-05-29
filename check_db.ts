import { PrismaClient } from '@prisma/client';

process.loadEnvFile('.env');
const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.customerGroup.findMany();
  console.log("Groups:", groups);
  
  const products = await prisma.product.findMany({
    include: {
      priceLists: true
    }
  });
  
  console.dir(products, { depth: null });
}

main().finally(() => prisma.$disconnect());
