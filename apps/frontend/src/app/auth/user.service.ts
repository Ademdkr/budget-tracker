import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserInfo {
  id: string;
  name: string;
  surname: string;
  email: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3001/api/auth';

  getUsers(): Observable<UserInfo[]> {
    return this.http.get<UserInfo[]>(`${this.baseUrl}/users`);
  }
}
