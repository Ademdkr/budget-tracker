import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { BudgetsModule } from './budgets/budgets.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AccountsModule } from './accounts/accounts.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT_API: Joi.number().default(3001),
        DATABASE_URL: Joi.string().uri().required(),
        CORS_ORIGIN: Joi.string().optional(), // z.B. "http://localhost:4201,http://localhost:4300"
      }),
    }),
    PrismaModule,
    HealthModule,
    BudgetsModule,
    CategoriesModule,
    TransactionsModule,
    AccountsModule,
  ],
})
export class AppModule {}
