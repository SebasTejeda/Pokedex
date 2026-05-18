// src/app/core/services/team/team.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Team, TeamCreate, TeamMember, TeamMemberCreate, TeamUpdate } from '../../models/team.model';

// ==========================================
// 🔹 INTERFACES
// ==========================================



// ==========================================
// 🔹 TEAM SERVICE
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ==========================================
  // 📊 SIGNALS
  // ==========================================

  teams = signal<Team[]>([]);
  currentTeam = signal<Team | null>(null);
  isLoading = signal(false);
  error = signal<string>('');

  // ==========================================
  // 📦 MÉTODOS DE EQUIPOS
  // ==========================================

  /**
   * Obtiene todos los equipos del usuario autenticado
   */
  getTeams(): Observable<Team[]> {
    this.isLoading.set(true);
    this.error.set('');

    return this.http.get<Team[]>(`${this.apiUrl}/teams/`).pipe(
      tap(teams => {
        this.teams.set(teams);
        
        // Si no hay equipo actual o ya no existe, seleccionar el primero
        const current = this.currentTeam();
        if (!current || !teams.find(t => t.id === current.id)) {
          this.currentTeam.set(teams[0] || null);
        }
        
        this.isLoading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene un equipo específico por ID
   */
  getTeam(teamId: number): Observable<Team> {
    this.isLoading.set(true);
    this.error.set('');

    return this.http.get<Team>(`${this.apiUrl}/teams/${teamId}`).pipe(
      tap(team => {
        this.currentTeam.set(team);
        
        // Actualizar en la lista de equipos
        this.teams.update(teams => 
          teams.map(t => t.id === team.id ? team : t)
        );
        
        this.isLoading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Crea un nuevo equipo
   */
  createTeam(teamData: TeamCreate): Observable<Team> {
    this.isLoading.set(true);
    this.error.set('');

    return this.http.post<Team>(`${this.apiUrl}/teams/`, teamData).pipe(
      tap(newTeam => {
        // Agregar el nuevo equipo a la lista
        this.teams.update(teams => [...teams, newTeam]);
        
        // Seleccionarlo como equipo actual
        this.currentTeam.set(newTeam);
        
        this.isLoading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza un equipo existente
   */
  updateTeam(teamId: number, teamData: TeamUpdate): Observable<Team> {
    this.isLoading.set(true);
    this.error.set('');

    return this.http.put<Team>(`${this.apiUrl}/teams/${teamId}`, teamData).pipe(
      tap(updatedTeam => {
        // Actualizar en la lista
        this.teams.update(teams => 
          teams.map(t => t.id === updatedTeam.id ? updatedTeam : t)
        );
        
        // Actualizar equipo actual si es el mismo
        if (this.currentTeam()?.id === updatedTeam.id) {
          this.currentTeam.set(updatedTeam);
        }
        
        this.isLoading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Elimina un equipo
   */
  deleteTeam(teamId: number): Observable<void> {
    this.isLoading.set(true);
    this.error.set('');

    return this.http.delete<void>(`${this.apiUrl}/teams/${teamId}`).pipe(
      tap(() => {
        // Eliminar de la lista
        this.teams.update(teams => teams.filter(t => t.id !== teamId));
        
        // Si era el equipo actual, seleccionar otro
        if (this.currentTeam()?.id === teamId) {
          const remainingTeams = this.teams();
          this.currentTeam.set(remainingTeams[0] || null);
        }
        
        this.isLoading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // ==========================================
  // 🎮 MÉTODOS DE MIEMBROS DEL EQUIPO
  // ==========================================

  /**
   * Añade un Pokémon al equipo
   */
  addPokemonToTeam(teamId: number, memberData: TeamMemberCreate): Observable<TeamMember> {
    this.isLoading.set(true);
    this.error.set('');

    return this.http.post<TeamMember>(
      `${this.apiUrl}/teams/${teamId}/members/`, 
      memberData
    ).pipe(
      tap(newMember => {
        // Actualizar el equipo en la lista
        this.teams.update(teams => 
          teams.map(team => {
            if (team.id === teamId) {
              return {
                ...team,
                members: [...team.members, newMember]
              };
            }
            return team;
          })
        );

        // Actualizar equipo actual si es el mismo
        const current = this.currentTeam();
        if (current && current.id === teamId) {
          this.currentTeam.set({
            ...current,
            members: [...current.members, newMember]
          });
        }

        this.isLoading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Elimina un Pokémon del equipo
   */
  removePokemonFromTeam(teamId: number, pokemonId: number): Observable<void> {
    this.isLoading.set(true);
    this.error.set('');

    return this.http.delete<void>(
      `${this.apiUrl}/teams/${teamId}/members/${pokemonId}`
    ).pipe(
      tap(() => {
        // Actualizar el equipo en la lista
        this.teams.update(teams => 
          teams.map(team => {
            if (team.id === teamId) {
              return {
                ...team,
                members: team.members.filter(m => m.pokemon_id !== pokemonId)
              };
            }
            return team;
          })
        );

        // Actualizar equipo actual si es el mismo
        const current = this.currentTeam();
        if (current && current.id === teamId) {
          this.currentTeam.set({
            ...current,
            members: current.members.filter(m => m.pokemon_id !== pokemonId)
          });
        }

        this.isLoading.set(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // ==========================================
  // 🛠️ MÉTODOS AUXILIARES
  // ==========================================

  /**
   * Establece el equipo actual
   */
  setCurrentTeam(team: Team | null): void {
    this.currentTeam.set(team);
  }

  /**
   * Verifica si un Pokémon está en el equipo actual
   */
  isPokemonInCurrentTeam(pokemonId: number): boolean {
    const current = this.currentTeam();
    if (!current) return false;
    return current.members.some(m => m.pokemon_id === pokemonId);
  }

  /**
   * Obtiene el número de Pokémon en el equipo actual
   */
  getCurrentTeamSize(): number {
    return this.currentTeam()?.members.length || 0;
  }

  /**
   * Verifica si el equipo está lleno (6 Pokémon)
   */
  isCurrentTeamFull(): boolean {
    return this.getCurrentTeamSize() >= 6;
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.teams.set([]);
    this.currentTeam.set(null);
    this.isLoading.set(false);
    this.error.set('');
  }

  // ==========================================
  // ❌ MANEJO DE ERRORES
  // ==========================================

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.isLoading.set(false);
    
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = error.error?.detail || 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado. Por favor inicia sesión';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error del servidor. Intenta más tarde';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.error?.detail || error.message}`;
      }
    }
    
    this.error.set(errorMessage);
    console.error('Error en TeamService:', error);
    
    return throwError(() => new Error(errorMessage));
  }
}