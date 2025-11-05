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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  ImportRequestDto,
  ImportResultDto,
} from './dto/import-transactions.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  description: 'Benutzer-ID',
  required: true,
})
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
  @ApiOperation({
    summary: 'Neue Transaktion erstellen',
    description: 'Erstellt eine neue Einnahme oder Ausgabe',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaktion erfolgreich erstellt',
  })
  @ApiResponse({ status: 400, description: 'Ungültige Eingabedaten' })
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.create(createTransactionDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Transaktionen abrufen',
    description:
      'Gibt alle Transaktionen zurück oder filtert nach Konto-ID (optional)',
  })
  @ApiQuery({
    name: 'accountId',
    required: false,
    description: 'Filter nach Konto-ID',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste der Transaktionen',
  })
  findAll(@Query('accountId') accountId?: string, @Headers() headers?: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.findAll(userId, accountId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Einzelne Transaktion abrufen',
    description: 'Gibt Details einer bestimmten Transaktion zurück',
  })
  @ApiParam({ name: 'id', description: 'Transaktions-ID', example: '1' })
  @ApiResponse({ status: 200, description: 'Transaktion gefunden' })
  @ApiResponse({ status: 404, description: 'Transaktion nicht gefunden' })
  findOne(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Transaktion aktualisieren',
    description: 'Aktualisiert eine bestehende Transaktion',
  })
  @ApiParam({ name: 'id', description: 'Transaktions-ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Transaktion erfolgreich aktualisiert',
  })
  @ApiResponse({ status: 404, description: 'Transaktion nicht gefunden' })
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.update(id, updateTransactionDto, userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Transaktion löschen',
    description: 'Löscht eine bestehende Transaktion',
  })
  @ApiParam({ name: 'id', description: 'Transaktions-ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Transaktion erfolgreich gelöscht',
  })
  @ApiResponse({ status: 404, description: 'Transaktion nicht gefunden' })
  remove(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.remove(id, userId);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Transaktionen importieren',
    description:
      'Importiert mehrere Transaktionen aus CSV oder anderen Datenquellen',
  })
  @ApiResponse({
    status: 201,
    description: 'Import erfolgreich abgeschlossen',
    type: ImportResultDto,
  })
  @ApiResponse({ status: 400, description: 'Ungültige Import-Daten' })
  import(@Body() importRequest: ImportRequestDto, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.transactionsService.importTransactions(importRequest, userId);
  }
}
