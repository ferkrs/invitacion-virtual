from pydantic import BaseModel, EmailStr, computed_field
from typing import Optional
from datetime import datetime
from models import EstadoInvitado


# Schemas para Invitados
class InvitadoBase(BaseModel):
    nombres: str
    max_adultos: int
    max_ninos: int = 0
    codigo: Optional[str] = None


class InvitadoCreate(InvitadoBase):
    pass


class InvitadoUpdate(BaseModel):
    nombres: Optional[str] = None
    max_adultos: Optional[int] = None
    max_ninos: Optional[int] = None
    estado: Optional[str] = None


class InvitadoResponse(InvitadoBase):
    id: int
    uuid: str
    codigo: str
    cantidad_adultos: int
    cantidad_ninos: int
    estado: str
    confirmacion: Optional[str] = None
    fecha_confirmacion: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Campos calculados (se calculan automáticamente desde adultos y niños)
    @computed_field
    def max_personas(self) -> int:
        return self.max_adultos + self.max_ninos
    
    @computed_field
    def cantidad_personas(self) -> int:
        return self.cantidad_adultos + self.cantidad_ninos
    
    class Config:
        from_attributes = True


class InvitadoRSVP(BaseModel):
    confirmacion: str  # "si" o "no"
    cantidad_adultos: Optional[int] = None
    cantidad_ninos: Optional[int] = None


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

