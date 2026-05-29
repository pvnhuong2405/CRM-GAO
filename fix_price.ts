import { PrismaClient } from '@prisma/client';

process.loadEnvFile('.env');
const prisma = new PrismaClient();

async function main() {
  const p3 = await prisma.product.findUnique({ where: { skuCode: 'NHI-25' } });
  const sieuThiGroup = await prisma.customerGroup.findUnique({ where: { name: 'SieuThi' } });

  if (p3 && sieuThiGroup) {
    const existingPrice = await prisma.priceList.findFirst({
      where: { productId: p3.id, groupId: sieuThiGroup.id }
    });

    if (!existingPrice) {
      await prisma.priceList.create({
        data: {
          productId: p3.id,
          groupId: sieuThiGroup.id,
          price: 400000 
        }
      });
      console.log('✅ Đã thêm giá 400k cho Gạo Nhài Thơm - Khách Siêu Thị');
    } else {
      console.log('⚠️ Giá đã tồn tại.');
    }
  } else {
    console.log('❌ Không tìm thấy sản phẩm hoặc nhóm Siêu Thị');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
