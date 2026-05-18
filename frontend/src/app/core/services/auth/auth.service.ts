// src/app/core/services/auth/auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'pokeapp_token';
  private readonly USER_KEY = 'pokeapp_user';

  // ==========================================
  // 📊 SIGNALS (Estado Reactivo)
  // ==========================================
  
  currentUser = signal<User | null>(this.getUserFromStorage());
  isAuthenticated = computed(() => this.currentUser() !== null);

  // ==========================================
  // 🔐 MÉTODOS DE AUTENTICACIÓN
  // ==========================================

  /**
   * Registra un nuevo usuario
   */
  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => {
        console.error('Error en registro:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Inicia sesión
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cierra sesión
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Verifica si hay un token válido
   */
  hasValidToken(): boolean {
    return !!this.getToken();
  }

  // ==========================================
  // 🛠️ MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Maneja el éxito de autenticación (login/register)
   */
  private handleAuthSuccess(response: AuthResponse): void {
    // Guardar token
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    
    // Guardar usuario
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    
    // Actualizar signal
    this.currentUser.set(response.user);
  }

  /**
   * Recupera el usuario desde localStorage
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }
}