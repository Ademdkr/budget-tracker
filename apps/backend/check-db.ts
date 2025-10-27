
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDatabase() {
  const budgets = await prisma.budget.findMany();
  console.log('Aktuelle Budgets:');
  budgets.forEach(b => console.log('- Name:', b.name, '| ID:', b.id));
  
  const categories = await prisma.category.findMany();
  console.log('\nAktuelle Kategorien:');
  categories.forEach(c => console.log('- Name:', c.name, '| Icon:', c.icon));
  
  await prisma.();
}

checkDatabase().catch(console.error);

