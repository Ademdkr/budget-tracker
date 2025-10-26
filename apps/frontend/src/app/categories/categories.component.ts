import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatBadgeModule } from '@angular/material/badge';

// Enhanced Category interface with transaction count
export interface CategoryWithStats {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  transactionCount: number;
  totalAmount: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatGridListModule,
    MatBadgeModule
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  private dialog = inject(MatDialog);

  // Data properties
  categories: CategoryWithStats[] = [];
  incomeCategories: CategoryWithStats[] = [];
  expenseCategories: CategoryWithStats[] = [];
  
  // UI states
  isLoading = true;
  hasError = false;
  isEmpty = false;
  
  // View settings
  viewMode: 'grid' | 'list' = 'grid';
  selectedFilter: 'all' | 'income' | 'expense' = 'all';

  ngOnInit() {
    this.loadCategories();
  }

  private loadCategories() {
    this.isLoading = true;
    this.hasError = false;

    // Simulate API call
    setTimeout(() => {
      try {
        this.categories = this.generateMockCategories();
        this.filterCategories();
        this.checkEmptyState();
        
        this.isLoading = false;
      } catch {
        this.hasError = true;
        this.isLoading = false;
      }
    }, 1000);
  }

  private generateMockCategories(): CategoryWithStats[] {
    const baseCategories = [
      // Income Categories
      { 
        id: '1', name: 'Gehalt', emoji: '💰', color: '#4caf50', type: 'income' as const,
        transactionCount: 12, totalAmount: 42000, description: 'Monatliches Gehalt'
      },
      { 
        id: '2', name: 'Freelancing', emoji: '💻', color: '#2196f3', type: 'income' as const,
        transactionCount: 8, totalAmount: 12500, description: 'Freiberufliche Projekte'
      },
      { 
        id: '3', name: 'Investitionen', emoji: '📈', color: '#9c27b0', type: 'income' as const,
        transactionCount: 5, totalAmount: 3200, description: 'Dividenden und Zinsen'
      },
      { 
        id: '4', name: 'Verkäufe', emoji: '🏪', color: '#ff9800', type: 'income' as const,
        transactionCount: 3, totalAmount: 850, description: 'Verkauf von Gegenständen'
      },
      
      // Expense Categories
      { 
        id: '5', name: 'Lebensmittel', emoji: '🍕', color: '#ff9800', type: 'expense' as const,
        transactionCount: 45, totalAmount: -1200, description: 'Einkäufe und Restaurants'
      },
      { 
        id: '6', name: 'Transport', emoji: '🚗', color: '#f44336', type: 'expense' as const,
        transactionCount: 28, totalAmount: -850, description: 'Auto, ÖPNV, Taxi'
      },
      { 
        id: '7', name: 'Unterhaltung', emoji: '🎬', color: '#e91e63', type: 'expense' as const,
        transactionCount: 22, totalAmount: -680, description: 'Kino, Streaming, Events'
      },
      { 
        id: '8', name: 'Gesundheit', emoji: '💊', color: '#03dac6', type: 'expense' as const,
        transactionCount: 15, totalAmount: -420, description: 'Arzt, Apotheke, Fitness'
      },
      { 
        id: '9', name: 'Shopping', emoji: '🛍️', color: '#ff5722', type: 'expense' as const,
        transactionCount: 18, totalAmount: -950, description: 'Kleidung, Elektronik'
      },
      { 
        id: '10', name: 'Bildung', emoji: '📚', color: '#673ab7', type: 'expense' as const,
        transactionCount: 6, totalAmount: -280, description: 'Kurse, Bücher'
      },
      { 
        id: '11', name: 'Wohnen', emoji: '🏠', color: '#795548', type: 'expense' as const,
        transactionCount: 12, totalAmount: -2400, description: 'Miete, Nebenkosten, Reparaturen'
      },
      { 
        id: '12', name: 'Versicherungen', emoji: '🛡️', color: '#607d8b', type: 'expense' as const,
        transactionCount: 12, totalAmount: -1800, description: 'Alle Versicherungen'
      }
    ];

    return baseCategories.map(cat => ({
      ...cat,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    }));
  }

  private filterCategories() {
    switch (this.selectedFilter) {
      case 'income':
        this.incomeCategories = this.categories.filter(c => c.type === 'income');
        this.expenseCategories = [];
        break;
      case 'expense':
        this.incomeCategories = [];
        this.expenseCategories = this.categories.filter(c => c.type === 'expense');
        break;
      case 'all':
      default:
        this.incomeCategories = this.categories.filter(c => c.type === 'income');
        this.expenseCategories = this.categories.filter(c => c.type === 'expense');
        break;
    }
  }

  private checkEmptyState() {
    this.isEmpty = this.categories.length === 0;
  }

  // Public methods
  setFilter(filter: 'all' | 'income' | 'expense') {
    this.selectedFilter = filter;
    this.filterCategories();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  addCategory() {
    import('./category-form/category-form.component').then(({ CategoryFormComponent }) => {
      const dialogRef = this.dialog.open(CategoryFormComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          mode: 'create',
          existingNames: this.categories.map(c => c.name.toLowerCase())
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const newCategory: CategoryWithStats = {
            ...result,
            id: `cat_${Date.now()}`,
            transactionCount: 0,
            totalAmount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          this.categories.push(newCategory);
          this.filterCategories();
          
          console.log('Category added:', newCategory);
        }
      });
    });
  }

  editCategory(category: CategoryWithStats) {
    import('./category-form/category-form.component').then(({ CategoryFormComponent }) => {
      const dialogRef = this.dialog.open(CategoryFormComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          mode: 'edit',
          category: category,
          existingNames: this.categories
            .filter(c => c.id !== category.id)
            .map(c => c.name.toLowerCase())
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const index = this.categories.findIndex(c => c.id === category.id);
          if (index !== -1) {
            this.categories[index] = {
              ...category,
              ...result,
              updatedAt: new Date()
            };
            this.filterCategories();
            
            console.log('Category updated:', result);
          }
        }
      });
    });
  }

  deleteCategory(category: CategoryWithStats) {
    const hasTransactions = category.transactionCount > 0;
    
    let confirmMessage = `Möchten Sie die Kategorie "${category.name}" wirklich löschen?`;
    if (hasTransactions) {
      confirmMessage += `\n\nWarnung: Diese Kategorie hat ${category.transactionCount} Transaktionen. Diese werden ebenfalls betroffen sein.`;
    }
    
    const confirmed = window.confirm(confirmMessage);
    
    if (confirmed) {
      const index = this.categories.findIndex(c => c.id === category.id);
      if (index !== -1) {
        this.categories.splice(index, 1);
        this.filterCategories();
        
        console.log('Category deleted:', category);
      }
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount));
  }

  getAmountClass(amount: number): string {
    return amount >= 0 ? 'income' : 'expense';
  }

  getCategoryTypeLabel(type: string): string {
    switch (type) {
      case 'income': return 'Einnahme';
      case 'expense': return 'Ausgabe';
      case 'both': return 'Beide';
      default: return type;
    }
  }

  getCategoryTypeColor(type: string): string {
    switch (type) {
      case 'income': return 'success';
      case 'expense': return 'error';
      case 'both': return 'primary';
      default: return 'default';
    }
  }

  retry() {
    this.loadCategories();
  }
}