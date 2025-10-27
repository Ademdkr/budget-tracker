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

  // Accounts erstellen (alle starten mit Saldo 0)
  const checkingAccount = await prisma.account.create({
    data: {
      name: 'Sparkasse Hauptkonto',
      type: 'CHECKING',
      balance: 0,
      currency: 'EUR',
      icon: 'account_balance',
      color: '#2196f3',
      note: 'Hauptkonto für Gehalt und tägliche Ausgaben',
      isActive: true,
    },
  });

  const savingsAccount = await prisma.account.create({
    data: {
      name: 'ING Tagesgeld',
      type: 'SAVINGS',
      balance: 0,
      currency: 'EUR',
      icon: 'savings',
      color: '#4caf50',
      note: 'Notgroschen und kurzfristige Ersparnisse',
      isActive: true,
    },
  });

  const creditCard = await prisma.account.create({
    data: {
      name: 'DKB Visa Card',
      type: 'CREDIT_CARD',
      balance: 0,
      currency: 'EUR',
      icon: 'credit_card',
      color: '#ff9800',
      note: 'Kreditkarte für Online-Einkäufe und Reisen',
      isActive: true,
    },
  });

  const investmentAccount = await prisma.account.create({
    data: {
      name: 'Trade Republic',
      type: 'INVESTMENT',
      balance: 0,
      currency: 'EUR',
      icon: 'trending_up',
      color: '#9c27b0',
      note: 'ETF-Sparplan und Einzelaktien',
      isActive: true,
    },
  });

  const cashAccount = await prisma.account.create({
    data: {
      name: 'Bargeld',
      type: 'CASH',
      balance: 0,
      currency: 'EUR',
      icon: 'payments',
      color: '#795548',
      note: 'Portemonnaie und Spardose',
      isActive: true,
    },
  });

  const businessAccount = await prisma.account.create({
    data: {
      name: 'Freelancer Konto',
      type: 'OTHER',
      balance: 0,
      currency: 'EUR',
      icon: 'business',
      color: '#607d8b',
      note: 'Separates Konto für freiberufliche Tätigkeiten',
      isActive: true,
    },
  });

  console.log('Accounts created');

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

  const miscellaneous = await prisma.category.create({
    data: {
      name: 'Sonstiges',
      description: 'Verschiedene Transaktionen ohne spezifische Kategorie',
      color: '#9E9E9E',
      icon: '📝',
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
      accountId: checkingAccount.id,
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
      accountId: checkingAccount.id,
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
      accountId: creditCard.id,
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
      accountId: cashAccount.id,
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
      accountId: checkingAccount.id,
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
      accountId: checkingAccount.id,
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
      accountId: creditCard.id,
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
      accountId: checkingAccount.id,
    },
  });

  // Zusätzliche Transaktionen für andere Accounts
  await prisma.transaction.create({
    data: {
      title: 'ETF Sparplan',
      description: 'Monatlicher ETF-Sparplan',
      amount: 500.0,
      type: 'EXPENSE',
      date: new Date(thisMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: miscellaneous.id,
      accountId: investmentAccount.id,
    },
  });

  await prisma.transaction.create({
    data: {
      title: 'Freelancer Projekt',
      description: 'Webentwicklung für Kunde ABC',
      amount: 1200.0,
      type: 'INCOME',
      date: new Date(thisMonth.getTime() + 8 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: miscellaneous.id,
      accountId: businessAccount.id,
    },
  });

  await prisma.transaction.create({
    data: {
      title: 'Notgroschen aufstocken',
      description: 'Übertrag von Girokonto',
      amount: 200.0,
      type: 'INCOME',
      date: new Date(thisMonth.getTime() + 14 * 24 * 60 * 60 * 1000),
      budgetId: mainBudget.id,
      categoryId: miscellaneous.id,
      accountId: savingsAccount.id,
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

  // Account-Salden basierend auf Transaktionen berechnen
  console.log('Calculating account balances based on transactions...');

  const accounts = await prisma.account.findMany({
    include: {
      transactions: true,
    },
  });

  for (const account of accounts) {
    let calculatedBalance = 0;

    // Summiere alle Transaktionen für dieses Konto
    for (const transaction of account.transactions) {
      if (transaction.type === 'INCOME') {
        calculatedBalance += transaction.amount;
      } else if (transaction.type === 'EXPENSE') {
        calculatedBalance -= transaction.amount;
      }
    }

    // Aktualisiere den Account-Saldo
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: calculatedBalance },
    });

    console.log(
      `${account.name}: €${calculatedBalance} (${account.transactions.length} transactions)`,
    );
  }

  console.log('Account balances calculated successfully!');
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
