// Variables globales
let token = null;
let invitados = [];
let dataTable = null; // Instancia de DataTables

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

        // Recargar datos primero para actualizar la tabla
        await cargarDatos();

        // Mostrar éxito después de actualizar
        Swal.fire({
            icon: 'success',
            title: '¡Invitado agregado!',
            text: `El invitado ha sido agregado con el código: ${nuevoInvitado.codigo}`,
            confirmButtonText: 'Perfecto',
            confirmButtonColor: '#d4a574',
            timer: 2000,
            timerProgressBar: true
        });
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
    const estado = document.getElementById('estadoEditar').value;

    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_INVITADOS}/${invitadoId}`,
            {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    nombres: nombres,
                    max_personas: maxPersonas,
                    estado: estado
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

        // Recargar datos primero para actualizar la tabla
        await cargarDatos();

        // Mostrar mensaje de éxito después de actualizar
        Swal.fire({
            icon: 'success',
            title: '¡Cambios guardados!',
            text: 'Los datos del invitado han sido actualizados',
            confirmButtonText: 'Perfecto',
            confirmButtonColor: '#d4a574',
            timer: 2000,
            timerProgressBar: true
        });
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

            // Recargar datos primero para actualizar la tabla
            await cargarDatos();

            // Mostrar éxito después de actualizar
            Swal.fire({
                icon: 'success',
                title: '¡Eliminado!',
                text: 'El invitado ha sido eliminado',
                confirmButtonText: 'Perfecto',
                confirmButtonColor: '#d4a574',
                timer: 2000,
                timerProgressBar: true
            });
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
        document.getElementById('estadoEditar').value = invitado.estado;
        
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
    if (!tbody) {
        console.error('No se encontró el elemento tablaInvitados');
        return;
    }

    if (!Array.isArray(invitados)) {
        console.error('La variable invitados no es un array:', invitados);
        return;
    }

    // Limpiar el contenido actual
    tbody.innerHTML = '';

    // Renderizar cada invitado
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
                <span class="link-copy" data-uuid="${invitado.uuid}" onclick="copiarLink('${invitado.uuid}')" title="Haz click para copiar">
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

    // Inicializar o actualizar DataTables
    const tabla = jQuery('#tablaInvitadosDT');
    
    if (!tabla.length) {
        console.warn('No se encontró la tabla con ID tablaInvitadosDT');
        return;
    }

    // Verificar si DataTables ya está inicializado y destruirlo
    if (jQuery.fn.DataTable.isDataTable('#tablaInvitadosDT')) {
        try {
            tabla.DataTable().destroy();
            dataTable = null;
        } catch (error) {
            console.error('Error al destruir DataTables:', error);
        }
    }

    // Verificar que jQuery y DataTables estén disponibles
    if (typeof jQuery !== 'undefined' && jQuery.fn.DataTable) {
        // Inicializar DataTables inmediatamente (sin delay)
        try {
            dataTable = tabla.DataTable({
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
                    search: 'Buscar:',
                    lengthMenu: 'Mostrar _MENU_ registros',
                    info: 'Mostrando _START_ a _END_ de _TOTAL_ invitados',
                    infoEmpty: 'Mostrando 0 a 0 de 0 invitados',
                    infoFiltered: '(filtrado de _MAX_ invitados totales)',
                    paginate: {
                        first: 'Primero',
                        last: 'Último',
                        next: 'Siguiente',
                        previous: 'Anterior'
                    },
                    emptyTable: 'No hay invitados registrados',
                    zeroRecords: 'No se encontraron invitados que coincidan con la búsqueda'
                },
                pageLength: 10,
                lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'Todos']],
                order: [[0, 'asc']], // Ordenar por código por defecto
                responsive: true,
                columnDefs: [
                    { orderable: true, targets: [0, 1, 2, 3] }, // Código, Nombre, Personas, Estado son ordenables
                    { orderable: false, targets: [4, 5, 6] } // Confirmación, Link, Acciones no son ordenables
                ],
                drawCallback: function() {
                    // Asegurar que los eventos onclick funcionen después de cada redibujado
                    jQuery('.link-copy').off('click').on('click', function() {
                        const uuid = jQuery(this).data('uuid');
                        if (uuid) {
                            copiarLink(uuid);
                        }
                    });
                }
            });
            console.log('DataTables inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar DataTables:', error);
        }
    } else {
        console.warn('DataTables no está disponible. Asegúrate de que jQuery y DataTables estén cargados.');
    }
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

// Cambiar estado de invitado
async function cambiarEstado(invitadoId, estadoActual) {
    // Determinar el siguiente estado o volver a pendiente
    let nuevoEstado;
    let mensaje;
    
    if (estadoActual === 'pendiente') {
        nuevoEstado = 'pendiente'; // Ya está pendiente, pero permitimos resetear
        mensaje = '¿Deseas mantener el estado como Pendiente? Esto reseteará cualquier confirmación previa.';
    } else if (estadoActual === 'confirmado') {
        nuevoEstado = 'pendiente';
        mensaje = '¿Deseas cambiar el estado a Pendiente? Esto reseteará la confirmación y permitirá que el invitado confirme nuevamente.';
    } else if (estadoActual === 'rechazado') {
        nuevoEstado = 'pendiente';
        mensaje = '¿Deseas cambiar el estado a Pendiente? Esto permitirá que el invitado confirme nuevamente.';
    } else {
        nuevoEstado = 'pendiente';
        mensaje = '¿Deseas cambiar el estado a Pendiente?';
    }
    
    const resultado = await Swal.fire({
        icon: 'question',
        title: 'Cambiar Estado',
        text: mensaje,
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#000000',
        cancelButtonColor: '#6c757d'
    });
    
    if (resultado.isConfirmed) {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_INVITADOS}/${invitadoId}`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        estado: nuevoEstado
                    })
                }
            );
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al cambiar el estado');
            }
            
            Swal.fire({
                icon: 'success',
                title: '¡Estado actualizado!',
                text: `El estado ha sido cambiado a ${nuevoEstado === 'pendiente' ? 'Pendiente' : nuevoEstado}`,
                confirmButtonText: 'Perfecto',
                confirmButtonColor: '#d4a574',
                timer: 2000,
                timerProgressBar: true
            });
            
            await cargarDatos();
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo cambiar el estado',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#d4a574'
            });
        }
    }
}

// Actualizar estadísticas
function actualizarEstadisticas(stats) {
    document.getElementById('totalInvitados').textContent = stats.total || 0;
    document.getElementById('confirmados').textContent = stats.confirmados || 0;
    document.getElementById('pendientes').textContent = stats.pendientes || 0;
}

