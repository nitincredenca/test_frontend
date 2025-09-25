import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, delay, tap, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isLoggedIn = false;

  constructor(private router: Router, private http: HttpClient) {}

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<{success: boolean}>(
      `${this.apiUrl}/auth/login`,
      { username, password },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).pipe(
      map(response => {
        this.isLoggedIn = response.success;
        return response.success;
      }),
      catchError(() => {
        this.isLoggedIn = false;
        return of(false);
      })
    );
  }

  logout(): void {
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
}