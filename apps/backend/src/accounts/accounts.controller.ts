import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body(ValidationPipe) createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get('statistics')
  getStatistics() {
    return this.accountsService.getStatistics();
  }

  @Get('with-balances')
  getAccountsWithCalculatedBalances() {
    return this.accountsService.getAccountsWithCalculatedBalances();
  }

  @Post('recalculate-balances')
  recalculateAccountBalances() {
    return this.accountsService.recalculateAccountBalances();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }

  // Category-Account Relationship Endpoints
  @Post(':id/categories/:categoryId')
  assignCategory(
    @Param('id') accountId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.accountsService.assignCategory(accountId, categoryId);
  }

  @Delete(':id/categories/:categoryId')
  removeCategory(
    @Param('id') accountId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.accountsService.removeCategory(accountId, categoryId);
  }

  @Get(':id/categories')
  getAssignedCategories(@Param('id') accountId: string) {
    return this.accountsService.getAssignedCategories(accountId);
  }
}
