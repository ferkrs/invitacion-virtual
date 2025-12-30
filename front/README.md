# Invitaciones Digitales - Fernando y Melissa

Sistema de invitaciones digitales para boda con gestión administrativa completa.

## Características

- ✨ **Diseño Elegante**: Interfaz minimalista y sofisticada con transiciones suaves
- 🔐 **Sistema de Códigos Únicos**: Cada invitado tiene un código único para seguridad
- 📱 **Responsive**: Diseño adaptable a todos los dispositivos
- 📊 **Panel Administrativo**: Gestión completa de invitados y generación de links
- ✅ **Confirmación RSVP**: Sistema de confirmación de asistencia integrado
- ⏱️ **Countdown**: Contador regresivo hasta la fecha del evento
- 🎨 **Bootstrap 5**: Framework moderno y profesional
- 🔔 **SweetAlert2**: Alertas elegantes y personalizadas

## Estructura del Proyecto

```
.
├── index.html          # Página principal de invitación
├── admin.html          # Panel administrativo
├── app.js             # Lógica principal de la aplicación
├── admin.js           # Lógica del panel administrativo
├── style.css          # Estilos personalizados
├── invitados.json     # Base de datos de invitados
└── elementos/         # Recursos visuales
    ├── flores.png     # Imágenes decorativas
    └── sobre.png      # Imagen del sobre
```

## Uso

### Para Invitados

1. Abre `index.html` en tu navegador
2. Haz click en el sobre o ingresa tu código único
3. Visualiza la invitación completa
4. Confirma tu asistencia usando el botón RSVP

### Para Administradores

1. Abre `admin.html` en tu navegador
2. Visualiza todas las invitaciones y estadísticas
3. Agrega nuevos invitados
4. Genera links únicos para cada invitado
5. Edita o elimina invitados según sea necesario

## Estructura de Datos JSON

El archivo `invitados.json` contiene:

```json
{
  "invitados": [
    {
      "codigo": "FM2026-001",
      "nombres": "Nombre del Invitado",
      "cantidadPersonas": 2,
      "maxPersonas": 2,
      "estado": "pendiente|confirmado|rechazado",
      "confirmacion": "",
      "fechaConfirmacion": null
    }
  ],
  "evento": { ... },
  "padres": { ... }
}
```

## Personalización

### Colores

Los colores se pueden personalizar en `style.css`:

```css
:root {
    --color-primary: #d4a574;
    --color-secondary: #a8c5d1;
    --color-text: #6c757d;
}
```

### Información del Evento

Edita `invitados.json` para cambiar:
- Nombres de los novios
- Fecha y hora del evento
- Ubicaciones (ceremonia y recepción)
- Dress code
- Información de los padres

## Notas Importantes

- Los espacios con marco gris son placeholders para fotografías que se agregarán después
- En un entorno de producción, reemplaza las funciones de guardado local por llamadas a una API backend
- Los códigos únicos se generan automáticamente si no se especifican al agregar un invitado

## Tecnologías Utilizadas

- HTML5
- CSS3 (con animaciones y transiciones)
- JavaScript (ES6+)
- Bootstrap 5.3.0
- SweetAlert2
- Bootstrap Icons
- Google Fonts (Dancing Script, Playfair Display, Lato)

## Licencia

Este proyecto es privado y está diseñado específicamente para el evento de Fernando y Melissa.

