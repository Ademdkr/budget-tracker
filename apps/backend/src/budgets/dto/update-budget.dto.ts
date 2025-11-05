import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBudgetDto {
  @ApiPropertyOptional({
    description: 'Gesamtbudgetbetrag',
    minimum: 0.01,
    example: 600.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  totalAmount?: number;
}
