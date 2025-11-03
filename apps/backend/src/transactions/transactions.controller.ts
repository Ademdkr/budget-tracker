import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Headers,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  private getUserIdFromHeaders(headers: any): string {
    const userId = headers['x-user-id'];
    if (!userId) {
      throw new Error('User ID not found in headers');
    }
    return userId;
  }

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.create(createTransactionDto, userId);
  }

  @Get()
  findAll(@Query('accountId') accountId?: string, @Headers() headers?: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.findAll(userId, accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.update(id, updateTransactionDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.remove(id, userId);
  }
}
