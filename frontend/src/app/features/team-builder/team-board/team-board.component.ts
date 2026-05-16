import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PokeapiService } from '../../../core/services/pokeapi/pokeapi.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Pokemon } from '../../../core/models/pokemon.model';
import { catchError, forkJoin, of } from 'rxjs';
import { PokemonCardComponent } from '../../../shared/components/pokemon-card.component/pokemon-card.component';
import { TeamService } from '../../../core/services/team/team.service';
import { NgClass, TitleCasePipe, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-team-board',
  imports: [ReactiveFormsModule, PokemonCardComponent, TitleCasePipe],
  templateUrl: './team-board.component.html',
  styleUrl: './team-board.component.css',
})
export class TeamBoardComponent implements OnInit {
  private pokeapiService = inject(PokeapiService);
  private teamService = inject(TeamService);

  searchControl = new FormControl('');

  // Signals de estado
  pokemonGrid = signal<Pokemon[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  isSaving = signal<boolean>(false);

  activeTab = signal<'catalog' | 'team' | 'stats'>('catalog');

  myTeam = signal<Pokemon[]>([]);

  private scrollPosition = 0;

  setActiveTab(tab: 'catalog' | 'team' | 'stats') {
    this.activeTab.set(tab);
  }

  getStatIcon(index: number): string {
    const icons = [
      'https://png.pngtree.com/png-clipart/20250103/original/pngtree-heart-icon-png-image_4421855.png', // HP
      'https://cdn-icons-png.flaticon.com/512/1298/1298514.png', // ATK
      'https://cdn-icons-png.flaticon.com/512/306/306771.png'    // DEF
    ];
    return icons[index] || 'https://cdn-icons-png.flaticon.com/512/9796/9796625.png';
  }

  // Método getTypeIcon ya lo tienes en pokemon-card.component.ts
  // Necesitas agregarlo aquí también para usar en team view
  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      fire: 'https://static.wikia.nocookie.net/pokemon/images/4/47/Type_Fire_HOME.png',
      water: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Pok%C3%A9mon_Water_Type_Icon.svg/3840px-Pok%C3%A9mon_Water_Type_Icon.svg.png',
      grass: 'https://static.wikia.nocookie.net/pokemonfanon/images/3/35/Gen8-Grass.png',
      electric: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Pok%C3%A9mon_Electric_Type_Icon.svg/1280px-Pok%C3%A9mon_Electric_Type_Icon.svg.png',
      ice: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Pok%C3%A9mon_Ice_Type_Icon.svg/3840px-Pok%C3%A9mon_Ice_Type_Icon.svg.png',
      fighting: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Pok%C3%A9mon_Fighting_Type_Icon.svg/3840px-Pok%C3%A9mon_Fighting_Type_Icon.svg.png',
      poison: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/1280px-Pok%C3%A9mon_Poison_Type_Icon.svg.png',
      ground: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/3840px-Pok%C3%A9mon_Ground_Type_Icon.svg.png',
      flying: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e8ddc4da-23dd-4502-b65b-378c9cfe5efa/dffvl6n-4e403272-f641-4ec0-a451-49061d40aef6.png',
      psychic: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Pok%C3%A9mon_Psychic_Type_Icon.svg/960px-Pok%C3%A9mon_Psychic_Type_Icon.svg.png',
      bug: 'https://www.rw-designer.com/icon-image/21178-256x256x32.png',
      rock: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Pok%C3%A9mon_Rock_Type_Icon.svg/1280px-Pok%C3%A9mon_Rock_Type_Icon.svg.png',
      ghost: 'https://www.rw-designer.com/icon-image/21187-256x256x8.png',
      dragon: 'https://static.wikia.nocookie.net/pokemongo_es_gamepedia/images/d/d4/Type_Drag%C3%B3n.png',
      dark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Pok%C3%A9mon_Dark_Type_Icon.svg/960px-Pok%C3%A9mon_Dark_Type_Icon.svg.png',
      steel: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Pok%C3%A9mon_Steel_Type_Icon.svg/1280px-Pok%C3%A9mon_Steel_Type_Icon.svg.png',
      fairy: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Pok%C3%A9mon_Fairy_Type_Icon.svg/960px-Pok%C3%A9mon_Fairy_Type_Icon.svg.png',
      normal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Pok%C3%A9mon_Normal_Type_Icon.svg/1280px-Pok%C3%A9mon_Normal_Type_Icon.svg.png'
    };
    return icons[type] || 'https://cdn-icons-png.flaticon.com/512/9796/9796625.png';
  }

  totalPower = computed(() => {
    return this.myTeam().reduce((sum, pokemon) => {
      return sum + pokemon.stats[0].base_stat; // Asumimos que el primer stat es el relevante para el poder
    }, 0);
  });

    totalHP = computed(() => {
    return this.myTeam().reduce((sum, pokemon) => {
      // El HP siempre está en la posición 0 del array stats
      return sum + pokemon.stats[0].base_stat;
    }, 0);
  });

  totalAttack = computed(() => {
    return this.myTeam().reduce((sum, pokemon) => {
      return sum + pokemon.stats[1].base_stat; // Asumimos que el segundo stat es el ataque
    }, 0);
  });

  totalDefense = computed(() => {
    return this.myTeam().reduce((sum, pokemon) => {
      return sum + pokemon.stats[2].base_stat; // Asumimos que el tercer stat es la defensa
    }, 0);
  });

  totalSpecialAttack = computed(() => {
    return this.myTeam().reduce((sum, pokemon) => {
      return sum + pokemon.stats[3].base_stat; // Asumimos que el cuarto stat es el ataque especial
    }, 0);
  });

    // Special Defense Total
  totalSpecialDefense = computed(() => {
    return this.myTeam().reduce((sum, pokemon) => {
      return sum + pokemon.stats[4].base_stat;
    }, 0);
  });

  // Speed Total
  totalSpeed = computed(() => {
    return this.myTeam().reduce((sum, pokemon) => {
      return sum + pokemon.stats[5].base_stat;
    }, 0);
  });

  // HP Promedio
  averageHP = computed(() => {
    const team = this.myTeam();
    if (team.length === 0) return 0;
    return Math.round(this.totalHP() / team.length);
  });

  // Pokémon más fuerte (mayor suma de stats)
  strongestPokemon = computed(() => {
    const team = this.myTeam();
    if (team.length === 0) return null;

    return team.reduce((strongest, current) => {
      const currentTotal = current.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
      const strongestTotal = strongest.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
      return currentTotal > strongestTotal ? current : strongest;
    });
  });

  // Pokémon más rápido
  fastestPokemon = computed(() => {
    const team = this.myTeam();
    if (team.length === 0) return null;

    return team.reduce((fastest, current) => {
      const currentSpeed = current.stats[5].base_stat;
      const fastestSpeed = fastest.stats[5].base_stat;
      return currentSpeed > fastestSpeed ? current : fastest;
    });
  });

  // Pokémon con mayor HP
  tankiestPokemon = computed(() => {
    const team = this.myTeam();
    if (team.length === 0) return null;

    return team.reduce((tankiest, current) => {
      const currentHP = current.stats[0].base_stat;
      const tankiestHP = tankiest.stats[0].base_stat;
      return currentHP > tankiestHP ? current : tankiest;
    });
  });

  // Pokémon con mayor Ataque
  strongestAttacker = computed(() => {
    const team = this.myTeam();
    if (team.length === 0) return null;

    return team.reduce((strongest, current) => {
      const currentAttack = current.stats[1].base_stat;
      const strongestAttack = strongest.stats[1].base_stat;
      return currentAttack > strongestAttack ? current : strongest;
    });
  });

  // Máxima stat individual del equipo (para normalizar las barras)
  maxStatValue = computed(() => {
    const stats = [
      this.totalHP(),
      this.totalAttack(),
      this.totalDefense(),
      this.totalSpecialAttack(),
      this.totalSpecialDefense(),
      this.totalSpeed()
    ];
    return Math.max(...stats, 1); // Evitamos división por 0
  });

  // ¡Nuevos Signals para el autocompletado!
  allPokemonNames = signal<string[]>([]); // El diccionario completo
  filteredNames = signal<string[]>([]); // Los nombres filtrados según el término de búsqueda
  currentPage = signal<number>(1);
  pageSize = 20;
  totalPages = signal<number>(1);

  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'warning'>('success');
  toastVisible = signal<boolean>(false);

  ngOnInit(): void {
    // 1. Cargamos el catálogo inicial
    this.pokeapiService.getAllPokemonNames().subscribe((res: any) => {
      
      // FILTRO MÁGICO: Filtramos los resultados antes de sacar los nombres
      const standardPokemon = res.results.filter((p: any) => {
        // La PokeAPI nos da una URL así: "https://pokeapi.co/api/v2/pokemon/25/"
        // Vamos a partir ese texto por las barras '/' y agarrar el número
        const urlParts = p.url.split('/');
        const id = parseInt(urlParts[urlParts.length - 2]); 
        
        // Solo conservamos los que tengan un ID normal (menor a 10000)
        return id < 10000; 
      });

      // Ahora sí, extraemos solo los nombres de los Pokémon estándar
      const names = standardPokemon.map((p: any) => p.name);
      
      this.allPokemonNames.set(names);
      this.filteredNames.set(names); 
      
      this.calculatePages();
      this.loadCurrentPage(); 
    });

    this.loadMyTeam(); 

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.selectedPokemonInfo()) {
        this.closeDetails();
      }
    });
  }

  onSearch() {
    const term = this.searchControl.value?.toLowerCase().trim() || '';

    // Si borran el texto y buscan, restauramos la lista completa
    if (!term) {
      this.filteredNames.set(this.allPokemonNames());
    } else {
      // Filtramos la lista maestra
      const matches = this.allPokemonNames().filter((name) => name.includes(term));
      this.filteredNames.set(matches);
    }

    this.currentPage.set(1); // Siempre que buscamos, volvemos a la página 1
    this.calculatePages();
    this.loadCurrentPage();
  }

  // --- LÓGICA DE PAGINACIÓN ---
  calculatePages() {
    // Calculamos cuántas páginas hay (ej. 1300 / 20 = 65 páginas)
    const total = Math.ceil(this.filteredNames().length / this.pageSize);
    this.totalPages.set(total === 0 ? 1 : total);
  }

  changePage(step: number) {
    const newPage = this.currentPage() + step;
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.currentPage.set(newPage);
      this.loadCurrentPage();
    }
  }

  loadCurrentPage() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.pokemonGrid.set([]);

    // Calculamos el corte del arreglo. Ej: Página 1 corta del 0 al 20.
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;

    const namesToLoad = this.filteredNames().slice(start, end);

    if (namesToLoad.length === 0) {
      this.errorMessage.set('No se encontraron Pokémon.');
      this.isLoading.set(false);
      return;
    }

    const requests = namesToLoad.map((name) => this.pokeapiService.getPokemon(name));

    forkJoin(requests).subscribe({
      next: (results) => {
        this.pokemonGrid.set(results);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar la cuadrícula.');
        this.isLoading.set(false);
      },
    });
  }

  addToMyTeam(pokemon: Pokemon) {

    if (this.myTeam().length >= 6) {
      this.showToast('Tu equipo ya tiene 6 Pokémon. Elimina uno para añadir otro.', 'warning');
      return
    }
    // 1. REGLA DE NEGOCIO: Evitar duplicados (Species Clause)
    // Usamos .some() que devuelve true si encuentra al menos un Pokémon con ese ID
    const alreadyExists = this.myTeam().some((member) => member.id === pokemon.id);

    if (alreadyExists) {
      this.showToast(`¡${pokemon.name} ya está en tu equipo! Elige otro diferente.`, 'error');
      return; // Detenemos la ejecución de la función aquí mismo
    }

    // Si pasa la validación, procedemos a guardar
    this.isSaving.set(true);
    const memberData = { pokemon_id: pokemon.id };

    this.teamService.addPokemonToTeam(1, memberData).subscribe({
      next: () => {
        this.showToast(`¡${pokemon.name} añadido a tu equipo!`, 'success');
        this.isSaving.set(false);
        this.loadMyTeam();
      },
      error: (err: any) => {
        console.error(err);
        this.showToast('No se pudo añadir el Pokémon a tu equipo.', 'error');
        this.isSaving.set(false);
      },
    });
  }

  loadMyTeam() {
    this.teamService.getTeams().subscribe({
      next: (teams) => {
        const currentTeam = teams.find((t) => t.id === 1);

        if (currentTeam && currentTeam.members.length > 0) {
          // Modificamos cómo hacemos las peticiones
          const requests = currentTeam.members.map((member) =>
            this.pokeapiService.getPokemon(member.pokemon_id).pipe(
              // Si esta petición falla (ej. pokemon_id: 0), atrapamos el error
              // y devolvemos un 'null' pacíficamente para que forkJoin no colapse
              catchError((err) => {
                console.warn(`Se ignoró el registro corrupto con ID: ${member.pokemon_id}`);
                return of(null);
              }),
            ),
          );

          forkJoin(requests).subscribe((pokemons) => {
            const validPokemons = pokemons.filter((p) => p !== null) as Pokemon[];
            this.myTeam.set(validPokemons);
          });
        } else {
          this.myTeam.set([]);
        }
      },
      error: (err) => console.error('Error al cargar el equipo de la BD', err),
    });
  }

  // Solo nos quedamos con el Signal para saber qué Pokémon mostrar
  selectedPokemonInfo = signal<Pokemon | null>(null);

  openDetails(pokemon: Pokemon) {
    this.selectedPokemonInfo.set(pokemon);

    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);

    // Ocultamos el toast después de 3 segundos
    setTimeout(() => {
      this.toastVisible.set(false);
    }, 3000);
  }

  closeDetails() {
    this.selectedPokemonInfo.set(null);

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    
    // ⭐ VOLVER A LA POSICIÓN EXACTA DONDE ESTABA
    window.scrollTo(0, this.scrollPosition);
  }

  removeFromMyTeam(pokemonId: number) {
    // Usamos el ID 1 que es nuestro equipo por defecto
    this.teamService.removePokemonFromTeam(1, pokemonId).subscribe({
      next: () => {
        // Al eliminarse de la BD, simplemente volvemos a cargar nuestro equipo
        // para que la interfaz se actualice sola.
        this.loadMyTeam();
      },
      error: (err: any) => {
        console.error('Error al quitar Pokémon:', err);
        this.showToast('No se pudo eliminar el Pokémon de la base de datos.', 'error');
      }
    });
  }
  // Agrega este método a tu clase TeamBoardComponent

getEmptySlots(): number[] {
  const emptyCount = 6 - this.myTeam().length;
  return Array(emptyCount).fill(0).map((_, i) => i);
}

// Agrega este método en tu clase TeamBoardComponent

getStatShortName(statName: string): string {
  const shortNames: { [key: string]: string } = {
    'hp': 'HP',
    'attack': 'ATK',
    'defense': 'DEF',
    'special-attack': 'SP.ATK',
    'special-defense': 'SP.DEF',
    'speed': 'SPD'
  };
  return shortNames[statName] || statName.toUpperCase();
}
}
