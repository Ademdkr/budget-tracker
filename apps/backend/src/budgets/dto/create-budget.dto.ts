import { IsString, IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  categoryId!: string; // Wird zu BigInt konvertiert

  @IsInt()
  @Min(2020)
  @Max(2050)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number; // 1-12

  @IsNumber()
  @Min(0.01)
  totalAmount!: number;
}
