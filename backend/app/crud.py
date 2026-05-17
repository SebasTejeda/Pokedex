from sqlalchemy.orm import Session
from app import models, schemas

# ==========================================
# OPERACIONES PARA LOS EQUIPOS (TEAMS)
# ==========================================


def get_teams(db: Session, skip: int = 0, limit: int = 100):
    """Obtiene una lista de equipos desde la base de datos."""
    return db.query(models.Team).offset(skip).limit(limit).all()


def create_team(db: Session, team: schemas.TeamCreate, user_id: int):
    """Crea un nuevo equipo en la base de datos."""
    # 1. Convertimos el esquema de Pydantic al modelo de SQLAlchemy
    db_team = models.Team(
        name=team.name,
        strategy_notes=team.strategy_notes,
        user_id=user_id
    )

    # 2. Preparamos el objeto para guardarlo
    db.add(db_team)

    # 3. Confirmamos los cambios en la base de datos (como el 'guardar' de un archivo)
    db.commit()

    # 4. Refrescamos el objeto para obtener el ID que la base de datos le asignó automáticamente
    db.refresh(db_team)

    return db_team

# ==========================================
# OPERACIONES PARA LOS POKÉMON DEL EQUIPO
# ==========================================


def create_team_member(db: Session, member: schemas.TeamMemberCreate, team_id: int):
    """Añade un Pokémon específico a un equipo existente."""

    # Primero, opcionalmente podrías validar si el equipo ya tiene 6 miembros
    # current_members = db.query(models.TeamMember).filter(models.TeamMember.team_id == team_id).count()
    # if current_members >= 6:
    #     raise ValueError("El equipo ya está lleno")

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

# Asegúrate de tener: import models, schemas
# (y de importar Session de sqlalchemy.orm si no lo tienes)

def create_user(db: Session, user: schemas.UserCreate):
    # Nota: Para destrabar el proyecto rápido, guardaremos la contraseña tal cual.
    # En un sistema con login real, aquí usarías una librería como 'passlib' para encriptarla.
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=user.password 
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
