import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * HTTP Interceptor für globalen Loading-State
 *
 * Funktionalität:
 * - Zeigt Loading-Indikator für alle HTTP-Requests
 * - Nutzt Counter-Mechanismus für mehrere parallele Requests
 * - Versteckt Loading-Indikator nach Abschluss (Erfolg oder Fehler)
 * - Integriert mit LoadingService
 *
 * Registrierung:
 * - Als class-based Interceptor (nicht functional)
 * - Muss in providers als HTTP_INTERCEPTORS registriert werden
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * {
 *   provide: HTTP_INTERCEPTORS,
 *   useClass: LoadingInterceptor,
 *   multi: true
 * }
 * ```
 */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  /** Loading-Service für globalen State */
  private loadingService = inject(LoadingService);

  /**
   * Interceptor-Methode
   *
   * @param req - HTTP Request
   * @param next - Nächster Handler in Chain
   * @returns Observable mit HTTP Event
   */
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Start loading
    this.loadingService.setLoading(true);

    return next.handle(req).pipe(
      finalize(() => {
        // Stop loading when request completes (success or error)
        this.loadingService.setLoading(false);
      }),
    );
  }
}
