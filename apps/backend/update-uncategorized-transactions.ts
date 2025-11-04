import { config } from 'dotenv';
import path from 'path';

// Load .env file from backend directory
config({ path: path.resolve(__dirname, '.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateUncategorizedTransactions() {
  console.log('Updating uncategorized transactions...');

  // Finde alle Transaktionen ohne categoryId
  const uncategorizedTransactions = await prisma.transaction.findMany({
    where: {
      categoryId: null,
    },
    include: {
      budget: true,
    },
  });

  console.log(
    `Found ${uncategorizedTransactions.length} uncategorized transactions`,
  );

  if (uncategorizedTransactions.length === 0) {
    console.log('No uncategorized transactions found. All good!');
    return;
  }

  // Für jedes Budget eine "Sonstiges" Kategorie erstellen/finden
  const budgetMiscCategories = new Map<string, string>();

  for (const transaction of uncategorizedTransactions) {
    const budgetId = transaction.budgetId;

    if (!budgetMiscCategories.has(budgetId)) {
      // Prüfe, ob bereits eine "Sonstiges" Kategorie für dieses Budget existiert
      let miscCategory = await prisma.category.findFirst({
        where: {
          budgetId: budgetId,
          name: 'Sonstiges',
        },
      });

      // Falls nicht, erstelle eine neue
      if (!miscCategory) {
        miscCategory = await prisma.category.create({
          data: {
            name: 'Sonstiges',
            description:
              'Verschiedene Transaktionen ohne spezifische Kategorie',
            color: '#9E9E9E',
            icon: '📝',
            budgetId: budgetId,
          },
        });
        console.log(
          `Created "Sonstiges" category for budget: ${transaction.budget.name}`,
        );
      }

      budgetMiscCategories.set(budgetId, miscCategory.id);
    }

    // Aktualisiere die Transaktion mit der "Sonstiges" Kategorie
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { categoryId: budgetMiscCategories.get(budgetId) },
    });

    console.log(`Updated transaction: ${transaction.title} -> Sonstiges`);
  }

  console.log(
    `Successfully updated ${uncategorizedTransactions.length} transactions`,
  );
}

updateUncategorizedTransactions()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Update completed successfully!');
  })
  .catch(async (e) => {
    console.error('Error updating transactions:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
