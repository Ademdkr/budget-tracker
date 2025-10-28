import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll(@Query('accountId') accountId?: string) {
    console.log('Categories API called with accountId:', accountId);
    if (accountId) {
      console.log('Filtering categories by account:', accountId);
      return this.categoriesService.findByAccount(accountId);
    }
    console.log('Returning all categories (no account filter)');
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // Account-Category Relationship Endpoints
  @Post(':id/accounts/:accountId')
  assignToAccount(
    @Param('id') categoryId: string,
    @Param('accountId') accountId: string,
  ) {
    return this.categoriesService.assignToAccount(categoryId, accountId);
  }

  @Delete(':id/accounts/:accountId')
  removeFromAccount(
    @Param('id') categoryId: string,
    @Param('accountId') accountId: string,
  ) {
    return this.categoriesService.removeFromAccount(categoryId, accountId);
  }

  @Get(':id/accounts')
  getAccountAssignments(@Param('id') categoryId: string) {
    return this.categoriesService.getAccountAssignments(categoryId);
  }

  // Auto-assign categories to account based on existing transactions
  @Post('auto-assign/:accountId')
  autoAssignCategoriesBasedOnTransactions(
    @Param('accountId') accountId: string,
  ) {
    return this.categoriesService.autoAssignCategoriesBasedOnTransactions(
      accountId,
    );
  }
}
