// src/app/core/services/pokeapi/pokeapi.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Pokemon, PokemonListResponse } from '../../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class PokeapiService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'https://pokeapi.co/api/v2';

  /**
   * Obtiene la lista de Pokémon con paginación
   */
  getPokemonList(limit: number = 20, offset: number = 0): Observable<PokemonListResponse> {
    return this.http.get<any>(`${this.apiUrl}/pokemon?limit=${limit}&offset=${offset}`).pipe(
      map(response => ({
        count: response.count,
        next: response.next,
        previous: response.previous,
        results: response.results
      })),
      catchError(error => {
        console.error('Error obteniendo lista de Pokémon:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene un Pokémon específico por nombre o ID
   */
  getPokemon(nameOrId: string | number): Observable<Pokemon> {
    return this.http.get<any>(`${this.apiUrl}/pokemon/${nameOrId}`).pipe(
      map(data => this.transformPokemonData(data)),
      catchError(error => {
        console.error(`Error obteniendo Pokémon ${nameOrId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene un Pokémon específico por su ID
   */
  getPokemonById(id: number): Observable<Pokemon> {
    return this.http.get<any>(`${this.apiUrl}/pokemon/${id}`).pipe(
      map(data => this.transformPokemonData(data)),
      catchError(error => {
        console.error(`Error obteniendo Pokémon ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Transforma los datos de la API al formato de nuestro modelo
   */
  private transformPokemonData(data: any): Pokemon {
    return {
      id: data.id,
      name: data.name,
      height: data.height,
      weight: data.weight,
      base_experience: data.base_experience,
      sprites: {
        front_default: data.sprites.front_default,
        front_shiny: data.sprites.front_shiny,
        other: {
          'official-artwork': {
            front_default: data.sprites.other['official-artwork'].front_default,
            front_shiny: data.sprites.other['official-artwork'].front_shiny
          }
        }
      },
      types: data.types.map((t: any) => ({
        slot: t.slot,
        type: {
          name: t.type.name,
          url: t.type.url
        }
      })),
      stats: data.stats.map((s: any) => ({
        base_stat: s.base_stat,
        effort: s.effort,
        stat: {
          name: s.stat.name,
          url: s.stat.url
        }
      })),
      abilities: data.abilities.map((a: any) => ({
        is_hidden: a.is_hidden,
        slot: a.slot,
        ability: {
          name: a.ability.name,
          url: a.ability.url
        }
      }))
    };
  }

  /**
   * Obtiene todos los nombres de los Pokémon de una sola vez (ideal para buscadores)
   */
  getAllPokemonNames(): Observable<any> {
    // Le ponemos un límite de 10000 para asegurarnos de traer a todos los Pokémon existentes
    return this.http.get<any>(`${this.apiUrl}/pokemon?limit=10000`).pipe(
      catchError(error => {
        console.error('Error obteniendo la lista completa de Pokémon:', error);
        return throwError(() => error);
      })
    );
  }
}