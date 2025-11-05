import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Titel der Transaktion',
    example: 'Supermarkt Einkauf',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: 'Zusätzliche Beschreibung der Transaktion',
    example: 'Wocheneinkauf bei Rewe',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Betrag der Transaktion',
    example: 45.99,
    type: Number,
  })
  @IsNumber()
  amount!: number;

  @ApiProperty({
    description: 'Art der Transaktion',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiPropertyOptional({
    description: 'Datum der Transaktion (ISO 8601)',
    example: '2025-11-05',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'ID der zugehörigen Kategorie',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({
    description: 'ID des zugehörigen Kontos',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  accountId!: string;
}
