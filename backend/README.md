# Backend API - Invitaciones Digitales

API REST construida con FastAPI para gestionar invitaciones digitales.

## Características

- ✅ Autenticación JWT para el panel administrativo
- ✅ Sistema de UUIDs para mayor seguridad en las invitaciones
- ✅ Base de datos MySQL con SQLAlchemy
- ✅ Endpoints públicos y privados
- ✅ Gestión completa de invitados y eventos

## Instalación

1. Instalar dependencias:
```bash
pip install -r requirements.txt
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```
DATABASE_URL=mysql+pymysql://usuario:contraseña@localhost:3306/nombre_base_datos
SECRET_KEY=tu_clave_secreta_muy_segura_aqui
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SECRET_CODE=FM2026-ADMIN
```

3. Crear la base de datos en MySQL:
```sql
CREATE DATABASE nombre_base_datos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Inicializar la base de datos:
```bash
python init_db.py
```

5. Ejecutar el servidor:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

### Públicos

- `GET /api/invitado/{uuid}` - Obtener invitado por UUID
- `GET /api/invitado-codigo/{codigo}` - Obtener invitado por código legible
- `GET /api/evento` - Obtener información del evento
- `GET /api/datos-completos/{uuid}` - Obtener todos los datos del evento
- `POST /api/invitado/{uuid}/rsvp` - Confirmar o rechazar asistencia

### Autenticación

- `POST /api/auth/login` - Iniciar sesión (requiere username, password, secret_code)

### Administrativos (requieren autenticación)

- `GET /api/admin/invitados` - Listar todos los invitados
- `POST /api/admin/invitados` - Crear nuevo invitado
- `PUT /api/admin/invitados/{id}` - Actualizar invitado
- `DELETE /api/admin/invitados/{id}` - Eliminar invitado
- `GET /api/admin/estadisticas` - Obtener estadísticas
- `GET /api/admin/evento` - Obtener información del evento
- `PUT /api/admin/evento` - Actualizar información del evento

## Seguridad

- Las invitaciones usan UUIDs únicos en lugar de códigos simples
- El panel administrativo requiere autenticación JWT
- Se requiere un código secreto adicional para acceder al admin
- Las contraseñas se almacenan con hash bcrypt

## Estructura de Base de Datos

- `invitados` - Información de los invitados
- `evento` - Información general del evento
- `ceremonia` - Detalles de la ceremonia
- `recepcion` - Detalles de la recepción
- `padres` - Información de los padres
- `admin_users` - Usuarios administrativos

