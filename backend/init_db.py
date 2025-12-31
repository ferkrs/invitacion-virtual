"""
Script para inicializar la base de datos con el usuario administrador
Ejecutar: python init_db.py
"""
from database import SessionLocal, engine
from models import Base, AdminUser, Invitado, EstadoInvitado
from auth import get_password_hash
from config import settings
from sqlalchemy import inspect
import uuid

# Eliminar todas las tablas existentes y recrearlas con la estructura actualizada
# Esto asegura que todas las columnas nuevas estén presentes
print("🔄 Recreando tablas con la estructura actualizada...")
Base.metadata.drop_all(bind=engine)
print("✓ Tablas eliminadas")
Base.metadata.create_all(bind=engine)
print("✓ Tablas recreadas con todas las columnas (incluyendo adultos y niños)")

db = SessionLocal()

try:
    # Crear usuario admin si no existe
    admin = db.query(AdminUser).filter(AdminUser.username == settings.ADMIN_USERNAME).first()
    if not admin:
        admin = AdminUser(
            username=settings.ADMIN_USERNAME,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            is_active=1
        )
        db.add(admin)
        print(f"✓ Usuario admin creado: {settings.ADMIN_USERNAME}")
    else:
        print(f"✓ Usuario admin ya existe: {settings.ADMIN_USERNAME}")
    
    # Crear invitados de ejemplo si no existen
    invitados_existentes = db.query(Invitado).count()
    if invitados_existentes == 0:
        invitados_ejemplo = [
            {
                "codigo": "FM2026-001",
                "nombres": "Ronald Fuentes y Deisy Miranda",
                "max_adultos": 2,
                "max_ninos": 0
            },
            {
                "codigo": "FM2026-002",
                "nombres": "Juan Pérez y María García",
                "max_adultos": 2,
                "max_ninos": 1
            },
            {
                "codigo": "FM2026-003",
                "nombres": "Carlos Rodríguez",
                "max_adultos": 1,
                "max_ninos": 0
            }
        ]
        
        for inv_data in invitados_ejemplo:
            invitado = Invitado(
                uuid=str(uuid.uuid4()),
                codigo=inv_data["codigo"],
                nombres=inv_data["nombres"],
                max_adultos=inv_data["max_adultos"],
                max_ninos=inv_data["max_ninos"],
                cantidad_adultos=inv_data["max_adultos"],
                cantidad_ninos=inv_data["max_ninos"],
                estado=EstadoInvitado.PENDIENTE
            )
            db.add(invitado)
        
        print(f"✓ {len(invitados_ejemplo)} invitados de ejemplo creados")
    else:
        print(f"✓ Ya existen {invitados_existentes} invitados en la base de datos")
    
    db.commit()
    print("\n✅ Base de datos inicializada correctamente!")
    
except Exception as e:
    db.rollback()
    print(f"❌ Error al inicializar la base de datos: {e}")
    raise
finally:
    db.close()
