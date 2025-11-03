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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.create(createCategoryDto, userId);
  }

  @Get()
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
  findOne(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.update(id, updateCategoryDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers() headers: any) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.remove(id, userId);
  }

  // Account-Category Relationship Endpoints
  @Post(':id/accounts/:accountId')
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
  getAccountAssignments(
    @Param('id') categoryId: string,
    @Headers() headers: any,
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.categoriesService.getAccountAssignments(categoryId, userId);
  }

  // Auto-assign categories to account based on existing transactions
  @Post('auto-assign/:accountId')
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
