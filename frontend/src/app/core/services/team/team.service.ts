import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team, TeamMemberCreate } from '../../models/team.model'; 
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private http = inject(HttpClient);
  
  // La URL de tu backend FastAPI
  private readonly apiUrl = environment.apiUrl; 

  // ¡ESTA es la función que TypeScript está buscando!
  addPokemonToTeam(teamId: number, memberData: TeamMemberCreate): Observable<any> {
    return this.http.post(`${this.apiUrl}/teams/${teamId}/members/`, memberData);
  }

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiUrl}/teams/`);
  }

  
  // Añade este método en tu clase TeamService
  removePokemonFromTeam(teamId: number, pokemonId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/teams/${teamId}/members/${pokemonId}`);
  }
}