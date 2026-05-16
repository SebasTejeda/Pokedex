from pydantic import BaseModel
from typing import List, Optional

# --- ESQUEMAS PARA LOS MIEMBROS DEL EQUIPO ---

# Lo que pedimos cuando el usuario añade un Pokémon al equipo
class TeamMemberCreate(BaseModel):
    pokemon_id: int
    custom_nickname: Optional[str] = None
    held_item: Optional[str] = None

# Lo que devolvemos al frontend
class TeamMember(BaseModel):
    id: int
    team_id: int
    pokemon_id: int
    custom_nickname: Optional[str] = None
    held_item: Optional[str] = None

    # Esto le dice a Pydantic que lea los datos del modelo de SQLAlchemy
    model_config = {"from_attributes": True}


# --- ESQUEMAS PARA LOS EQUIPOS ---

# Lo que pedimos cuando el usuario crea un equipo nuevo
class TeamCreate(BaseModel):
    name: str
    strategy_notes: Optional[str] = None

# Lo que devolvemos al frontend (Incluyendo la lista de sus Pokémon)
class Team(BaseModel):
    id: int
    name: str
    strategy_notes: Optional[str] = None
    user_id: int
    members: List[TeamMember] = [] # ¡Aquí anidamos los miembros!

    model_config = {"from_attributes": True}