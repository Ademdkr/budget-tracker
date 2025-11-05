import { PrismaClient } from '@prisma/client';
import { users } from './seeds/users';
import { createAccount } from './seeds/accounts';
import { createCategory, createBudgets } from './seeds/categories';
import { createTransactions } from './seeds/transactions';
import { config } from 'dotenv';
import { resolve } from 'path';

if (process.env.NODE_ENV !== 'production') {
  config({ path: resolve(__dirname, '../.env') });
}

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_DATABASE_URL,
});

async function main() {
  console.log('🌱 Starting database seed...\n');

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('⚠️  Database already contains users. Skipping seed.');
    console.log('   Run "npx prisma migrate reset" to clear and reseed.\n');
    return;
  }

  const user1 = await prisma.user.create({ data: users[0] });
  console.log(`👤 Created user: ${user1.name}`);

  const u1a1 = await createAccount(prisma, user1.id, {
    name: 'Bausparkonto',
    type: 'SAVINGS',
    initialBalance: 8000,
    note: 'Bausparkonto von Example',
    isActive: false,
  });

  const u1a1c1 = await createCategory(prisma, u1a1.id, {
    name: 'Sparen',
    description: 'Private Sparbetäge',
    transactionType: 'INCOME',
    emoji: '💰',
    color: '#4caf50',
  });

  await createTransactions(prisma, u1a1c1.id, u1a1.id, [
    {
      date: new Date('2025-10-01'),
      amount: 1000,
      note: 'Monatlicher Sparbetrag',
    },
    {
      date: new Date('2025-11-01'),
      amount: 1000,
      note: 'Monatlicher Sparbetrag',
    },
  ]);

  const u1a2 = await createAccount(prisma, user1.id, {
    name: 'Deutsche Bank',
    type: 'CHECKING',
    initialBalance: 1000,
    note: 'Deutsche Bank Giro Konto',
    isActive: true,
  });

  const u1a2c1 = await createCategory(prisma, u1a2.id, {
    name: 'Gehalt',
    description: 'Kraftverkehr Nagel - Gehalt',
    transactionType: 'INCOME',
    emoji: '💰',
    color: '#4caf50',
  });

  await createTransactions(prisma, u1a2c1.id, u1a2.id, [
    {
      date: new Date('2025-10-31'),
      amount: 2500,
      note: 'Vollzeit Gehalt - Kraftverkehr Nagel',
    },
    {
      date: new Date('2025-11-01'),
      amount: 2700,
      note: 'Gehalt + Bonus - Kraftverkehr Nagel',
    },
  ]);

  const u1a2c2 = await createCategory(prisma, u1a2.id, {
    name: 'Fitness',
    description: 'FitX - Fitness Mitgliegschaft',
    transactionType: 'EXPENSE',
    emoji: '🏋️',
    color: '#03dac6',
  });

  await createBudgets(prisma, u1a2c2.id, [
    { year: 2025, month: 10, totalAmount: 40 },
    { year: 2025, month: 11, totalAmount: 40 },
  ]);

  await createTransactions(prisma, u1a2c2.id, u1a2.id, [
    {
      date: new Date('2025-10-31'),
      amount: 40,
      note: 'Monatsabrechnung - FitX',
    },
    {
      date: new Date('2025-11-01'),
      amount: 40,
      note: 'Monatlicher Mitgieldschaftsbeitrag - FitX',
    },
  ]);

  const u1a2c3 = await createCategory(prisma, u1a2.id, {
    name: 'Verkehrsmittel',
    description: 'HVV Großbereich Hamburg',
    transactionType: 'EXPENSE',
    emoji: '🚇',
    color: '#607d8b',
  });

  await createBudgets(prisma, u1a2c3.id, [
    { year: 2025, month: 10, totalAmount: 55 },
    { year: 2025, month: 11, totalAmount: 55 },
  ]);

  await createTransactions(prisma, u1a2c3.id, u1a2.id, [
    {
      date: new Date('2025-10-31'),
      amount: 55,
      note: 'Monatliche Gebühr - Fahrkarte',
    },
    {
      date: new Date('2025-11-01'),
      amount: 55,
      note: 'Fahrkarte Großbereich - HVV',
    },
  ]);

  console.log('  ✅ 2 accounts, 3 categories, 4 budgets, 8 transactions\n');

  const user2 = await prisma.user.create({ data: users[1] });
  console.log(`👤 Created user: ${user2.name}`);

  const u2a1 = await createAccount(prisma, user2.id, {
    name: 'Klarna',
    type: 'CREDIT_CARD',
    initialBalance: 0,
    note: 'Einkäufe mit Kreditkarte',
    isActive: false,
  });

  const u2a1c1 = await createCategory(prisma, u2a1.id, {
    name: 'Fastfood',
    description: 'McDonalds, Burgerking, Subway',
    transactionType: 'EXPENSE',
    emoji: '🍔',
    color: '#3f51b5',
  });

  await createBudgets(prisma, u2a1c1.id, [
    { year: 2025, month: 11, totalAmount: 50 },
  ]);

  await createTransactions(prisma, u2a1c1.id, u2a1.id, [
    { date: new Date('2025-11-03'), amount: 12, note: 'McMenü - McDonalds' },
    { date: new Date('2025-11-03'), amount: 8, note: '30cm Sub - Subway' },
  ]);

  const u2a1c2 = await createCategory(prisma, u2a1.id, {
    name: 'Einzahlung',
    description: 'Einzahlungen für Kontoausgleich',
    transactionType: 'INCOME',
    emoji: '💰',
    color: '#8bc34a',
  });

  await createTransactions(prisma, u2a1c2.id, u2a1.id, [
    {
      date: new Date('2025-11-03'),
      amount: 15,
      note: 'Einzahlung zum Kreditausgleich',
    },
  ]);

  const u2a1c3 = await createCategory(prisma, u2a1.id, {
    name: 'Elektrowaren',
    description: 'Laptops, Computer, Konsolen',
    transactionType: 'EXPENSE',
    emoji: '💻',
    color: '#607d8b',
  });

  await createBudgets(prisma, u2a1c3.id, [
    { year: 2025, month: 11, totalAmount: 500 },
  ]);

  const u2a2 = await createAccount(prisma, user2.id, {
    name: 'Aktienkonto',
    type: 'INVESTMENT',
    initialBalance: 0,
    note: 'Aktien, Anlagen',
    isActive: true,
  });

  const u2a2c1 = await createCategory(prisma, u2a2.id, {
    name: 'Aktienkauf',
    description: 'Kauf neuer Aktien',
    transactionType: 'EXPENSE',
    emoji: '📈',
    color: '#f44336',
  });

  await createBudgets(prisma, u2a2c1.id, [
    { year: 2025, month: 11, totalAmount: 800 },
  ]);

  await createTransactions(prisma, u2a2c1.id, u2a2.id, [
    {
      date: new Date('2025-11-03'),
      amount: 795,
      note: 'Kauf von 10 Nvidia Aktien',
    },
  ]);

  const u2a2c2 = await createCategory(prisma, u2a2.id, {
    name: 'Aktienverkauf',
    description: 'Verkauf bestehender Aktien',
    transactionType: 'INCOME',
    emoji: '📊',
    color: '#4caf50',
  });

  await createTransactions(prisma, u2a2c2.id, u2a2.id, [
    {
      date: new Date('2025-11-03'),
      amount: 1600,
      note: 'Verkauf von Apple Aktien',
    },
  ]);

  console.log('  ✅ 2 accounts, 5 categories, 3 budgets, 5 transactions\n');

  const user3 = await prisma.user.create({ data: users[2] });
  console.log(`👤 Created user: ${user3.name}`);

  const u3a1 = await createAccount(prisma, user3.id, {
    name: 'Bunker',
    type: 'CASH',
    initialBalance: 500,
    note: 'Zu Hause gebunkertes Geld',
    isActive: false,
  });

  const u3a1c1 = await createCategory(prisma, u3a1.id, {
    name: 'Gaming',
    description: 'Spiele, Hardware',
    transactionType: 'EXPENSE',
    emoji: '🎮',
    color: '#009688',
  });

  await createBudgets(prisma, u3a1c1.id, [
    { year: 2025, month: 11, totalAmount: 200 },
  ]);

  await createTransactions(prisma, u3a1c1.id, u3a1.id, [
    { date: new Date('2025-11-03'), amount: 80, note: 'Call of Duty' },
    { date: new Date('2025-11-03'), amount: 80, note: 'FC 2026' },
  ]);

  const u3a1c2 = await createCategory(prisma, u3a1.id, {
    name: 'Bargeld',
    description: 'Vom Konto abgebuchtes Bargeld',
    transactionType: 'INCOME',
    emoji: '💰',
    color: '#4caf50',
  });

  await createTransactions(prisma, u3a1c2.id, u3a1.id, [
    {
      date: new Date('2025-11-03'),
      amount: 150,
      note: 'Bargeldauszahlung vom Konto',
    },
  ]);

  const u3a2 = await createAccount(prisma, user3.id, {
    name: 'Sonstiges Konto',
    type: 'OTHER',
    initialBalance: 0,
    note: 'Sonstige Zwecke',
    isActive: true,
  });

  const u3a2c1 = await createCategory(prisma, u3a2.id, {
    name: 'Unbekannt',
    description: 'Keine Zuordnung',
    transactionType: 'EXPENSE',
    emoji: '📝',
    color: '#4caf50',
  });

  await createTransactions(prisma, u3a2c1.id, u3a2.id, [
    { date: new Date('2025-11-03'), amount: 190, note: 'Transaktion' },
  ]);

  console.log('  ✅ 2 accounts, 4 categories, 1 budget, 4 transactions\n');

  const stats = {
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
    categories: await prisma.category.count(),
    budgets: await prisma.budget.count(),
    transactions: await prisma.transaction.count(),
  };

  console.log('═══════════════════════════════════════════');
  console.log('🎉 Seed completed!\n');
  console.log('📊 Statistics:');
  console.log(`   👥 Users: ${stats.users}`);
  console.log(`   📁 Accounts: ${stats.accounts}`);
  console.log(`   🏷️  Categories: ${stats.categories}`);
  console.log(`   💰 Budgets: ${stats.budgets}`);
  console.log(`   💸 Transactions: ${stats.transactions}`);
  console.log('═══════════════════════════════════════════\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
