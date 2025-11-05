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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@ApiTags('Budgets')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  description: 'Benutzer-ID',
  required: true,
})
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
  @ApiOperation({
    summary: 'Alle Budgets abrufen',
    description: 'Gibt eine Liste aller Budgets des Benutzers zurück',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste der Budgets',
  })
  list(@Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.service.findMany(userId);
  }

  @Get('with-stats')
  @ApiOperation({
    summary: 'Budgets mit Statistiken abrufen',
    description:
      'Gibt Budgets mit Ausgaben-Statistiken zurück, optional gefiltert nach Jahr, Monat und Konto',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Jahr filtern',
    example: 2025,
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Monat filtern (1-12)',
    example: 11,
  })
  @ApiQuery({
    name: 'accountId',
    required: false,
    description: 'Nach Konto-ID filtern',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Budgets mit Statistiken',
  })
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
  @ApiOperation({
    summary: 'Einzelnes Budget abrufen',
    description: 'Gibt Details eines bestimmten Budgets zurück',
  })
  @ApiParam({ name: 'id', description: 'Budget-ID', example: '1' })
  @ApiResponse({ status: 200, description: 'Budget gefunden' })
  @ApiResponse({ status: 404, description: 'Budget nicht gefunden' })
  get(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.service.findOne(id, userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Neues Budget erstellen',
    description: 'Erstellt ein monatliches Budget für eine Kategorie',
  })
  @ApiResponse({
    status: 201,
    description: 'Budget erfolgreich erstellt',
  })
  @ApiResponse({ status: 400, description: 'Ungültige Eingabedaten' })
  @ApiResponse({
    status: 409,
    description: 'Budget für diese Kategorie/Monat existiert bereits',
  })
  create(@Body() dto: CreateBudgetDto, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.service.create(dto, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Budget aktualisieren',
    description: 'Aktualisiert den Betrag eines bestehenden Budgets',
  })
  @ApiParam({ name: 'id', description: 'Budget-ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Budget erfolgreich aktualisiert',
  })
  @ApiResponse({ status: 404, description: 'Budget nicht gefunden' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Budget löschen',
    description: 'Löscht ein bestehendes Budget',
  })
  @ApiParam({ name: 'id', description: 'Budget-ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Budget erfolgreich gelöscht',
  })
  @ApiResponse({ status: 404, description: 'Budget nicht gefunden' })
  remove(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.service.remove(id, userId);
  }
}
