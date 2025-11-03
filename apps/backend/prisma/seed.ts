import { config } from 'dotenv';
import path from 'path';

// Load .env file from backend directory
config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed with new schema...');

  // Prüfen ob bereits User existieren
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  // Erstelle drei Testuser
  const users = [
    {
      name: 'Example',
      surname: 'User',
      email: 'example@example.com',
      password: 'password', // In Produktion sollte das gehashed werden
    },
    {
      name: 'Example2',
      surname: 'User',
      email: 'example2@example.com',
      password: 'password', // In Produktion sollte das gehashed werden
    },
    {
      name: 'Example3',
      surname: 'User',
      email: 'example3@example.com',
      password: 'password', // In Produktion sollte das gehashed werden
    },
  ];

  console.log('Creating users...');
  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    createdUsers.push(user);
    console.log(`Created user: ${user.name} ${user.surname} (${user.email})`);
  }

  console.log('Creating accounts for each user...');
  for (const user of createdUsers) {
    // Account 1: Girokonto
    const checkingAccount = await prisma.account.create({
      data: {
        userId: user.id,
        name: `${user.name}'s Girokonto`,
        type: 'CHECKING',
        initialBalance: 1500.0,
        note: 'Hauptkonto für tägliche Ausgaben und Gehalt',
      },
    });

    // Account 2: Sparkonto
    const savingsAccount = await prisma.account.create({
      data: {
        userId: user.id,
        name: `${user.name}'s Sparkonto`,
        type: 'SAVINGS',
        initialBalance: 5000.0,
        note: 'Ersparnisse und Notgroschen',
      },
    });

    // Account 3: Kreditkarte
    const creditCard = await prisma.account.create({
      data: {
        userId: user.id,
        name: `${user.name}'s Kreditkarte`,
        type: 'CREDIT_CARD',
        initialBalance: -200.0, // Negative balance for credit card debt
        note: 'Kreditkarte für Online-Einkäufe und Reisen',
      },
    });

    console.log(`Created 3 accounts for ${user.name}:`);
    console.log(`  - ${checkingAccount.name} (${checkingAccount.type})`);
    console.log(`  - ${savingsAccount.name} (${savingsAccount.type})`);
    console.log(`  - ${creditCard.name} (${creditCard.type})`);
  }

  console.log('Seed completed successfully!');
  console.log(
    `Created ${users.length} users with ${users.length * 3} accounts.`,
  );
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
