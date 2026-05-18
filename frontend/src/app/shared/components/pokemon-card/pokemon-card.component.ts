import { Component, input, output, signal, computed } from '@angular/core';
import { Pokemon } from '../../../core/models/pokemon.model';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [TitleCasePipe],
  templateUrl: './pokemon-card.component.html',
  styleUrl: './pokemon-card.component.css',
})
export class PokemonCardComponent {
  pokemon = input.required<Pokemon>();

  addClick = output<Pokemon>();
  infoClick = output<Pokemon>();

  // Signal para efecto shiny aleatorio (1 en 20 chance)
  isShiny = computed(() => {
    return this.pokemon().id % 20 === 0;
  });

  onAddClick() {
    this.addClick.emit(this.pokemon());
  }

  onInfoClick() {
    this.infoClick.emit(this.pokemon());
  }

  // Mapeo de tipos a iconos/emojis
  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      fire: 'https://static.wikia.nocookie.net/pokemon/images/4/47/Type_Fire_HOME.png/revision/latest/scale-to-width-down/1200?cb=20220611140500',
      water: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Pok%C3%A9mon_Water_Type_Icon.svg/3840px-Pok%C3%A9mon_Water_Type_Icon.svg.png',
      grass: 'https://static.wikia.nocookie.net/pokemonfanon/images/3/35/Gen8-Grass.png/revision/latest/smart/width/250/height/250?cb=20201110231712',
      electric: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Pok%C3%A9mon_Electric_Type_Icon.svg/1280px-Pok%C3%A9mon_Electric_Type_Icon.svg.png',
      ice: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Pok%C3%A9mon_Ice_Type_Icon.svg/3840px-Pok%C3%A9mon_Ice_Type_Icon.svg.png',
      fighting: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Pok%C3%A9mon_Fighting_Type_Icon.svg/3840px-Pok%C3%A9mon_Fighting_Type_Icon.svg.png',
      poison: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/1280px-Pok%C3%A9mon_Poison_Type_Icon.svg.png',
      ground: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/3840px-Pok%C3%A9mon_Ground_Type_Icon.svg.png',
      flying: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/e8ddc4da-23dd-4502-b65b-378c9cfe5efa/dffvl6n-4e403272-f641-4ec0-a451-49061d40aef6.png/v1/fill/w_894,h_894/flying_type_symbol_galar_by_jormxdos_dffvl6n-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiIvZi9lOGRkYzRkYS0yM2RkLTQ1MDItYjY1Yi0zNzhjOWNmZTVlZmEvZGZmdmw2bi00ZTQwMzI3Mi1mNjQxLTRlYzAtYTQ1MS00OTA2MWQ0MGFlZjYucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.0SpOD8X3W-aUXABujm8wduM6jk525eBHIPIj_E6Hwmk',
      psychic: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Pok%C3%A9mon_Psychic_Type_Icon.svg/960px-Pok%C3%A9mon_Psychic_Type_Icon.svg.png',
      bug: 'https://www.rw-designer.com/icon-image/21178-256x256x32.png',
      rock: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Pok%C3%A9mon_Rock_Type_Icon.svg/1280px-Pok%C3%A9mon_Rock_Type_Icon.svg.png',
      ghost: 'https://www.rw-designer.com/icon-image/21187-256x256x8.png',
      dragon: 'https://static.wikia.nocookie.net/pokemongo_es_gamepedia/images/d/d4/Type_Drag%C3%B3n.png/revision/latest/scale-to-width-down/150?cb=20161221101725',
      dark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Pok%C3%A9mon_Dark_Type_Icon.svg/960px-Pok%C3%A9mon_Dark_Type_Icon.svg.png',
      steel: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Pok%C3%A9mon_Steel_Type_Icon.svg/1280px-Pok%C3%A9mon_Steel_Type_Icon.svg.png',
      fairy: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Pok%C3%A9mon_Fairy_Type_Icon.svg/960px-Pok%C3%A9mon_Fairy_Type_Icon.svg.png',
      normal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Pok%C3%A9mon_Normal_Type_Icon.svg/1280px-Pok%C3%A9mon_Normal_Type_Icon.svg.png'
    };
    return icons[type] || 'https://cdn-icons-png.flaticon.com/512/9796/9796625.png';
  }

  // Determina rareza basada en suma de stats (para efecto visual)
  getRarity(): 'common' | 'rare' | 'legendary' {
    const totalStats = this.pokemon().stats.reduce((sum, stat) => sum + stat.base_stat, 0);
    if (totalStats >= 600) return 'legendary';
    if (totalStats >= 500) return 'rare';
    return 'common';
  }
}