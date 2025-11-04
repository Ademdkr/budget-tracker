import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingService = inject(LoadingService);

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
