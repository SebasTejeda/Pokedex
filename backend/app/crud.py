# app/crud.py
from sqlalchemy.orm import Session
from app import models, schemas
from app.auth import get_password_hash

# ==========================================
# 👤 OPERACIONES DE USUARIOS
# ==========================================

def get_user_by_email(db: Session, email: str):
    """Busca un usuario por email"""
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    """Busca un usuario por username"""
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    """Crea un nuevo usuario con contraseña hasheada"""
    hashed_password = get_password_hash(user.password)
    
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

# ==========================================
# 📦 OPERACIONES PARA LOS EQUIPOS
# ==========================================

def get_teams(db: Session, skip: int = 0, limit: int = 100):
    """Obtiene una lista de equipos desde la base de datos."""
    return db.query(models.Team).offset(skip).limit(limit).all()

def get_user_teams(db: Session, user_id: int):
    """Obtiene todos los equipos de un usuario específico"""
    return db.query(models.Team).filter(models.Team.user_id == user_id).all()

def get_team_by_id(db: Session, team_id: int, user_id: int):
    """Obtiene un equipo específico verificando que pertenezca al usuario"""
    return db.query(models.Team).filter(
        models.Team.id == team_id,
        models.Team.user_id == user_id
    ).first()

def create_team(db: Session, team: schemas.TeamCreate, user_id: int):
    """Crea un nuevo equipo en la base de datos."""
    db_team = models.Team(
        name=team.name,
        strategy_notes=team.strategy_notes,
        user_id=user_id
    )

    db.add(db_team)
    db.commit()
    db.refresh(db_team)

    return db_team

def update_team(db: Session, team_id: int, team_update: schemas.TeamUpdate, user_id: int):
    """Actualiza un equipo existente"""
    db_team = get_team_by_id(db, team_id, user_id)
    if not db_team:
        return None
    
    if team_update.name is not None:
        db_team.name = team_update.name
    if team_update.strategy_notes is not None:
        db_team.strategy_notes = team_update.strategy_notes
    
    db.commit()
    db.refresh(db_team)
    return db_team

def delete_team(db: Session, team_id: int, user_id: int):
    """Elimina un equipo"""
    db_team = get_team_by_id(db, team_id, user_id)
    if not db_team:
        return False
    
    db.delete(db_team)
    db.commit()
    return True

# ==========================================
# 🎮 OPERACIONES PARA LOS POKÉMON DEL EQUIPO
# ==========================================

def create_team_member(db: Session, member: schemas.TeamMemberCreate, team_id: int):
    """Añade un Pokémon específico a un equipo existente."""
    
    # Validar que el equipo no tenga más de 6 miembros
    current_members = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id
    ).count()
    
    if current_members >= 6:
        return None  # El controlador manejará el error
    
    db_member = models.TeamMember(
        team_id=team_id,
        pokemon_id=member.pokemon_id,
        custom_nickname=member.custom_nickname,
        held_item=member.held_item
    )

    db.add(db_member)
    db.commit()
    db.refresh(db_member)

    return db_member