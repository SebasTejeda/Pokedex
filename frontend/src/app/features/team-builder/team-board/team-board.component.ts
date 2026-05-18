import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PokeapiService } from '../../../core/services/pokeapi/pokeapi.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Pokemon } from '../../../core/models/pokemon.model';
import { catchError, forkJoin, of } from 'rxjs';
import { PokemonCardComponent } from '../../../shared/components/pokemon-card/pokemon-card.component';
import { TeamService } from '../../../core/services/team/team.service';
import { NgClass, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Team } from '../../../core/models/team.model';

@Component({
  selector: 'app-team-board',
  imports: [ReactiveFormsModule, PokemonCardComponent, TitleCasePipe],
  templateUrl: './team-board.component.html',
  styleUrl: './team-board.component.css',
})
export class TeamBoardComponent implements OnInit {
  private pokeApiService = inject(PokeapiService);
  teamService = inject(TeamService);

  // ========================================================
  // 📊 SIGNALS - CATÁLOGO DE POKÉMON
  // ========================================================

  allPokemonNames = signal<string[]>([]);
  filteredNames = signal<string[]>([]);
  paginatedPokemon = signal<Pokemon[]>([]);
  currentPage = signal(1);
  totalPages = signal(0);
  pageSize = 20;

  // ========================================================
  // 🔍 SIGNALS - BÚSQUEDA Y FILTROS
  // ========================================================

  searchTerm = signal('');
  selectedType = signal<string>('all');
  selectedGeneration = signal<number>(0);
  showTypeFilter = signal(false);
  showGenFilter = signal(false);

  pokemonIdMap = signal<Map<string, number>>(new Map());

  // ========================================================
  // 👥 SIGNALS - EQUIPO
  // ========================================================

  loadedPokemons = signal<Pokemon[]>([]);
  myTeam = computed(() => {
    const currentTeam = this.teamService.currentTeam();
    if (!currentTeam) {
      return [];
    }

    const loadedPokemons = this.loadedPokemons();

    const filtered = loadedPokemons.filter((pokemon) =>
      currentTeam.members.some((member) => {
        const match = member.pokemon_id === pokemon.id;
        return match;
      }),
    );

    return filtered;
  });

  // ========================================================
  // 🎯 SIGNALS - UI Y NAVEGACIÓN
  // ========================================================

  activeTab = signal<'catalog' | 'team' | 'stats'>('catalog');
  selectedPokemonInfo = signal<Pokemon | null>(null);

  // ========================================================
  // 🎨 SIGNALS - EQUIPOS (MODAL Y SELECTOR)
  // ========================================================

  showCreateTeamModal = signal(false);
  newTeamName = signal('');
  newTeamNotes = signal('');
  showTeamSelector = signal(false);

  // ========================================================
  // 🔔 SIGNALS - NOTIFICACIONES
  // ========================================================

  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'warning'>('success');
  toastVisible = signal<boolean>(false);

  // ========================================================
  // 📋 DATOS ESTÁTICOS - TIPOS Y GENERACIONES
  // ========================================================

  pokemonTypes = [
    {
      value: 'all',
      label: 'Todos los tipos',
      icon: 'https://cdn-icons-png.flaticon.com/512/9796/9796625.png',
    },
    {
      value: 'normal',
      label: 'Normal',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Pok%C3%A9mon_Normal_Type_Icon.svg/1280px-Pok%C3%A9mon_Normal_Type_Icon.svg.png',
    },
    {
      value: 'fire',
      label: 'Fuego',
      icon: 'https://static.wikia.nocookie.net/pokemon/images/4/47/Type_Fire_HOME.png',
    },
    {
      value: 'water',
      label: 'Agua',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Pok%C3%A9mon_Water_Type_Icon.svg/3840px-Pok%C3%A9mon_Water_Type_Icon.svg.png',
    },
    {
      value: 'grass',
      label: 'Planta',
      icon: 'https://static.wikia.nocookie.net/pokemonfanon/images/3/35/Gen8-Grass.png',
    },
    {
      value: 'electric',
      label: 'Eléctrico',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Pok%C3%A9mon_Electric_Type_Icon.svg/1280px-Pok%C3%A9mon_Electric_Type_Icon.svg.png',
    },
    {
      value: 'ice',
      label: 'Hielo',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Pok%C3%A9mon_Ice_Type_Icon.svg/3840px-Pok%C3%A9mon_Ice_Type_Icon.svg.png',
    },
    {
      value: 'fighting',
      label: 'Lucha',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Pok%C3%A9mon_Fighting_Type_Icon.svg/3840px-Pok%C3%A9mon_Fighting_Type_Icon.svg.png',
    },
    {
      value: 'poison',
      label: 'Veneno',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/1280px-Pok%C3%A9mon_Poison_Type_Icon.svg.png',
    },
    {
      value: 'ground',
      label: 'Tierra',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/3840px-Pok%C3%A9mon_Ground_Type_Icon.svg.png',
    },
    {
      value: 'flying',
      label: 'Volador',
      icon: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e8ddc4da-23dd-4502-b65b-378c9cfe5efa/dffvl6n-4e403272-f641-4ec0-a451-49061d40aef6.png/v1/fill/w_1280,h_1280/flying_type_symbol_galar_by_jormxdos_dffvl6n-fullview.png',
    },
    {
      value: 'psychic',
      label: 'Psíquico',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Pok%C3%A9mon_Psychic_Type_Icon.svg/960px-Pok%C3%A9mon_Psychic_Type_Icon.svg.png',
    },
    {
      value: 'bug',
      label: 'Bicho',
      icon: 'https://www.rw-designer.com/icon-image/21178-256x256x32.png',
    },
    {
      value: 'rock',
      label: 'Roca',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Pok%C3%A9mon_Rock_Type_Icon.svg/1280px-Pok%C3%A9mon_Rock_Type_Icon.svg.png',
    },
    {
      value: 'ghost',
      label: 'Fantasma',
      icon: 'https://www.rw-designer.com/icon-image/21187-256x256x8.png',
    },
    {
      value: 'dragon',
      label: 'Dragón',
      icon: 'https://static.wikia.nocookie.net/pokemongo_es_gamepedia/images/d/d4/Type_Drag%C3%B3n.png',
    },
    {
      value: 'dark',
      label: 'Siniestro',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Pok%C3%A9mon_Dark_Type_Icon.svg/960px-Pok%C3%A9mon_Dark_Type_Icon.svg.png',
    },
    {
      value: 'steel',
      label: 'Acero',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Pok%C3%A9mon_Steel_Type_Icon.svg/1280px-Pok%C3%A9mon_Steel_Type_Icon.svg.png',
    },
    {
      value: 'fairy',
      label: 'Hada',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Pok%C3%A9mon_Fairy_Type_Icon.svg/960px-Pok%C3%A9mon_Fairy_Type_Icon.svg.png',
    },
  ];

  generations = [
    { value: 0, label: 'Todas las generaciones', range: [1, 1025] },
    { value: 1, label: 'Gen I (Kanto)', range: [1, 151] },
    { value: 2, label: 'Gen II (Johto)', range: [152, 251] },
    { value: 3, label: 'Gen III (Hoenn)', range: [252, 386] },
    { value: 4, label: 'Gen IV (Sinnoh)', range: [387, 493] },
    { value: 5, label: 'Gen V (Teselia)', range: [494, 649] },
    { value: 6, label: 'Gen VI (Kalos)', range: [650, 721] },
    { value: 7, label: 'Gen VII (Alola)', range: [722, 809] },
    { value: 8, label: 'Gen VIII (Galar)', range: [810, 905] },
    { value: 9, label: 'Gen IX (Paldea)', range: [906, 1025] },
  ];

  searchControl = new FormControl('');

  // Signals de estado
  pokemonGrid = signal<Pokemon[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  isSaving = signal<boolean>(false);

  private scrollPosition = 0;

  setActiveTab(tab: 'catalog' | 'team' | 'stats') {
    this.activeTab.set(tab);
  }

  getStatIcon(index: number): string {
    const icons = [
      'https://png.pngtree.com/png-clipart/20250103/original/pngtree-heart-icon-png-image_4421855.png', // HP
      'https://cdn-icons-png.flaticon.com/512/1298/1298514.png', // ATK
      'https://cdn-icons-png.flaticon.com/512/306/306771.png', // DEF
    ];
    return icons[index] || 'https://cdn-icons-png.flaticon.com/512/9796/9796625.png';
  }

  // Método getTypeIcon ya lo tienes en pokemon-card.component.ts
  // Necesitas agregarlo aquí también para usar en team view
  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      fire: 'https://static.wikia.nocookie.net/pokemon/images/4/47/Type_Fire_HOME.png',
      water:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Pok%C3%A9mon_Water_Type_Icon.svg/3840px-Pok%C3%A9mon_Water_Type_Icon.svg.png',
      grass: 'https://static.wikia.nocookie.net/pokemonfanon/images/3/35/Gen8-Grass.png',
      electric:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Pok%C3%A9mon_Electric_Type_Icon.svg/1280px-Pok%C3%A9mon_Electric_Type_Icon.svg.png',
      ice: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Pok%C3%A9mon_Ice_Type_Icon.svg/3840px-Pok%C3%A9mon_Ice_Type_Icon.svg.png',
      fighting:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Pok%C3%A9mon_Fighting_Type_Icon.svg/3840px-Pok%C3%A9mon_Fighting_Type_Icon.svg.png',
      poison:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/1280px-Pok%C3%A9mon_Poison_Type_Icon.svg.png',
      ground:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/3840px-Pok%C3%A9mon_Ground_Type_Icon.svg.png',
      flying:
        'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e8ddc4da-23dd-4502-b65b-378c9cfe5efa/dffvl6n-4e403272-f641-4ec0-a451-49061d40aef6.png/v1/fill/w_1280,h_1280/flying_type_symbol_galar_by_jormxdos_dffvl6n-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiIvZi9lOGRkYzRkYS0yM2RkLTQ1MDItYjY1Yi0zNzhjOWNmZTVlZmEvZGZmdmw2bi00ZTQwMzI3Mi1mNjQxLTRlYzAtYTQ1MS00OTA2MWQ0MGFlZjYucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.0SpOD8X3W-aUXABujm8wduM6jk525eBHIPIj_E6Hwmk',
      psychic:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Pok%C3%A9mon_Psychic_Type_Icon.svg/960px-Pok%C3%A9mon_Psychic_Type_Icon.svg.png',
      bug: 'https://www.rw-designer.com/icon-image/21178-256x256x32.png',
      rock: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Pok%C3%A9mon_Rock_Type_Icon.svg/1280px-Pok%C3%A9mon_Rock_Type_Icon.svg.png',
      ghost: 'https://www.rw-designer.com/icon-image/21187-256x256x8.png',
      dragon:
        'https://static.wikia.nocookie.net/pokemongo_es_gamepedia/images/d/d4/Type_Drag%C3%B3n.png',
      dark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Pok%C3%A9mon_Dark_Type_Icon.svg/960px-Pok%C3%A9mon_Dark_Type_Icon.svg.png',
      steel:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Pok%C3%A9mon_Steel_Type_Icon.svg/1280px-Pok%C3%A9mon_Steel_Type_Icon.svg.png',
      fairy:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Pok%C3%A9mon_Fairy_Type_Icon.svg/960px-Pok%C3%A9mon_Fairy_Type_Icon.svg.png',
      normal:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Pok%C3%A9mon_Normal_Type_Icon.svg/1280px-Pok%C3%A9mon_Normal_Type_Icon.svg.png',
    };
    return icons[type] || 'https://cdn-icons-png.flaticon.com/512/9796/9796625.png';
  }

  // Métodos para los dropdowns
  toggleTypeFilter(): void {
    this.showTypeFilter.update((v) => !v);
    this.showGenFilter.set(false);
  }

  toggleGenFilter(): void {
    this.showGenFilter.update((v) => !v);
    this.showTypeFilter.set(false);
  }

  selectType(type: string): void {
    this.selectedType.set(type);
    this.showTypeFilter.set(false);
    this.applyFilters();
  }

  selectGeneration(gen: number): void {
    this.selectedGeneration.set(gen);
    this.showGenFilter.set(false);
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedType.set('all');
    this.selectedGeneration.set(0);
    this.searchTerm.set('');
    this.applyFilters();
  }

  applyFilters(): void {
    // 1. Empezamos con la lista completa de la Pokédex Nacional
    let filtered = [...this.allPokemonNames()];
    const idMap = this.pokemonIdMap();

    // 2. Filtramos por búsqueda de texto
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter((name) => name.includes(search));
    }

    // 3. Filtramos por generación (IDs)
    if (this.selectedGeneration() !== 0) {
      const gen = this.generations.find((g) => g.value === this.selectedGeneration());
      if (gen) {
        filtered = filtered.filter((name) => {
          const id = idMap.get(name);
          return id ? id >= gen.range[0] && id <= gen.range[1] : false;
        });
      }
    }

    // 4. Filtramos por Tipo (La solución definitiva)
    if (this.selectedType() !== 'all') {
      this.isLoading.set(true); // Mostramos el loader mientras consultamos a la PokeAPI

      // Pedimos a la API la lista de TODOS los Pokémon que tienen este tipo
      fetch(`https://pokeapi.co/api/v2/type/${this.selectedType()}`)
        .then((res) => res.json())
        .then((data) => {
          // Extraemos solo los nombres de los Pokémon de la respuesta
          const typePokemonNames = data.pokemon.map((p: any) => p.pokemon.name);

          // Intersectamos: Solo nos quedamos con los que ya pasaron el filtro de texto/gen
          // Y que también están en la lista oficial de ese tipo
          filtered = filtered.filter((name) => typePokemonNames.includes(name));

          this.finishApplyingFilters(filtered);
        })
        .catch((err) => {
          this.showToast('Ocurrió un problema al filtrar por tipo', 'error');
          this.finishApplyingFilters(filtered); // Continuamos aunque falle la API
        });
    } else {
      // Si no hay filtro de tipo, terminamos instantáneamente
      this.finishApplyingFilters(filtered);
    }
  }

  // Pequeña función auxiliar para evitar repetir código
  private finishApplyingFilters(finalList: string[]) {
    this.filteredNames.set(finalList);
    this.currentPage.set(1);
    this.calculatePages();

    // Usamos tu método original, que tomará exactamente los 20 correctos
    this.loadCurrentPage();
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
      this.totalSpeed(),
    ];
    return Math.max(...stats, 1); // Evitamos división por 0
  });

  ngOnInit(): void {
    // Cargar equipos del usuario
    this.loadTeams();

    // Cargar catálogo de Pokémon
    this.loadAllPokemon();

    // Listener para cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.selectedPokemonInfo()) {
        this.closeDetails();
      }
    });
  }

  // ⭐ AGREGAR ESTE MÉTODO
  private loadAllPokemon(): void {
    this.pokeApiService.getPokemonList(10000, 0).subscribe({
      next: (response) => {
        const idMap = new Map<string, number>();

        const standardPokemon = response.results.filter((p: any) => {
          const urlParts = p.url.split('/');
          const id = parseInt(urlParts[urlParts.length - 2]);

          if (id < 10000) {
            idMap.set(p.name, id);
            return true;
          }
          return false;
        });

        this.pokemonIdMap.set(idMap);
        const names = standardPokemon.map((p: any) => p.name);

        this.allPokemonNames.set(names);
        this.filteredNames.set(names);

        this.calculatePages();

        // ⭐ IMPORTANTE: Esto debe estar aquí
        this.loadCurrentPage();
      },
      error: (error) => {
        this.showToast('Error al cargar el catálogo de Pokémon', 'error');
      },
    });
  }

  onSearch() {
    // applyFilters() ya lee this.searchTerm() y hace todo el trabajo
    this.applyFilters();
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

  loadCurrentPage(): void {
    // 1. Encendemos el loader apenas empieza a buscar
    this.isLoading.set(true);

    const page = this.currentPage();
    const names = this.filteredNames();
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageNames = names.slice(start, end);

    const requests = pageNames.map((name) =>
      this.pokeApiService.getPokemon(name).pipe(catchError(() => of(null))),
    );

    forkJoin(requests).subscribe({
      next: (pokemons) => {
        const validPokemons = pokemons.filter((p) => p !== null) as Pokemon[];
        this.paginatedPokemon.set(validPokemons);

        // 2. ¡Apagamos el loader cuando los datos llegan con éxito!
        this.isLoading.set(false);
      },
      error: (error) => {
        // 3. ¡También apagamos el loader si hay un error para no dejar la pantalla bloqueada!
        this.isLoading.set(false);
      },
    });
  }

  // Solo nos quedamos con el Signal para saber qué Pokémon mostra
  openDetails(pokemon: Pokemon) {
    this.selectedPokemonInfo.set(pokemon);

    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
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

  getEmptySlots(): number[] {
    const emptyCount = 6 - this.myTeam().length;
    return Array(emptyCount)
      .fill(0)
      .map((_, i) => i);
  }

  // Agrega este método en tu clase TeamBoardComponent

  getStatShortName(statName: string): string {
    const shortNames: { [key: string]: string } = {
      hp: 'HP',
      attack: 'ATK',
      defense: 'DEF',
      'special-attack': 'SP.ATK',
      'special-defense': 'SP.DEF',
      speed: 'SPD',
    };
    return shortNames[statName] || statName.toUpperCase();
  }

  private loadTeams(): void {
    this.teamService.getTeams().subscribe({
      next: (teams) => {
        // Cargar solo los Pokémon del equipo actual
        const currentTeam = this.teamService.currentTeam();
        if (currentTeam && currentTeam.members.length > 0) {
          this.loadTeamPokemons(currentTeam.members);
        }
      },
      error: (error) => {
        this.showToast('Error al cargar los equipos', 'error');
      },
    });
  }
  // ⭐ AGREGAR ESTE MÉTODO PARA CARGAR POKÉMON DEL EQUIPO
  private loadTeamPokemons(members: any[]): void {
    const pokemonRequests = members.map((member) => {
      return this.pokeApiService.getPokemonById(member.pokemon_id).pipe(
        catchError((error) => {
          return of(null);
        }),
      );
    });

    forkJoin(pokemonRequests).subscribe({
      next: (pokemons) => {
        const validPokemons = pokemons.filter((p) => p !== null) as Pokemon[];

        // Actualizar el signal de Pokémon cargados
        this.loadedPokemons.update((loaded) => {
          // Agregar solo los que no están ya cargados
          const newPokemons = validPokemons.filter(
            (newPoke) => !loaded.some((loadedPoke) => loadedPoke.id === newPoke.id),
          );
          const result = [...loaded, ...newPokemons];
          return result;
        });
      },
      error: (error) => {
        this.showToast('Error al sincronizar tu equipo', 'error');
      },
    });
  }

  createMyFirstTeam() {
    this.isSaving.set(true);

    // Asumiendo que tu TeamService tiene un método createTeam
    const newTeam = {
      name: 'Mi Primer Equipo',
      strategy_notes: 'Equipo inicial competitivo',
    };

    this.teamService.createTeam(newTeam).subscribe({
      next: (team) => {
        this.showToast('¡Equipo creado! Ya puedes atrapar Pokémon.', 'success');
        this.isSaving.set(false);
        // Recargamos para que el ID se guarde en nuestro Signal
        this.loadTeams();
      },
      error: (err) => {
        this.showToast('Error al crear el equipo.', 'error');
        this.isSaving.set(false);
      },
    });
  }

  // ⭐ ACTUALIZAR EL MÉTODO addToTeam
  addToTeam(pokemon: Pokemon): void {
    const currentTeam = this.teamService.currentTeam();
    if (!currentTeam) {
      this.showToast('No hay equipo seleccionado', 'error');
      return;
    }

    // Verificar si ya está en el equipo actual
    if (currentTeam.members.some((m) => m.pokemon_id === pokemon.id)) {
      this.showToast('Este Pokémon ya está en este equipo', 'warning');
      return;
    }

    // Verificar límite de 6
    if (currentTeam.members.length >= 6) {
      this.showToast('El equipo está completo (máximo 6 Pokémon)', 'warning');
      return;
    }

    // Agregar al backend
    this.teamService
      .addPokemonToTeam(currentTeam.id, {
        pokemon_id: pokemon.id,
      })
      .subscribe({
        next: () => {
          // ✅ Agregar a los Pokémon cargados si no está
          this.loadedPokemons.update((loaded) => {
            if (!loaded.some((p) => p.id === pokemon.id)) {
              return [...loaded, pokemon];
            }
            return loaded;
          });

          this.showToast(`${pokemon.name} añadido al equipo`, 'success');
        },
        error: (error) => {
          this.showToast('Error al añadir Pokémon', 'error');
        },
      });
  }

  // ⭐ ACTUALIZAR EL MÉTODO removeFromTeam
  removeFromTeam(pokemon: Pokemon): void {
    const currentTeam = this.teamService.currentTeam();
    if (!currentTeam) {
      this.showToast('No hay equipo seleccionado', 'error');
      return;
    }

    // Eliminar del backend
    this.teamService.removePokemonFromTeam(currentTeam.id, pokemon.id).subscribe({
      next: () => {
        this.showToast(`${pokemon.name} eliminado del equipo`, 'success');
        // El computed signal se actualizará automáticamente
      },
      error: (error) => {
        this.showToast('Error al eliminar Pokémon', 'error');
      },
    });
  }

  openCreateTeamModal(): void {
    this.showCreateTeamModal.set(true);
    this.newTeamName.set('');
    this.newTeamNotes.set('');
  }

  closeCreateTeamModal(): void {
    this.showCreateTeamModal.set(false);
  }

  createNewTeam(): void {
    const name = this.newTeamName().trim();

    if (!name) {
      this.showToast('El nombre del equipo es requerido', 'warning');
      return;
    }

    this.teamService
      .createTeam({
        name: name,
        strategy_notes: this.newTeamNotes().trim() || undefined,
      })
      .subscribe({
        next: (team) => {
          this.showToast(`Equipo "${team.name}" creado exitosamente`, 'success');
          this.closeCreateTeamModal();
        },
        error: (error) => {
          this.showToast('Error al crear el equipo', 'error');
        },
      });
  }
  toggleTeamSelector(): void {
    this.showTeamSelector.update((value) => !value);
  }

  selectTeam(team: Team): void {
    this.teamService.setCurrentTeam(team);
    this.showTeamSelector.set(false);

    // Cargar los Pokémon del equipo seleccionado si no están ya cargados
    const missingPokemons = team.members.filter(
      (member) => !this.loadedPokemons().some((p) => p.id === member.pokemon_id),
    );

    if (missingPokemons.length > 0) {
      this.loadTeamPokemons(missingPokemons);
    }

    this.showToast(`Equipo "${team.name}" seleccionado`, 'success');
  }

  deleteTeam(team: Team, event: Event): void {
    event.stopPropagation(); // Evitar que se cierre el dropdown

    if (confirm(`¿Estás seguro de eliminar el equipo "${team.name}"?`)) {
      this.teamService.deleteTeam(team.id).subscribe({
        next: () => {
          this.showToast(`Equipo "${team.name}" eliminado`, 'success');
        },
        error: (error) => {
          this.showToast('Error al eliminar el equipo', 'error');
        },
      });
    }
  }

  // ========================================================
  // 🔔 MÉTODO PARA MOSTRAR TOASTS
  // ========================================================

  showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      this.toastVisible.set(false);
    }, 3000);
  }
}
