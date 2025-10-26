import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private activeRequestsCount = 0;

  setLoading(loading: boolean) {
    if (loading) {
      this.activeRequestsCount++;
    } else {
      this.activeRequestsCount--;
      if (this.activeRequestsCount < 0) {
        this.activeRequestsCount = 0;
      }
    }

    // Only emit true when there are active requests, false when no active requests
    this.loadingSubject.next(this.activeRequestsCount > 0);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}