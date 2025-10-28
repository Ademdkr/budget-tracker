import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return this.prisma.budget.findMany({
      include: {
        categories: true,
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.budget.findUnique({
      where: { id },
      include: {
        categories: true,
        transactions: true,
      },
    });
  }

  async create(dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        name: dto.name,
        description: dto.description,
        totalAmount: dto.totalAmount || 0,
        currency: dto.currency || 'EUR',
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateBudgetDto) {
    const exists = await this.findOne(id);
    if (!exists) throw new NotFoundException('Budget not found');

    return this.prisma.budget.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        totalAmount: dto.totalAmount,
        spent: dto.spent,
        currency: dto.currency,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    const exists = await this.findOne(id);
    if (!exists) throw new NotFoundException('Budget not found');
    return this.prisma.budget.delete({ where: { id } });
  }
}
