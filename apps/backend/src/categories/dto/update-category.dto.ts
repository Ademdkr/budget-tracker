import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;
}
