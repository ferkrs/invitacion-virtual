from sqlalchemy import Column, String, Integer, DateTime, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from database import Base
import enum
import uuid


class EstadoInvitado(str, enum.Enum):
    PENDIENTE = "pendiente"
    CONFIRMADO = "confirmado"
    RECHAZADO = "rechazado"


class Invitado(Base):
    __tablename__ = "invitados"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    codigo = Column(String(50), unique=True, index=True)  # Código legible para mostrar
    nombres = Column(String(255), nullable=False)
    cantidad_personas = Column(Integer, default=0)
    max_personas = Column(Integer, nullable=False)
    max_adultos = Column(Integer, nullable=False, default=0)
    max_ninos = Column(Integer, nullable=False, default=0)
    cantidad_adultos = Column(Integer, default=0)
    cantidad_ninos = Column(Integer, default=0)
    estado = Column(SQLEnum(EstadoInvitado), default=EstadoInvitado.PENDIENTE)
    confirmacion = Column(Text, nullable=True)
    fecha_confirmacion = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())
