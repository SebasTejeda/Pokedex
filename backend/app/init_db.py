# app/init_db.py
from app.database import engine
from app import models

def init_database():
    """
    Crea todas las tablas en la base de datos.
    Ejecuta este script la primera vez o después de cambios en los modelos.
    """
    print("🔄 Creando tablas en la base de datos...")
    models.Base.metadata.create_all(bind=engine)
    print("✅ ¡Tablas creadas exitosamente!")
    print("\nTablas creadas:")
    print("  - users")
    print("  - teams")
    print("  - team_members")

if __name__ == "__main__":
    init_database()