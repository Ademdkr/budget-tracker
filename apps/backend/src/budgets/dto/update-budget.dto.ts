import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  totalAmount?: number;
}
