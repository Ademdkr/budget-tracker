import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

import { routes } from './app.routes';
import { LoadingInterceptor } from './shared/interceptors/loading.interceptor';
import { authInterceptor } from './shared/interceptors/auth.interceptor';

// Chart.js Registrierung
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// Deutsche Locale registrieren
registerLocaleData(localeDe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true,
    },
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
  ],
};
