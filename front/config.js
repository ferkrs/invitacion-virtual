// Configuración de la API
const API_CONFIG = {
    BASE_URL: '',  // Cambiado a vacío para usar la misma URL que sirve el front
    ENDPOINTS: {
        // Públicos
        INVITADO_UUID: '/api/invitado',
        INVITADO_CODIGO: '/api/invitado-codigo',
        EVENTO: '/api/evento',
        DATOS_COMPLETOS: '/api/datos-completos',
        RSVP: '/api/invitado',
        
        // Admin
        AUTH_LOGIN: '/api/auth/login',
        ADMIN_INVITADOS: '/api/admin/invitados',
        ADMIN_ESTADISTICAS: '/api/admin/estadisticas',
        ADMIN_EVENTO: '/api/admin/evento'
    }
};

