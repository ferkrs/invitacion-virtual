from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from models import EstadoInvitado


# Schemas para Invitados
class InvitadoBase(BaseModel):
    nombres: str
    max_personas: int
    codigo: Optional[str] = None


class InvitadoCreate(InvitadoBase):
    pass


class InvitadoUpdate(BaseModel):
    nombres: Optional[str] = None
    max_personas: Optional[int] = None


class InvitadoResponse(InvitadoBase):
    id: int
    uuid: str
    codigo: str
    cantidad_personas: int
    estado: str
    confirmacion: Optional[str] = None
    fecha_confirmacion: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class InvitadoRSVP(BaseModel):
    confirmacion: str  # "si" o "no"


# Schemas para Evento
class CeremoniaBase(BaseModel):
    lugar: str
    hora: str
    nota: Optional[str] = None


class RecepcionBase(BaseModel):
    lugar: str
    hora: str
    nota: Optional[str] = None
    direccion: Optional[str] = None


class PadresBase(BaseModel):
    padre_novio: str
    madre_novio: str
    padre_novia: str
    madre_novia: str


class EventoBase(BaseModel):
    nombres_novios: str
    fecha: str
    dia_semana: str
    fecha_limite_rsvp: str
    dress_code: str


class EventoCreate(EventoBase):
    ceremonia: CeremoniaBase
    recepcion: RecepcionBase
    padres: PadresBase


class EventoResponse(EventoBase):
    id: int
    ceremonia: CeremoniaBase
    recepcion: RecepcionBase
    padres: PadresBase
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Schema completo de datos del evento (como el JSON original)
class DatosEventoCompleto(BaseModel):
    evento: EventoResponse
    invitados: list[InvitadoResponse]
    padres: PadresBase


# Schemas para Autenticación
class AdminLogin(BaseModel):
    username: str
    password: str
    secret_code: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None

