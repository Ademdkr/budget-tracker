import { NgModule } from '@angular/core';

// Angular Material Components
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Shared Material Module for optimized Tree-Shaking
 * Import only the Material components that are actually used
 */
@NgModule({
  exports: [
    // Form Controls
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    
    // Layout
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    
    // Navigation
    MatMenuModule,
    MatDialogModule,
    
    // Indicators
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
  ]
})
export class MaterialModule {}