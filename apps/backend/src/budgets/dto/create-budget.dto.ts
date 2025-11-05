import { IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({
    description: 'ID der Kategorie für das Budget',
    example: '1',
  })
  @IsString()
  categoryId!: string; // Wird zu BigInt konvertiert

  @ApiProperty({
    description: 'Jahr des Budgets',
    minimum: 2020,
    maximum: 2050,
    example: 2025,
  })
  @IsInt()
  @Min(2020)
  @Max(2050)
  year!: number;

  @ApiProperty({
    description: 'Monat des Budgets (1-12)',
    minimum: 1,
    maximum: 12,
    example: 11,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number; // 1-12

  @ApiProperty({
    description: 'Gesamtbudgetbetrag',
    minimum: 0.01,
    example: 500.0,
  })
  @IsNumber()
  @Min(0.01)
  totalAmount!: number;
}
