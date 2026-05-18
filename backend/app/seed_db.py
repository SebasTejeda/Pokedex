# app/seed_db.py
from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

def seed_demo_user():
    """Crea un usuario de prueba para testing"""
    db = SessionLocal()
    
    # Verificar si ya existe
    existing_user = db.query(models.User).filter(
        models.User.email == "demo@pokeapp.com"
    ).first()
    
    if existing_user:
        print("⚠️  El usuario demo ya existe")
        print(f"📧 Email: demo@pokeapp.com")
        print(f"🔑 Password: demo123")
        db.close()
        return
    
    # Crear usuario de prueba
    demo_user = models.User(
        username="demo",
        email="demo@pokeapp.com",
        hashed_password=get_password_hash("demo123")
    )
    
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
    
    # Crear equipo por defecto
    default_team = models.Team(
        name="Equipo de Prueba",
        strategy_notes="Este es un equipo de demostración",
        user_id=demo_user.id
    )
    
    db.add(default_team)
    db.commit()
    
    print("✅ Usuario de prueba creado exitosamente!")
    print(f"👤 Username: {demo_user.username}")
    print(f"📧 Email: demo@pokeapp.com")
    print(f"🔑 Password: demo123")
    print(f"🎮 Equipo creado: {default_team.name}")
    
    db.close()

if __name__ == "__main__":
    seed_demo_user()