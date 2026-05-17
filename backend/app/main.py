from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

# Importamos nuestros módulos locales
from app import crud, models, schemas
from app.database import SessionLocal, engine

load_dotenv()  # Carga variables de entorno desde .env

# Esto crea las tablas en la base de datos si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PokeAPI Team Builder")

cors_origins = os.getenv("CORS_ORIGINS", 'http://localhost:4200').split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ==========================================
# INYECCIÓN DE DEPENDENCIAS
# ==========================================
def get_db():
    """
    Esta función crea una conexión temporal a la base de datos para cada petición web.
    Cuando la petición termina, cierra la conexión (finally) para no saturar la BD.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"mensaje": "¡Bienvenido al backend de tu Team Builder!"}

# ==========================================
# RUTAS (ENDPOINTS)
# ==========================================

@app.post("/teams/", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, user_id: int = 1, db: Session = Depends(get_db)):
    """
    Crea un equipo nuevo. 
    Nota: Usamos user_id=1 temporalmente simulando un usuario logueado.
    """
    return crud.create_team(db=db, team=team, user_id=user_id)


@app.get("/teams/", response_model=list[schemas.Team])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Devuelve la lista de todos los equipos guardados, incluyendo sus Pokémon.
    """
    teams = crud.get_teams(db, skip=skip, limit=limit)
    return teams


@app.post("/teams/{team_id}/members/", response_model=schemas.TeamMember)
def create_team_member(team_id: int, member: schemas.TeamMemberCreate, db: Session = Depends(get_db)):
    """
    Añade un nuevo Pokémon (mediante su ID de PokeAPI) a un equipo específico.
    """
    return crud.create_team_member(db=db, member=member, team_id=team_id)

@app.delete("/teams/{team_id}/members/{pokemon_id}")
def remove_pokemon_from_team(team_id: int, pokemon_id: int, db: Session = Depends(get_db)):
    # Buscamos el registro específico en la tabla intermedia
    db_member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.pokemon_id == pokemon_id
    ).first()

    if not db_member:
        raise HTTPException(status_code=404, detail="El Pokémon no está en este equipo")

    db.delete(db_member)
    db.commit()
    return {"message": "Pokémon eliminado con éxito"}

# Asegúrate de tener importado schemas y crud

@app.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db=db, user=user)
