import { config } from 'dotenv';
import path from 'path';

// Load .env file from backend directory
config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Prüfen ob bereits Daten existieren
  const existingBudgets = await prisma.budget.count();
  if (existingBudgets > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Starting database seed...');

  // Haupt-Budget erstellen
  const mainBudget = await prisma.budget.create({
    data: {
      name: 'Monatsbudget Oktober 2025',
      description: 'Hauptbudget für Oktober',
      totalAmount: 3000.0,
      spent: 0,
      currency: 'EUR',
      startDate: new Date(2025, 9, 1), // Oktober (0-basiert)
      endDate: new Date(2025, 9, 31),
      isActive: true,
    },
  });

  console.log('Main budget created');

  // Kategorien erstellen
  const groceries = await prisma.category.create({
    data: {
      name: 'Lebensmittel',
      description: 'Wöchentlicher Einkauf',
      color: '#4CAF50',
      icon: '🛒',
      budgetLimit: 400.0,
      budgetId: mainBudget.id,
    },
  });

  const transport = await prisma.category.create({
    data: {
      name: 'Transport',
      description: 'Auto, Benzin, Öffentliche Verkehrsmittel',
      color: '#2196F3',
      icon: '🚗',
      budgetLimit: 200.0,
      budgetId: mainBudget.id,
    },
  });

  const entertainment = await prisma.category.create({
    data: {
      name: 'Unterhaltung',
      description: 'Kino, Konzerte, Hobbies',
      color: '#9C27B0',
      icon: '🎬',
      budgetLimit: 150.0,
      budgetId: mainBudget.id,
    },
  });

  const utilities = await prisma.category.create({
    data: {
      name: 'Nebenkosten',
      description: 'Strom, Gas, Wasser',
      color: '#F44336',
      icon: '🏠',
      budgetLimit: 250.0,
      budgetId: mainBudget.id,
    },
  });

  const salary = await prisma.category.create({
    data: {
      name: 'Gehalt',
      description: 'Monatliches Einkommen',
      color: '#FF9800',
      icon: '💰',
      budgetId: mainBudget.id,
    },
  });

  console.log('Categories created');

  // Transaktionen erstellen
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Einnahmen
  await prisma.transaction.create({
    data: {
      title: 'Monatsgehalt',
      description: 'Gehalt Oktober 2025',
      amount: 3000.0,
      type: 'INCOME',
      date: new Date(thisMonth.getTime() + 1 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: salary.id,
    },
  });

  // Ausgaben
  await prisma.transaction.create({
    data: {
      title: 'Wocheneinkauf',
      description: 'REWE - Lebensmittel',
      amount: 120.0,
      type: 'EXPENSE',
      date: new Date(thisMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: groceries.id,
    },
  });

  await prisma.transaction.create({
    data: {
      title: 'Tankstelle',
      description: 'Shell - Volltanken',
      amount: 65.0,
      type: 'EXPENSE',
      date: new Date(thisMonth.getTime() + 5 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: transport.id,
    },
  });

  await prisma.transaction.create({
    data: {
      title: 'Kino',
      description: 'Kinopolis - 2 Tickets',
      amount: 28.0,
      type: 'EXPENSE',
      date: new Date(thisMonth.getTime() + 7 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: entertainment.id,
    },
  });

  await prisma.transaction.create({
    data: {
      title: 'Lebensmittel',
      description: 'ALDI - Wocheneinkauf',
      amount: 85.0,
      type: 'EXPENSE',
      date: new Date(thisMonth.getTime() + 10 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: groceries.id,
    },
  });

  await prisma.transaction.create({
    data: {
      title: 'Strom & Gas',
      description: 'Stadtwerke - Monatsabschlag',
      amount: 145.0,
      type: 'EXPENSE',
      date: new Date(thisMonth.getTime() + 12 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: utilities.id,
    },
  });

  await prisma.transaction.create({
    data: {
      title: 'Restaurant',
      description: 'Pizzeria - Abendessen',
      amount: 42.0,
      type: 'EXPENSE',
      date: new Date(thisMonth.getTime() + 15 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: entertainment.id,
    },
  });

  await prisma.transaction.create({
    data: {
      title: 'ÖPNV',
      description: 'Monatskarte',
      amount: 89.0,
      type: 'EXPENSE',
      date: new Date(thisMonth.getTime() + 18 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: transport.id,
    },
  });

  // Budget spent aktualisieren
  const totalExpenses = 120 + 65 + 28 + 85 + 145 + 42 + 89;
  await prisma.budget.update({
    where: { id: mainBudget.id },
    data: { spent: totalExpenses },
  });

  console.log('Transactions created');
  console.log(`Total expenses: €${totalExpenses}`);
  console.log('Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed.');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
