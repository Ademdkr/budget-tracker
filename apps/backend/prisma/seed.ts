import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with complete dataset...\n');

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('⚠️  Database already contains users. Skipping seed.');
    console.log('   Run \"npx prisma migrate reset\" to clear and reseed.\n');
    return;
  }

  // User 1
  const user1 = await prisma.user.create({
    data: {
      name: 'Example',
      surname: 'User',
      email: 'example@example.com',
      password: 'password',
    },
  });

  const u1a1 = await prisma.account.create({
    data: {
      userId: user1.id,
      name: 'Bausparkonto',
      type: 'SAVINGS',
      initialBalance: 8000,
      note: 'Bausparkonto von Example',
      isActive: false,
    },
  });

  const u1a1c1 = await prisma.category.create({
    data: {
      accountId: u1a1.id,
      name: 'Sparen',
      description: 'Private Sparbetäge',
      transactionType: 'INCOME',
      emoji: '💰',
      color: '#4caf50',
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        categoryId: u1a1c1.id,
        accountId: u1a1.id,
        date: new Date('2025-10-01'),
        amount: 1000,
        note: 'Monatlicher Sparbetrag',
      },
      {
        categoryId: u1a1c1.id,
        accountId: u1a1.id,
        date: new Date('2025-11-01'),
        amount: 1000,
        note: 'Monatlicher Sparbetrag',
      },
    ],
  });

  const u1a2 = await prisma.account.create({
    data: {
      userId: user1.id,
      name: 'Deutsche Bank',
      type: 'CHECKING',
      initialBalance: 1000,
      note: 'Deutsche Bank Giro Konto',
      isActive: true,
    },
  });

  const u1a2c1 = await prisma.category.create({
    data: {
      accountId: u1a2.id,
      name: 'Gehalt',
      description: 'Kraftverkehr Nagel - Gehalt',
      transactionType: 'INCOME',
      emoji: '💰',
      color: '#4caf50',
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        categoryId: u1a2c1.id,
        accountId: u1a2.id,
        date: new Date('2025-10-31'),
        amount: 2500,
        note: 'Vollzeit Gehalt - Kraftverkehr Nagel',
      },
      {
        categoryId: u1a2c1.id,
        accountId: u1a2.id,
        date: new Date('2025-11-01'),
        amount: 2700,
        note: 'Gehalt + Bonus - Kraftverkehr Nagel',
      },
    ],
  });

  const u1a2c2 = await prisma.category.create({
    data: {
      accountId: u1a2.id,
      name: 'Fitness',
      description: 'FitX - Fitness Mitgliegschaft',
      transactionType: 'EXPENSE',
      emoji: '🏋️',
      color: '#03dac6',
    },
  });

  await prisma.budget.createMany({
    data: [
      { categoryId: u1a2c2.id, year: 2025, month: 10, totalAmount: 40 },
      { categoryId: u1a2c2.id, year: 2025, month: 11, totalAmount: 40 },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      {
        categoryId: u1a2c2.id,
        accountId: u1a2.id,
        date: new Date('2025-10-31'),
        amount: 40,
        note: 'Monatsabrechnung - FitX',
      },
      {
        categoryId: u1a2c2.id,
        accountId: u1a2.id,
        date: new Date('2025-11-01'),
        amount: 40,
        note: 'Monatlicher Mitgieldschaftsbeitrag - FitX',
      },
    ],
  });

  const u1a2c3 = await prisma.category.create({
    data: {
      accountId: u1a2.id,
      name: 'Verkehrsmittel',
      description: 'HVV Großbereich Hamburg',
      transactionType: 'EXPENSE',
      emoji: '🚇',
      color: '#607d8b',
    },
  });

  await prisma.budget.createMany({
    data: [
      { categoryId: u1a2c3.id, year: 2025, month: 10, totalAmount: 55 },
      { categoryId: u1a2c3.id, year: 2025, month: 11, totalAmount: 55 },
    ],
  });

  await prisma.transaction.createMany({
    data: [
      {
        categoryId: u1a2c3.id,
        accountId: u1a2.id,
        date: new Date('2025-10-31'),
        amount: 55,
        note: 'Monatliche Gebühr - Fahrkarte',
      },
      {
        categoryId: u1a2c3.id,
        accountId: u1a2.id,
        date: new Date('2025-11-01'),
        amount: 55,
        note: 'Fahrkarte Großbereich - HVV',
      },
    ],
  });

  console.log(
    '✅ User 1 created with 2 accounts, 3 categories, 4 budgets, 8 transactions\n',
  );

  // User 2
  const user2 = await prisma.user.create({
    data: {
      name: 'Example2',
      surname: 'User',
      email: 'example2@example.com',
      password: 'password',
    },
  });

  const u2a1 = await prisma.account.create({
    data: {
      userId: user2.id,
      name: 'Klarna',
      type: 'CREDIT_CARD',
      initialBalance: 0,
      note: 'Einkäufe mit Kreditkarte',
      isActive: false,
    },
  });

  const u2a1c1 = await prisma.category.create({
    data: {
      accountId: u2a1.id,
      name: 'Fastfood',
      description: 'McDonalds, Burgerking, Subway',
      transactionType: 'EXPENSE',
      emoji: '🍔',
      color: '#3f51b5',
    },
  });

  await prisma.budget.create({
    data: { categoryId: u2a1c1.id, year: 2025, month: 11, totalAmount: 50 },
  });

  await prisma.transaction.createMany({
    data: [
      {
        categoryId: u2a1c1.id,
        accountId: u2a1.id,
        date: new Date('2025-11-03'),
        amount: 12,
        note: 'McMenü - McDonalds',
      },
      {
        categoryId: u2a1c1.id,
        accountId: u2a1.id,
        date: new Date('2025-11-03'),
        amount: 8,
        note: '30cm Sub - Subway',
      },
    ],
  });

  const u2a1c2 = await prisma.category.create({
    data: {
      accountId: u2a1.id,
      name: 'Einzahlung',
      description: 'Einzahlungen für Kontoausgleich',
      transactionType: 'INCOME',
      emoji: '💰',
      color: '#8bc34a',
    },
  });

  await prisma.transaction.create({
    data: {
      categoryId: u2a1c2.id,
      accountId: u2a1.id,
      date: new Date('2025-11-03'),
      amount: 15,
      note: 'Einzahlung zum Kreditausgleich',
    },
  });

  const u2a1c3 = await prisma.category.create({
    data: {
      accountId: u2a1.id,
      name: 'Elektrowaren',
      description: 'Laptops, Computer, Konsolen',
      transactionType: 'EXPENSE',
      emoji: '💻',
      color: '#607d8b',
    },
  });

  await prisma.budget.create({
    data: { categoryId: u2a1c3.id, year: 2025, month: 11, totalAmount: 500 },
  });

  const u2a2 = await prisma.account.create({
    data: {
      userId: user2.id,
      name: 'Aktienkonto',
      type: 'INVESTMENT',
      initialBalance: 0,
      note: 'Aktien, Anlagen',
      isActive: true,
    },
  });

  const u2a2c1 = await prisma.category.create({
    data: {
      accountId: u2a2.id,
      name: 'Aktienkauf',
      description: 'Kauf neuer Aktien',
      transactionType: 'EXPENSE',
      emoji: '📈',
      color: '#f44336',
    },
  });

  await prisma.budget.create({
    data: { categoryId: u2a2c1.id, year: 2025, month: 11, totalAmount: 800 },
  });

  await prisma.transaction.create({
    data: {
      categoryId: u2a2c1.id,
      accountId: u2a2.id,
      date: new Date('2025-11-03'),
      amount: 795,
      note: 'Kauf von 10 Nvidia Aktien',
    },
  });

  const u2a2c2 = await prisma.category.create({
    data: {
      accountId: u2a2.id,
      name: 'Aktienverkauf',
      description: 'Verkauf bestehender Aktien',
      transactionType: 'INCOME',
      emoji: '📊',
      color: '#4caf50',
    },
  });

  await prisma.transaction.create({
    data: {
      categoryId: u2a2c2.id,
      accountId: u2a2.id,
      date: new Date('2025-11-03'),
      amount: 1600,
      note: 'Verkauf von Apple Aktien',
    },
  });

  console.log(
    '✅ User 2 created with 2 accounts, 5 categories, 3 budgets, 5 transactions\n',
  );

  // User 3
  const user3 = await prisma.user.create({
    data: {
      name: 'Example3',
      surname: 'User',
      email: 'example3@example.com',
      password: 'password',
    },
  });

  const u3a1 = await prisma.account.create({
    data: {
      userId: user3.id,
      name: 'Bunker',
      type: 'CASH',
      initialBalance: 500,
      note: 'Zu Hause gebunkertes Geld',
      isActive: false,
    },
  });

  const u3a1c1 = await prisma.category.create({
    data: {
      accountId: u3a1.id,
      name: 'Gaming',
      description: 'Spiele, Hardware',
      transactionType: 'EXPENSE',
      emoji: '🎮',
      color: '#009688',
    },
  });

  await prisma.budget.create({
    data: { categoryId: u3a1c1.id, year: 2025, month: 11, totalAmount: 200 },
  });

  await prisma.transaction.createMany({
    data: [
      {
        categoryId: u3a1c1.id,
        accountId: u3a1.id,
        date: new Date('2025-11-03'),
        amount: 80,
        note: 'Call of Duty',
      },
      {
        categoryId: u3a1c1.id,
        accountId: u3a1.id,
        date: new Date('2025-11-03'),
        amount: 80,
        note: 'FC 2026',
      },
    ],
  });

  const u3a1c2 = await prisma.category.create({
    data: {
      accountId: u3a1.id,
      name: 'Bargeld',
      description: 'Vom Konto abgebuchtes Bargeld',
      transactionType: 'INCOME',
      emoji: '💰',
      color: '#4caf50',
    },
  });

  await prisma.transaction.create({
    data: {
      categoryId: u3a1c2.id,
      accountId: u3a1.id,
      date: new Date('2025-11-03'),
      amount: 150,
      note: 'Bargeldauszahlung vom Konto',
    },
  });

  const u3a2 = await prisma.account.create({
    data: {
      userId: user3.id,
      name: 'Sonstiges Konto',
      type: 'OTHER',
      initialBalance: 0,
      note: 'Sonstige Zwecke',
      isActive: true,
    },
  });

  const u3a2c1 = await prisma.category.create({
    data: {
      accountId: u3a2.id,
      name: 'Unbekannt',
      description: 'Keine Zuordnung',
      transactionType: 'EXPENSE',
      emoji: '📝',
      color: '#4caf50',
    },
  });

  await prisma.transaction.create({
    data: {
      categoryId: u3a2c1.id,
      accountId: u3a2.id,
      date: new Date('2025-11-03'),
      amount: 190,
      note: 'Transaktion',
    },
  });

  console.log(
    '✅ User 3 created with 2 accounts, 4 categories, 1 budget, 4 transactions\n',
  );

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
