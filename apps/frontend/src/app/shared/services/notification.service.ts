import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  duration?: number;
  action?: string;
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  private defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
  };

  show(message: string, type: NotificationType = 'info', options?: NotificationOptions) {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...options,
      panelClass: [`notification-${type}`],
    };

    return this.snackBar.open(message, options?.action || 'Schließen', config);
  }

  success(message: string, options?: NotificationOptions) {
    return this.show(message, 'success', options);
  }

  error(message: string, options?: NotificationOptions) {
    return this.show(message, 'error', { 
      duration: 8000, // Longer duration for errors
      ...options 
    });
  }

  warning(message: string, options?: NotificationOptions) {
    return this.show(message, 'warning', options);
  }

  info(message: string, options?: NotificationOptions) {
    return this.show(message, 'info', options);
  }

  dismiss() {
    this.snackBar.dismiss();
  }
}