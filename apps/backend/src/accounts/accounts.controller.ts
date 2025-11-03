import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  Headers,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  private getUserIdFromHeaders(headers: any): string {
    const userId = headers['x-user-id'];
    if (!userId) {
      // Temporär: Verwende eine Test-User-ID, wenn keine vorhanden ist
      console.log('⚠️ No user ID in headers, using test user ID');
      return '1'; // Test User ID
    }
    return userId;
  }

  @Post()
  create(
    @Body(ValidationPipe) createAccountDto: CreateAccountDto,
    @Headers() headers: any,
  ) {
    console.log('🔄 POST /api/accounts called');
    console.log('📤 Request body:', createAccountDto);
    console.log('📋 Headers:', headers);

    const userId = this.getUserIdFromHeaders(headers);
    console.log('👤 User ID:', userId);

    return this.accountsService.create(createAccountDto, userId);
  }

  @Get()
  findAll(@Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.findAll(userId);
  }

  @Get('statistics')
  getStatistics(@Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.getStatistics(userId);
  }

  @Get('with-balances')
  getAccountsWithCalculatedBalances(@Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.getAccountsWithCalculatedBalances(userId);
  }

  @Post('recalculate-balances')
  recalculateAccountBalances(@Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.recalculateAccountBalances(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAccountDto: UpdateAccountDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.update(id, updateAccountDto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers() headers: any) {
    console.log('🗑️ DELETE /api/accounts/:id called with ID:', id);
    const userId = this.getUserIdFromHeaders(headers);
    console.log('👤 User ID for deletion:', userId);
    await this.accountsService.remove(id, userId);
    console.log('✅ Account deleted successfully');
    return { success: true };
  }
}
