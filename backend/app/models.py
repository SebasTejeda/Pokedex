from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Relación: Un usuario puede tener muchos equipos
    teams = relationship("Team", back_populates="owner")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    strategy_notes = Column(String, nullable=True) # Notas opcionales
    user_id = Column(Integer, ForeignKey("users.id")) # Clave foránea al usuario

    # Relaciones
    owner = relationship("User", back_populates="teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    
    # ¡Aquí está la magia de la integración!
    # No guardamos todo el JSON del Pokémon, solo su ID oficial de la PokeAPI
    pokemon_id = Column(Integer, nullable=False) 
    
    custom_nickname = Column(String, nullable=True) # Por si quieren ponerle un mote
    held_item = Column(String, nullable=True) # Objeto equipado (opcional)

    # Relación
    team = relationship("Team", back_populates="members")