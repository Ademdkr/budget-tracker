import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  amount!: number;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsString()
  @IsNotEmpty()
  budgetId!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}
