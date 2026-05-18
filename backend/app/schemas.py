from pydantic import BaseModel, EmailStr, Field
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
    

class UserCreate(BaseModel):
    """Datos para registrar un nuevo usuario"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    """Datos para iniciar sesión"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Datos del usuario que se devuelven (sin contraseña)"""
    id: int
    username: str
    email: str
    
    model_config = {"from_attributes": True}

class Token(BaseModel):
    """Respuesta de login/register con token"""
    access_token: str
    token_type: str
    user: UserResponse

# ==========================================
# 📦 ESQUEMAS DE EQUIPOS (tus schemas actuales)
# ==========================================

class TeamMemberCreate(BaseModel):
    pokemon_id: int
    custom_nickname: Optional[str] = None
    held_item: Optional[str] = None

class TeamMember(BaseModel):
    id: int
    team_id: int
    pokemon_id: int
    custom_nickname: Optional[str] = None
    held_item: Optional[str] = None

    model_config = {"from_attributes": True}

class TeamCreate(BaseModel):
    name: str
    strategy_notes: Optional[str] = None

class TeamUpdate(BaseModel):
    """Para actualizar equipos"""
    name: Optional[str] = None
    strategy_notes: Optional[str] = None

class Team(BaseModel):
    id: int
    name: str
    strategy_notes: Optional[str] = None
    user_id: int
    members: List[TeamMember] = []

    model_config = {"from_attributes": True}