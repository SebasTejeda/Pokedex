// --- MODELOS PARA LOS MIEMBROS DEL EQUIPO ---


export interface TeamMember {
  id: number;
  team_id: number;
  pokemon_id: number;
  custom_nickname?: string;
  held_item?: string;
}

export interface Team {
  id: number;
  name: string;
  strategy_notes?: string;
  user_id: number;
  members: TeamMember[];
}

export interface TeamCreate {
  name: string;
  strategy_notes?: string;
}

export interface TeamUpdate {
  name?: string;
  strategy_notes?: string;
}

export interface TeamMemberCreate {
  pokemon_id: number;
  custom_nickname?: string;
  held_item?: string;
}
/** Interfaz para crear un nuevo miembro (POST) */
export interface TeamMemberCreate {
  pokemon_id: number;
  custom_nickname?: string;
  held_item?: string;
}
