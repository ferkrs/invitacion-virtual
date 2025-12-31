from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import uuid
import os
import json

from database import engine, get_db, Base
from models import Invitado, AdminUser, EstadoInvitado
from schemas import (
    InvitadoCreate, InvitadoUpdate, InvitadoResponse, InvitadoRSVP,
    AdminLogin, Token
)
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user
)
from config import settings

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Invitaciones Digitales", version="1.0.0")

# Obtener rutas base
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
EVENTO_JSON_PATH = os.path.join(BASE_DIR, "evento.json")

# Funciones para manejar el JSON del evento
def load_evento_data():
    if not os.path.exists(EVENTO_JSON_PATH):
        return {}
    with open(EVENTO_JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_evento_data(data):
    with open(EVENTO_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

# Montar archivos estáticos
app.mount("/front", StaticFiles(directory=os.path.join(PROJECT_ROOT, "front")), name="front")
app.mount("/elementos", StaticFiles(directory=os.path.join(PROJECT_ROOT, "elementos")), name="elementos")

# Configurar templates
templates = Jinja2Templates(directory=os.path.join(PROJECT_ROOT, "front"))

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== RUTAS DE PÁGINAS ====================

@app.get("/", response_class=HTMLResponse)
async def serve_index(request: Request):
    """Sirve la página principal de la invitación"""
    # Obtener la URL base para los meta tags
    # Priorizar BASE_URL de configuración, luego usar request.base_url
    if settings.BASE_URL:
        base_url = settings.BASE_URL.rstrip('/')
    else:
        # Construir URL base desde los headers de la petición
        scheme = request.url.scheme
        # Verificar si hay un proxy que indique HTTPS
        if request.headers.get("x-forwarded-proto") == "https":
            scheme = "https"
        elif request.headers.get("x-forwarded-ssl") == "on":
            scheme = "https"
        
        host = request.headers.get("host") or request.url.netloc
        base_url = f"{scheme}://{host}"
    
    return templates.TemplateResponse("index.html", {
        "request": request,
        "base_url": base_url
    })


@app.get("/admin", response_class=HTMLResponse)
async def serve_admin(request: Request):
    """Sirve la página del panel administrativo"""
    return templates.TemplateResponse("admin.html", {"request": request})


# ==================== AUTENTICACIÓN ====================

@app.post("/api/auth/login", response_model=Token)
async def login(login_data: AdminLogin, db: Session = Depends(get_db)):
    """Login para el panel administrativo"""
    if login_data.secret_code != settings.ADMIN_SECRET_CODE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Código secreto incorrecto"
        )
    
    user = db.query(AdminUser).filter(AdminUser.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


# ==================== ENDPOINTS PÚBLICOS ====================

@app.get("/api/invitado/{uuid_invitado}", response_model=InvitadoResponse)
async def obtener_invitado_por_uuid(uuid_invitado: str, db: Session = Depends(get_db)):
    """Obtiene un invitado por su UUID (público)"""
    invitado = db.query(Invitado).filter(Invitado.uuid == uuid_invitado).first()
    if not invitado:
        raise HTTPException(status_code=404, detail="Invitado no encontrado")
    return invitado


@app.get("/api/invitado-codigo/{codigo}", response_model=InvitadoResponse)
async def obtener_invitado_por_codigo(codigo: str, db: Session = Depends(get_db)):
    """Obtiene un invitado por su código legible (público)"""
    invitado = db.query(Invitado).filter(Invitado.codigo == codigo.upper()).first()
    if not invitado:
        raise HTTPException(status_code=404, detail="Invitado no encontrado")
    return invitado


@app.get("/api/evento")
async def obtener_evento():
    """Obtiene la información del evento desde el JSON (público)"""
    return load_evento_data()


@app.get("/api/datos-completos/{uuid_invitado}")
async def obtener_datos_completos(uuid_invitado: str, db: Session = Depends(get_db)):
    """Obtiene todos los datos del evento y el invitado específico (público)"""
    invitado = db.query(Invitado).filter(Invitado.uuid == uuid_invitado).first()
    if not invitado:
        raise HTTPException(status_code=404, detail="Invitado no encontrado")
    
    evento_data = load_evento_data()
    
    # Retornar estructura compatible
    return {
        "evento": evento_data,
        "invitados": [invitado],
        "padres": evento_data.get("padres", {})
    }


@app.post("/api/invitado/{uuid_invitado}/rsvp", response_model=InvitadoResponse)
async def confirmar_rsvp(
    uuid_invitado: str,
    rsvp: InvitadoRSVP,
    db: Session = Depends(get_db)
):
    """Confirma o rechaza la asistencia (público)"""
    invitado = db.query(Invitado).filter(Invitado.uuid == uuid_invitado).first()
    if not invitado:
        raise HTTPException(status_code=404, detail="Invitado no encontrado")
    
    if rsvp.confirmacion == "si":
        invitado.estado = EstadoInvitado.CONFIRMADO
        invitado.confirmacion = "Si, asistiremos."
        
        # Manejar adultos y niños
        if rsvp.cantidad_adultos is not None:
            invitado.cantidad_adultos = min(rsvp.cantidad_adultos, invitado.max_adultos)
        else:
            invitado.cantidad_adultos = invitado.max_adultos
        
        if rsvp.cantidad_ninos is not None:
            invitado.cantidad_ninos = min(rsvp.cantidad_ninos, invitado.max_ninos)
        else:
            invitado.cantidad_ninos = invitado.max_ninos
        
        # cantidad_personas se calcula automáticamente como propiedad
    else:
        invitado.estado = EstadoInvitado.RECHAZADO
        invitado.confirmacion = "No podremos asistir"
        invitado.cantidad_adultos = 0
        invitado.cantidad_ninos = 0
    
    invitado.fecha_confirmacion = datetime.utcnow()
    
    db.commit()
    db.refresh(invitado)
    
    return invitado


# ==================== ENDPOINTS ADMINISTRATIVOS ====================

@app.get("/api/admin/invitados", response_model=List[InvitadoResponse])
async def listar_invitados(
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Lista todos los invitados (requiere autenticación)"""
    invitados = db.query(Invitado).all()
    return invitados


@app.post("/api/admin/invitados", response_model=InvitadoResponse)
async def crear_invitado(
    invitado: InvitadoCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Crea un nuevo invitado (requiere autenticación)"""
    if not invitado.codigo:
        ultimo_codigo = db.query(Invitado).order_by(Invitado.id.desc()).first()
        if ultimo_codigo:
            try:
                num = int(ultimo_codigo.codigo.split('-')[1])
                nuevo_num = num + 1
            except:
                nuevo_num = 1
        else:
            nuevo_num = 1
        codigo = f"FM2026-{str(nuevo_num).zfill(3)}"
    else:
        existe = db.query(Invitado).filter(Invitado.codigo == invitado.codigo).first()
        if existe:
            raise HTTPException(status_code=400, detail="El código ya existe")
        codigo = invitado.codigo
    
    # Obtener adultos y niños
    max_adultos = invitado.max_adultos
    max_ninos = invitado.max_ninos or 0
    
    nuevo_invitado = Invitado(
        uuid=str(uuid.uuid4()),
        codigo=codigo,
        nombres=invitado.nombres,
        max_adultos=max_adultos,
        max_ninos=max_ninos,
        cantidad_adultos=max_adultos,
        cantidad_ninos=max_ninos,
        estado=EstadoInvitado.PENDIENTE
    )
    
    db.add(nuevo_invitado)
    db.commit()
    db.refresh(nuevo_invitado)
    
    return nuevo_invitado


@app.put("/api/admin/invitados/{invitado_id}", response_model=InvitadoResponse)
async def actualizar_invitado(
    invitado_id: int,
    invitado: InvitadoUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Actualiza un invitado (requiere autenticación)"""
    db_invitado = db.query(Invitado).filter(Invitado.id == invitado_id).first()
    if not db_invitado:
        raise HTTPException(status_code=404, detail="Invitado no encontrado")
    
    if invitado.nombres is not None:
        db_invitado.nombres = invitado.nombres
    
    # Actualizar adultos y niños (max_personas se calcula automáticamente)
    if invitado.max_adultos is not None:
        db_invitado.max_adultos = invitado.max_adultos
        if db_invitado.estado == EstadoInvitado.PENDIENTE:
            db_invitado.cantidad_adultos = invitado.max_adultos
    
    if invitado.max_ninos is not None:
        db_invitado.max_ninos = invitado.max_ninos
        if db_invitado.estado == EstadoInvitado.PENDIENTE:
            db_invitado.cantidad_ninos = invitado.max_ninos
    
    # Si se actualizan adultos y niños, actualizar cantidades si está pendiente
    if (invitado.max_adultos is not None or invitado.max_ninos is not None) and db_invitado.estado == EstadoInvitado.PENDIENTE:
        db_invitado.cantidad_adultos = db_invitado.max_adultos
        db_invitado.cantidad_ninos = db_invitado.max_ninos
    if invitado.max_adultos is not None:
        db_invitado.max_adultos = invitado.max_adultos
        if db_invitado.estado == EstadoInvitado.PENDIENTE:
            db_invitado.cantidad_adultos = invitado.max_adultos
    if invitado.max_ninos is not None:
        db_invitado.max_ninos = invitado.max_ninos
        if db_invitado.estado == EstadoInvitado.PENDIENTE:
            db_invitado.cantidad_ninos = invitado.max_ninos
    
    # Permitir cambiar el estado
    if invitado.estado is not None:
        try:
            nuevo_estado = EstadoInvitado(invitado.estado)
            db_invitado.estado = nuevo_estado
            
            # Si se cambia a pendiente, resetear confirmación y cantidad
            if nuevo_estado == EstadoInvitado.PENDIENTE:
                db_invitado.confirmacion = None
                db_invitado.fecha_confirmacion = None
                db_invitado.cantidad_adultos = db_invitado.max_adultos
                db_invitado.cantidad_ninos = db_invitado.max_ninos
            # Si se cambia a confirmado, establecer valores por defecto
            elif nuevo_estado == EstadoInvitado.CONFIRMADO:
                if not db_invitado.confirmacion:
                    db_invitado.confirmacion = "Si, asistiremos."
                db_invitado.cantidad_adultos = db_invitado.max_adultos
                db_invitado.cantidad_ninos = db_invitado.max_ninos
                if not db_invitado.fecha_confirmacion:
                    db_invitado.fecha_confirmacion = datetime.utcnow()
            # Si se cambia a rechazado
            elif nuevo_estado == EstadoInvitado.RECHAZADO:
                if not db_invitado.confirmacion:
                    db_invitado.confirmacion = "No podremos asistir"
                db_invitado.cantidad_adultos = 0
                db_invitado.cantidad_ninos = 0
        except ValueError:
            raise HTTPException(status_code=400, detail="Estado inválido")
    
    db.commit()
    db.refresh(db_invitado)
    
    return db_invitado


@app.delete("/api/admin/invitados/{invitado_id}")
async def eliminar_invitado(
    invitado_id: int,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Elimina un invitado (requiere autenticación)"""
    db_invitado = db.query(Invitado).filter(Invitado.id == invitado_id).first()
    if not db_invitado:
        raise HTTPException(status_code=404, detail="Invitado no encontrado")
    
    db.delete(db_invitado)
    db.commit()
    
    return {"message": "Invitado eliminado correctamente"}


@app.get("/api/admin/estadisticas")
async def obtener_estadisticas(
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Obtiene estadísticas de invitados (requiere autenticación)"""
    total = db.query(Invitado).count()
    confirmados = db.query(Invitado).filter(Invitado.estado == EstadoInvitado.CONFIRMADO).count()
    pendientes = db.query(Invitado).filter(Invitado.estado == EstadoInvitado.PENDIENTE).count()
    rechazados = db.query(Invitado).filter(Invitado.estado == EstadoInvitado.RECHAZADO).count()
    
    # Calcular total de adultos y niños confirmados
    invitados_confirmados = db.query(Invitado).filter(Invitado.estado == EstadoInvitado.CONFIRMADO).all()
    total_adultos_confirmados = sum(inv.cantidad_adultos or 0 for inv in invitados_confirmados)
    total_ninos_confirmados = sum(inv.cantidad_ninos or 0 for inv in invitados_confirmados)
    
    return {
        "total": total,
        "confirmados": confirmados,
        "pendientes": pendientes,
        "rechazados": rechazados,
        "total_adultos_confirmados": total_adultos_confirmados,
        "total_ninos_confirmados": total_ninos_confirmados
    }


@app.get("/api/admin/evento")
async def obtener_evento_admin(
    current_user: AdminUser = Depends(get_current_user)
):
    """Obtiene la información del evento desde el JSON (requiere autenticación)"""
    return load_evento_data()


@app.put("/api/admin/evento")
async def actualizar_evento(
    evento_data: dict,
    current_user: AdminUser = Depends(get_current_user)
):
    """Actualiza la información del evento en el JSON (requiere autenticación)"""
    save_evento_data(evento_data)
    return evento_data


@app.get("/api/status")
async def api_status():
    """Endpoint de estado de la API"""
    return {"message": "API de Invitaciones Digitales activa", "version": "1.0.0"}
