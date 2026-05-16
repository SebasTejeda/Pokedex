// --- MODELOS PARA LOS MIEMBROS DEL EQUIPO ---

/** Interfaz para crear un nuevo miembro (POST) */
export interface TeamMemberCreate {
  pokemon_id: number;
  custom_nickname?: string;
  held_item?: string;
}

/** Interfaz del miembro tal cual viene de la Base de Datos */
export interface TeamMember extends TeamMemberCreate {
  id: number;
  team_id: number;
}


// --- MODELOS PARA LOS EQUIPOS ---

/** Interfaz para crear un equipo nuevo */
export interface TeamCreate {
  name: string;
  strategy_notes?: string;
}

/** Interfaz completa del Equipo */
export interface Team {
  id: number;
  name: string;
  strategy_notes?: string;
  user_id: number;
  // Relación anidada: un equipo tiene un arreglo de miembros
  members: TeamMember[]; 
}