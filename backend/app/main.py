# app/main.py
import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app import crud, models, schemas
from app.database import engine
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_db
)

# ==========================================
# 🔧 CONFIGURACIÓN INICIAL
# ==========================================

load_dotenv()

# Crear tablas en la base de datos
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PokéApp API",
    description="API para gestión de equipos Pokémon competitivos",
    version="1.0.0"
)

# ==========================================
# 🌐 CONFIGURACIÓN DE CORS
# ==========================================

cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:4200")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ==========================================
# 🏠 RUTA RAÍZ
# ==========================================

@app.get("/")
def read_root():
    return {
        "mensaje": "¡Bienvenido a PokéApp API! 🎮",
        "documentacion": "/docs",
        "version": "1.0.0"
    }

# ==========================================
# 🔐 RUTAS DE AUTENTICACIÓN
# ==========================================

@app.post("/auth/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario en el sistema.
    
    - Verifica que el email no esté en uso
    - Verifica que el username no esté en uso
    - Crea el usuario con contraseña encriptada
    - Crea un equipo por defecto
    - Retorna token de acceso
    """
    
    # Verificar si el email ya existe
    existing_email = crud.get_user_by_email(db, email=user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Verificar si el username ya existe
    existing_username = crud.get_user_by_username(db, username=user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso"
        )
    
    # Crear usuario
    new_user = crud.create_user(db=db, user=user_data)
    
    # Crear equipo por defecto
    default_team = models.Team(
        name="Mi Primer Equipo",
        strategy_notes="¡Bienvenido a PokéApp! Comienza a formar tu equipo competitivo.",
        user_id=new_user.id
    )
    db.add(default_team)
    db.commit()
    
    # Crear token de acceso
    access_token = create_access_token(data={"user_id": new_user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }


@app.post("/auth/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Inicia sesión con email y contraseña.
    
    - Busca el usuario por email
    - Verifica la contraseña
    - Genera token JWT
    """
    
    # Buscar usuario por email
    user = crud.get_user_by_email(db, email=credentials.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Verificar contraseña
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Crear token de acceso
    access_token = create_access_token(data={"user_id": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@app.get("/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Obtiene la información del usuario actual.
    
    Requiere token de autenticación en el header:
    Authorization: Bearer <token>
    """
    return current_user


# ==========================================
# 📦 RUTAS DE EQUIPOS (PROTEGIDAS)
# ==========================================

@app.get("/teams/", response_model=list[schemas.Team])
def read_teams(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los equipos del usuario actual.
    
    Requiere autenticación.
    """
    return crud.get_user_teams(db, user_id=current_user.id)


@app.get("/teams/{team_id}", response_model=schemas.Team)
def read_team(
    team_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene un equipo específico del usuario actual.
    
    Requiere autenticación.
    """
    team = crud.get_team_by_id(db, team_id=team_id, user_id=current_user.id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )
    
    return team


@app.post("/teams/", response_model=schemas.Team, status_code=status.HTTP_201_CREATED)
def create_team(
    team: schemas.TeamCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo equipo para el usuario actual.
    
    Requiere autenticación.
    """
    return crud.create_team(db=db, team=team, user_id=current_user.id)


@app.put("/teams/{team_id}", response_model=schemas.Team)
def update_team(
    team_id: int,
    team_update: schemas.TeamUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza un equipo existente del usuario actual.
    
    Requiere autenticación.
    """
    updated_team = crud.update_team(
        db=db,
        team_id=team_id,
        team_update=team_update,
        user_id=current_user.id
    )
    
    if not updated_team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )
    
    return updated_team


@app.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un equipo del usuario actual.
    
    Requiere autenticación.
    """
    success = crud.delete_team(db=db, team_id=team_id, user_id=current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )
    
    return None


# ==========================================
# 🎮 RUTAS DE MIEMBROS DEL EQUIPO (POKÉMON)
# ==========================================

@app.post("/teams/{team_id}/members/", response_model=schemas.TeamMember, status_code=status.HTTP_201_CREATED)
def add_pokemon_to_team(
    team_id: int,
    member: schemas.TeamMemberCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Añade un Pokémon al equipo.
    
    - Verifica que el equipo pertenece al usuario
    - Valida que no haya más de 6 Pokémon
    - Añade el Pokémon al equipo
    
    Requiere autenticación.
    """
    
    # Verificar que el equipo pertenece al usuario
    team = crud.get_team_by_id(db, team_id=team_id, user_id=current_user.id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )
    
    # Intentar añadir el Pokémon
    new_member = crud.create_team_member(db=db, member=member, team_id=team_id)
    
    if not new_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El equipo ya tiene 6 Pokémon. Elimina uno para añadir otro."
        )
    
    return new_member


@app.delete("/teams/{team_id}/members/{pokemon_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_pokemon_from_team(
    team_id: int,
    pokemon_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un Pokémon del equipo.
    
    - Verifica que el equipo pertenece al usuario
    - Elimina el Pokémon del equipo
    
    Requiere autenticación.
    """
    
    # Verificar que el equipo pertenece al usuario
    team = crud.get_team_by_id(db, team_id=team_id, user_id=current_user.id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )
    
    # Buscar el miembro específico
    db_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.pokemon_id == pokemon_id
    ).first()

    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El Pokémon no está en este equipo"
        )

    db.delete(db_member)
    db.commit()
    
    return None