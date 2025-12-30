# Sistema de Invitaciones Digitales

Sistema completo para gestionar invitaciones digitales de boda con panel administrativo.

## Características

- ✅ Frontend con diseño elegante y responsivo
- ✅ Backend FastAPI con MySQL
- ✅ Autenticación JWT para el panel administrativo
- ✅ Sistema de UUIDs para mayor seguridad
- ✅ Gestión completa de invitados y confirmaciones
- ✅ Panel administrativo con estadísticas

## Estructura del Proyecto

```
.
├── backend/          # API FastAPI
│   ├── main.py      # Aplicación principal
│   ├── models.py    # Modelos de base de datos
│   ├── schemas.py   # Esquemas Pydantic
│   ├── auth.py      # Autenticación JWT
│   ├── database.py  # Configuración de BD
│   ├── config.py    # Configuración
│   └── init_db.py   # Script de inicialización
├── front/           # Frontend
│   ├── index.html   # Página de invitación
│   ├── admin.html   # Panel administrativo
│   ├── app.js       # Lógica de invitación
│   ├── admin.js     # Lógica de admin
│   ├── config.js    # Configuración de API
│   └── style.css    # Estilos
└── invitados.json   # Datos iniciales (legacy)
```

## Instalación y Configuración

### Backend

1. Navegar al directorio backend:
```bash
cd backend
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env`:
```
DATABASE_URL=mysql+pymysql://usuario:contraseña@localhost:3306/nombre_bd
SECRET_KEY=tu_clave_secreta_muy_segura
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SECRET_CODE=FM2026-ADMIN
```

4. Crear base de datos MySQL:
```sql
CREATE DATABASE nombre_bd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. Inicializar base de datos:
```bash
python init_db.py
```

6. Ejecutar servidor:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

1. Configurar URL de la API en `front/config.js`:
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',  // Cambiar en producción
    ...
};
```

2. Servir los archivos estáticos (puedes usar cualquier servidor web):
```bash
# Con Python
cd front
python -m http.server 8080

# O con Node.js
npx http-server front -p 8080
```

## Uso

### Panel Administrativo

1. Acceder a `admin.html`
2. Iniciar sesión con:
   - Usuario: `admin` (o el configurado en .env)
   - Contraseña: `admin123` (o la configurada en .env)
   - Código Secreto: `FM2026-ADMIN` (o el configurado en .env)

### Invitaciones

1. Los invitados pueden acceder con su código legible (ej: `FM2026-001`)
2. El sistema genera automáticamente un UUID único
3. La URL se actualiza con el UUID para mayor seguridad
4. Los invitados pueden confirmar o rechazar su asistencia

## Seguridad

- **UUIDs**: Cada invitación tiene un UUID único que reemplaza el código en la URL
- **Autenticación JWT**: El panel admin requiere token JWT
- **Código Secreto**: Se requiere un código adicional para acceder al admin
- **Contraseñas Hash**: Las contraseñas se almacenan con bcrypt

## API Endpoints

Ver `backend/README.md` para documentación completa de la API.

## Notas

- En producción, cambiar `SECRET_KEY` por una clave segura
- Configurar CORS apropiadamente en `main.py`
- Usar HTTPS en producción
- Cambiar las credenciales por defecto del admin

