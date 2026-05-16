# app/seed_db.py
from app.database import SessionLocal
from app import models

def seed_initial_user():
    """Crea un usuario de prueba"""
    db = SessionLocal()
    
    # Verificar si ya existe
    existing_user = db.query(models.User).filter(models.User.email == "demo@pokeapp.com").first()
    if existing_user:
        print("⚠️ El usuario de prueba ya existe")
        db.close()
        return
    
    # Crear usuario de prueba
    demo_user = models.User(
        username="demo",
        email="demo@pokeapp.com",
        hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIoC1LjXRy"  # "password123"
    )
    
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
    
    # Crear un equipo por defecto
    default_team = models.Team(
        name="Mi Primer Equipo",
        strategy_notes="¡Equipo de prueba!",
        user_id=demo_user.id
    )
    
    db.add(default_team)
    db.commit()
    
    print(f"✅ Usuario creado: {demo_user.username} (ID: {demo_user.id})")
    print(f"✅ Equipo creado: {default_team.name} (ID: {default_team.id})")
    print(f"📧 Email: demo@pokeapp.com")
    print(f"🔑 Password: password123")
    
    db.close()

if __name__ == "__main__":
    seed_initial_user()