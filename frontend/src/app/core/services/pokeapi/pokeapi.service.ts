import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pokemon, PokemonListResponse } from '../../models/pokemon.model';

@Injectable({
  providedIn: 'root',
})
export class PokeapiService {
  private http = inject(HttpClient);

  private readonly baseUrl = 'https://pokeapi.co/api/v2/pokemon';

  getPokemon(query: string | number): Observable<Pokemon> {
    const parseQuery = typeof query === 'string' ? query.toLowerCase().trim() : query;
    return this.http.get<Pokemon>(`${this.baseUrl}/${parseQuery}`);
  }

  getAllPokemonNames(): Observable<PokemonListResponse> {
    return this.http.get<PokemonListResponse>(`${this.baseUrl}?limit=10000`);
  }
}
