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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('Accounts')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  description: 'Benutzer-ID',
  required: true,
})
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
  @ApiOperation({ summary: 'Neues Konto erstellen' })
  @ApiResponse({
    status: 201,
    description: 'Konto erfolgreich erstellt',
  })
  @ApiResponse({ status: 400, description: 'Ungültige Eingabedaten' })
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
  @ApiOperation({ summary: 'Alle Konten abrufen' })
  @ApiResponse({
    status: 200,
    description: 'Liste aller Konten des Benutzers',
  })
  findAll(@Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.findAll(userId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Konto-Statistiken abrufen' })
  @ApiResponse({
    status: 200,
    description: 'Statistiken aller Konten',
  })
  getStatistics(@Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.getStatistics(userId);
  }

  @Get('with-balances')
  @ApiOperation({ summary: 'Konten mit berechneten Salden abrufen' })
  @ApiResponse({
    status: 200,
    description: 'Konten mit aktuellen Salden',
  })
  getAccountsWithCalculatedBalances(@Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.getAccountsWithCalculatedBalances(userId);
  }

  @Post('recalculate-balances')
  @ApiOperation({ summary: 'Kontosalden neu berechnen' })
  @ApiResponse({
    status: 200,
    description: 'Salden erfolgreich neu berechnet',
  })
  recalculateAccountBalances(@Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.recalculateAccountBalances(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Einzelnes Konto abrufen' })
  @ApiParam({ name: 'id', description: 'Konto-ID' })
  @ApiResponse({ status: 200, description: 'Konto gefunden' })
  @ApiResponse({ status: 404, description: 'Konto nicht gefunden' })
  findOne(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Konto aktualisieren' })
  @ApiParam({ name: 'id', description: 'Konto-ID' })
  @ApiResponse({ status: 200, description: 'Konto erfolgreich aktualisiert' })
  @ApiResponse({ status: 404, description: 'Konto nicht gefunden' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAccountDto: UpdateAccountDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountsService.update(id, updateAccountDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Konto löschen' })
  @ApiParam({ name: 'id', description: 'Konto-ID' })
  @ApiResponse({ status: 200, description: 'Konto erfolgreich gelöscht' })
  @ApiResponse({ status: 404, description: 'Konto nicht gefunden' })
  async remove(@Param('id') id: string, @Headers() headers: any) {
    console.log('🗑️ DELETE /api/accounts/:id called with ID:', id);
    const userId = this.getUserIdFromHeaders(headers);
    console.log('👤 User ID for deletion:', userId);
    await this.accountsService.remove(id, userId);
    console.log('✅ Account deleted successfully');
    return { success: true };
  }
}
