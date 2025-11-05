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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-user-id',
  description: 'Benutzer-ID',
  required: true,
})
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  private getUserIdFromHeaders(headers: any): string {
    const userId = headers['x-user-id'];
    if (!userId) {
      throw new Error('User ID not found in headers');
    }
    return userId;
  }

  @Post()
  @ApiOperation({
    summary: 'Neue Kategorie erstellen',
    description: 'Erstellt eine neue Kategorie für ein bestimmtes Konto',
  })
  @ApiResponse({
    status: 201,
    description: 'Kategorie erfolgreich erstellt',
  })
  @ApiResponse({ status: 400, description: 'Ungültige Eingabedaten' })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.create(createCategoryDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Kategorien abrufen',
    description:
      'Gibt alle Kategorien zurück oder filtert nach Konto-ID (optional)',
  })
  @ApiQuery({
    name: 'accountId',
    required: false,
    description: 'Filter nach Konto-ID',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste der Kategorien',
  })
  async findAll(
    @Query('accountId') accountId?: string,
    @Headers() headers?: any,
  ) {
    console.log('🎯 Categories API called with accountId:', accountId);
    const userId = this.getUserIdFromHeaders(headers);
    try {
      if (accountId) {
        console.log('🔍 Filtering categories by account:', accountId);
        const result = await this.categoriesService.findByAccount(
          accountId,
          userId,
        );
        return result;
      }
      console.log('📋 Returning all categories for user');
      const result = await this.categoriesService.findAll(userId);
      return result;
    } catch (error) {
      console.error('❌ Categories Controller Error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Einzelne Kategorie abrufen',
    description: 'Gibt Details einer bestimmten Kategorie zurück',
  })
  @ApiParam({ name: 'id', description: 'Kategorie-ID', example: '1' })
  @ApiResponse({ status: 200, description: 'Kategorie gefunden' })
  @ApiResponse({ status: 404, description: 'Kategorie nicht gefunden' })
  findOne(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Kategorie aktualisieren',
    description: 'Aktualisiert eine bestehende Kategorie',
  })
  @ApiParam({ name: 'id', description: 'Kategorie-ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Kategorie erfolgreich aktualisiert',
  })
  @ApiResponse({ status: 404, description: 'Kategorie nicht gefunden' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.update(id, updateCategoryDto, userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Kategorie löschen',
    description: 'Löscht eine bestehende Kategorie',
  })
  @ApiParam({ name: 'id', description: 'Kategorie-ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Kategorie erfolgreich gelöscht',
  })
  @ApiResponse({ status: 404, description: 'Kategorie nicht gefunden' })
  remove(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.remove(id, userId);
  }

  // Account-Category Relationship Endpoints
  @Post(':id/accounts/:accountId')
  @ApiOperation({
    summary: 'Kategorie einem Konto zuweisen',
    description: 'Verknüpft eine Kategorie mit einem bestimmten Konto',
  })
  @ApiParam({ name: 'id', description: 'Kategorie-ID', example: '1' })
  @ApiParam({ name: 'accountId', description: 'Konto-ID', example: '2' })
  @ApiResponse({
    status: 200,
    description: 'Kategorie erfolgreich zugewiesen',
  })
  @ApiResponse({
    status: 404,
    description: 'Kategorie oder Konto nicht gefunden',
  })
  assignToAccount(
    @Param('id') categoryId: string,
    @Param('accountId') accountId: string,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.assignToAccount(
      categoryId,
      accountId,
      userId,
    );
  }

  @Delete(':id/accounts/:accountId')
  @ApiOperation({
    summary: 'Kategorie von Konto entfernen',
    description: 'Entfernt die Verknüpfung einer Kategorie mit einem Konto',
  })
  @ApiParam({ name: 'id', description: 'Kategorie-ID', example: '1' })
  @ApiParam({ name: 'accountId', description: 'Konto-ID', example: '2' })
  @ApiResponse({
    status: 200,
    description: 'Verknüpfung erfolgreich entfernt',
  })
  @ApiResponse({
    status: 404,
    description: 'Kategorie oder Konto nicht gefunden',
  })
  removeFromAccount(
    @Param('id') categoryId: string,
    @Param('accountId') accountId: string,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.removeFromAccount(
      categoryId,
      accountId,
      userId,
    );
  }

  @Get(':id/accounts')
  @ApiOperation({
    summary: 'Konto-Zuweisungen abrufen',
    description:
      'Gibt alle Konten zurück, denen diese Kategorie zugewiesen ist',
  })
  @ApiParam({ name: 'id', description: 'Kategorie-ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Liste der zugewiesenen Konten',
  })
  @ApiResponse({ status: 404, description: 'Kategorie nicht gefunden' })
  getAccountAssignments(
    @Param('id') categoryId: string,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.getAccountAssignments(categoryId, userId);
  }

  // Auto-assign categories to account based on existing transactions
  @Post('auto-assign/:accountId')
  @ApiOperation({
    summary: 'Kategorien automatisch zuweisen',
    description:
      'Weist Kategorien automatisch einem Konto zu, basierend auf vorhandenen Transaktionen',
  })
  @ApiParam({
    name: 'accountId',
    description: 'Konto-ID',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Kategorien erfolgreich automatisch zugewiesen',
  })
  @ApiResponse({ status: 404, description: 'Konto nicht gefunden' })
  autoAssignCategoriesBasedOnTransactions(
    @Param('accountId') accountId: string,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.autoAssignCategoriesBasedOnTransactions(
      accountId,
      userId,
    );
  }
}
