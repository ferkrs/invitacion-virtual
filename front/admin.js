// Variables globales
let token = null;
let invitados = [];

// Verificar si hay token guardado
function verificarAutenticacion() {
    token = localStorage.getItem('admin_token');
    if (token) {
        mostrarAdminContent();
        cargarDatos();
    } else {
        mostrarLogin();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacion();
    inicializarEventListeners();
});

// Inicializar event listeners
function inicializarEventListeners() {
    // Formulario de login
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', hacerLogin);
    }

    // Botón cerrar sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', cerrarSesion);
    }

    // Formulario agregar invitado
    const formAgregar = document.getElementById('formAgregarInvitado');
    if (formAgregar) {
        formAgregar.addEventListener('submit', agregarInvitado);
    }

    // Formulario editar invitado
    const formEditar = document.getElementById('formEditarInvitado');
    if (formEditar) {
        formEditar.addEventListener('submit', editarInvitado);
    }
}

// Mostrar modal de login
function mostrarLogin() {
    const modal = new bootstrap.Modal(document.getElementById('modalLogin'));
    modal.show();
    document.getElementById('adminContent').style.display = 'none';
}

// Ocultar login y mostrar contenido admin
function mostrarAdminContent() {
    document.getElementById('adminContent').style.display = 'block';
}

// Hacer login
async function hacerLogin(e) {
    e.preventDefault();

    const username = document.getElementById('usernameLogin').value.trim();
    const password = document.getElementById('passwordLogin').value;
    const secretCode = document.getElementById('secretCodeLogin').value.trim();

    if (!username || !password || !secretCode) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'Por favor completa todos los campos',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d4a574'
        });
        return;
    }

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_LOGIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                secret_code: secretCode
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al iniciar sesión');
        }

        const data = await response.json();
        token = data.access_token;
        localStorage.setItem('admin_token', token);

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalLogin'));
        if (modal) {
            modal.hide();
        }

        // Mostrar contenido admin
        mostrarAdminContent();

        // Cargar datos
        await cargarDatos();

        Swal.fire({
            icon: 'success',
            title: '¡Bienvenido!',
            text: 'Sesión iniciada correctamente',
            confirmButtonText: 'Perfecto',
            confirmButtonColor: '#d4a574',
            timer: 2000,
            timerProgressBar: true
        });
    } catch (error) {
        console.error('Error en login:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al iniciar sesión',
            text: error.message || 'Usuario, contraseña o código secreto incorrectos',
            confirmButtonText: 'Reintentar',
            confirmButtonColor: '#d4a574'
        });
    }
}

// Cerrar sesión
function cerrarSesion() {
    Swal.fire({
        icon: 'question',
        title: '¿Cerrar sesión?',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
    }).then((result) => {
        if (result.isConfirmed) {
            token = null;
            localStorage.removeItem('admin_token');
            mostrarLogin();
        }
    });
}

// Obtener headers con autenticación
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Cargar datos
async function cargarDatos() {
    try {
        // Mostrar cargando
        console.log('Cargando datos...');
        
        // Cargar invitados
        const responseInvitados = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_INVITADOS}`,
            {
                headers: getAuthHeaders()
            }
        );

        if (!responseInvitados.ok) {
            if (responseInvitados.status === 401) {
                cerrarSesion();
                return;
            }
            throw new Error('Error al cargar invitados');
        }

        invitados = await responseInvitados.json();

        // Cargar estadísticas
        const responseStats = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_ESTADISTICAS}`,
            {
                headers: getAuthHeaders()
            }
        );

        if (responseStats.ok) {
            const stats = await responseStats.json();
            actualizarEstadisticas(stats);
        }

        renderizarTabla();
        mostrarAdminContent(); // Asegurar que sea visible
    } catch (error) {
        console.error('Error al cargar datos:', error);
        // ... rest of error handling ...
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los datos',
            confirmButtonText: 'Reintentar',
            confirmButtonColor: '#d4a574'
        }).then(() => {
            if (error.message.includes('401')) {
                cerrarSesion();
            } else {
                cargarDatos();
            }
        });
    }
}

// Agregar nuevo invitado
async function agregarInvitado(e) {
    e.preventDefault();

    const nombres = document.getElementById('nombresNuevo').value.trim();
    const maxPersonas = parseInt(document.getElementById('maxPersonasNuevo').value);
    const codigo = document.getElementById('codigoNuevo').value.trim().toUpperCase();

    if (!nombres || !maxPersonas) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'Por favor completa todos los campos',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d4a574'
        });
        return;
    }

    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_INVITADOS}`,
            {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    nombres: nombres,
                    max_personas: maxPersonas,
                    codigo: codigo || null
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al agregar invitado');
        }

        const nuevoInvitado = await response.json();

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarInvitado'));
        if (modal) {
            modal.hide();
        }

        // Limpiar formulario
        document.getElementById('formAgregarInvitado').reset();

        // Mostrar éxito
        Swal.fire({
            icon: 'success',
            title: '¡Invitado agregado!',
            text: `El invitado ha sido agregado con el código: ${nuevoInvitado.codigo}`,
            confirmButtonText: 'Perfecto',
            confirmButtonColor: '#d4a574',
            timer: 2000,
            timerProgressBar: true
        });

        // Recargar datos
        await cargarDatos();
    } catch (error) {
        console.error('Error al agregar invitado:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo agregar el invitado',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d4a574'
        });
    }
}

// Editar invitado
async function editarInvitado(e) {
    e.preventDefault();

    const invitadoId = parseInt(document.getElementById('invitadoIdEditar').value);
    const nombres = document.getElementById('nombresEditar').value.trim();
    const maxPersonas = parseInt(document.getElementById('maxPersonasEditar').value);

    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_INVITADOS}/${invitadoId}`,
            {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    nombres: nombres,
                    max_personas: maxPersonas
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al actualizar invitado');
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarInvitado'));
        if (modal) {
            modal.hide();
        }

        Swal.fire({
            icon: 'success',
            title: '¡Cambios guardados!',
            text: 'Los datos del invitado han sido actualizados',
            confirmButtonText: 'Perfecto',
            confirmButtonColor: '#d4a574',
            timer: 2000,
            timerProgressBar: true
        });

        await cargarDatos();
    } catch (error) {
        console.error('Error al editar invitado:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudieron guardar los cambios',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d4a574'
        });
    }
}

// Eliminar invitado
async function eliminarInvitado(invitadoId) {
    const resultado = await Swal.fire({
        icon: 'warning',
        title: '¿Eliminar invitado?',
        text: 'Esta acción no se puede deshacer',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
    });

    if (resultado.isConfirmed) {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_INVITADOS}/${invitadoId}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al eliminar invitado');
            }

            Swal.fire({
                icon: 'success',
                title: '¡Eliminado!',
                text: 'El invitado ha sido eliminado',
                confirmButtonText: 'Perfecto',
                confirmButtonColor: '#d4a574',
                timer: 2000,
                timerProgressBar: true
            });

            await cargarDatos();
        } catch (error) {
            console.error('Error al eliminar invitado:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo eliminar el invitado',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#d4a574'
            });
        }
    }
}

// Abrir modal editar
function abrirModalEditar(invitadoId) {
    const invitado = invitados.find(inv => inv.id === invitadoId);
    
    if (invitado) {
        document.getElementById('invitadoIdEditar').value = invitado.id;
        document.getElementById('nombresEditar').value = invitado.nombres;
        document.getElementById('maxPersonasEditar').value = invitado.max_personas;
        
        const modal = new bootstrap.Modal(document.getElementById('modalEditarInvitado'));
        modal.show();
    }
}

// Copiar link al portapapeles
async function copiarLink(uuid) {
    const url = `${window.location.origin}/?uuid=${uuid}`;
    
    try {
        await navigator.clipboard.writeText(url);
        
        Swal.fire({
            icon: 'success',
            title: '¡Link copiado!',
            text: 'El link ha sido copiado al portapapeles',
            confirmButtonText: 'Perfecto',
            confirmButtonColor: '#d4a574',
            timer: 2000,
            timerProgressBar: true
        });
    } catch (error) {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        Swal.fire({
            icon: 'success',
            title: '¡Link copiado!',
            text: 'El link ha sido copiado al portapapeles',
            confirmButtonText: 'Perfecto',
            confirmButtonColor: '#d4a574',
            timer: 2000,
            timerProgressBar: true
        });
    }
}

// Renderizar tabla
function renderizarTabla() {
    const tbody = document.getElementById('tablaInvitados');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!Array.isArray(invitados)) {
        console.error('La variable invitados no es un array:', invitados);
        return;
    }

    invitados.forEach(invitado => {
        const tr = document.createElement('tr');
        tr.className = 'invitado-row';

        const estadoBadge = getEstadoBadge(invitado.estado);

        tr.innerHTML = `
            <td><strong>${invitado.codigo}</strong></td>
            <td>${invitado.nombres}</td>
            <td>${invitado.max_personas}</td>
            <td>${estadoBadge}</td>
            <td>${invitado.confirmacion || '-'}</td>
            <td>
                <span class="link-copy" onclick="copiarLink('${invitado.uuid}')" title="Haz click para copiar">
                    <i class="bi bi-link-45deg"></i> Copiar Link
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="abrirModalEditar(${invitado.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarInvitado(${invitado.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Obtener badge de estado
function getEstadoBadge(estado) {
    switch(estado) {
        case 'confirmado':
            return '<span class="badge badge-estado badge-confirmado">Confirmado</span>';
        case 'rechazado':
            return '<span class="badge badge-estado badge-rechazado">Rechazado</span>';
        default:
            return '<span class="badge badge-estado badge-pendiente">Pendiente</span>';
    }
}

// Actualizar estadísticas
function actualizarEstadisticas(stats) {
    document.getElementById('totalInvitados').textContent = stats.total || 0;
    document.getElementById('confirmados').textContent = stats.confirmados || 0;
    document.getElementById('pendientes').textContent = stats.pendientes || 0;
}

