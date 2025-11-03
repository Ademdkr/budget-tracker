import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  private getUserIdFromHeaders(headers: any): string {
    const userId = headers['x-user-id'];
    if (!userId) {
      console.log('⚠️ No user ID in headers, using test user ID');
      return '1'; // Test User ID
    }
    return userId;
  }

  @Get()
  list(@Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.service.findMany(userId);
  }

  @Get('with-stats')
  getBudgetsWithStats(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('accountId') accountId?: string,
    @Headers() headers?: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    const parsedYear = year ? parseInt(year, 10) : undefined;
    const parsedMonth = month ? parseInt(month, 10) : undefined;
    return this.service.getBudgetsWithStats(
      parsedYear,
      parsedMonth,
      accountId,
      userId,
    );
  }

  @Get(':id')
  get(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.service.findOne(id, userId);
  }

  @Post()
  create(@Body() dto: CreateBudgetDto, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.service.remove(id, userId);
  }
}
