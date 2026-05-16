# app/init_db.py
from app.database import engine
from app import models

def init_database():
    """Crea todas las tablas en PostgreSQL"""
    print("🔄 Creando tablas en PostgreSQL...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ ¡Tablas creadas exitosamente!")

if __name__ == "__main__":
    init_database()