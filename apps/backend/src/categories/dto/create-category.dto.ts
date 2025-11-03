import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @IsString()
  @IsNotEmpty()
  accountId!: string;
}
