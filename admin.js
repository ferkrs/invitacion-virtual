// Variables globales
let datosEvento = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosEvento();
    inicializarEventListeners();
});

// Cargar datos del evento
async function cargarDatosEvento() {
    try {
        const response = await fetch('invitados.json');
        datosEvento = await response.json();
        renderizarTabla();
        actualizarEstadisticas();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los datos',
            confirmButtonText: 'Reintentar',
            confirmButtonColor: '#d4a574'
        });
    }
}

// Inicializar event listeners
function inicializarEventListeners() {
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

// Generar código único
function generarCodigoUnico() {
    const ultimoCodigo = datosEvento.invitados
        .map(inv => {
            const num = parseInt(inv.codigo.split('-')[1]);
            return isNaN(num) ? 0 : num;
        })
        .reduce((max, num) => Math.max(max, num), 0);
    
    const nuevoNumero = ultimoCodigo + 1;
    return `FM2026-${String(nuevoNumero).padStart(3, '0')}`;
}

// Agregar nuevo invitado
async function agregarInvitado(e) {
    e.preventDefault();

    const nombres = document.getElementById('nombresNuevo').value.trim();
    const maxPersonas = parseInt(document.getElementById('maxPersonasNuevo').value);
    let codigo = document.getElementById('codigoNuevo').value.trim().toUpperCase();

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

    // Verificar si el código ya existe
    if (codigo) {
        const existe = datosEvento.invitados.find(inv => inv.codigo === codigo);
        if (existe) {
            Swal.fire({
                icon: 'error',
                title: 'Código duplicado',
                text: 'Este código ya existe. Por favor usa otro o deja el campo vacío para generar uno automático.',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#d4a574'
            });
            return;
        }
    } else {
        codigo = generarCodigoUnico();
    }

    // Crear nuevo invitado
    const nuevoInvitado = {
        codigo: codigo,
        nombres: nombres,
        cantidadPersonas: maxPersonas,
        maxPersonas: maxPersonas,
        estado: 'pendiente',
        confirmacion: '',
        fechaConfirmacion: null
    };

    datosEvento.invitados.push(nuevoInvitado);
    
    // Guardar cambios (en producción, esto se enviaría al servidor)
    await guardarCambios();

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
        text: `El invitado ha sido agregado con el código: ${codigo}`,
        confirmButtonText: 'Perfecto',
        confirmButtonColor: '#d4a574',
        timer: 2000,
        timerProgressBar: true
    });

    // Actualizar tabla y estadísticas
    renderizarTabla();
    actualizarEstadisticas();
}

// Editar invitado
async function editarInvitado(e) {
    e.preventDefault();

    const codigo = document.getElementById('codigoEditar').value;
    const nombres = document.getElementById('nombresEditar').value.trim();
    const maxPersonas = parseInt(document.getElementById('maxPersonasEditar').value);

    const invitado = datosEvento.invitados.find(inv => inv.codigo === codigo);
    
    if (invitado) {
        invitado.nombres = nombres;
        invitado.maxPersonas = maxPersonas;
        
        // Si aún no ha confirmado, actualizar cantidadPersonas también
        if (invitado.estado === 'pendiente') {
            invitado.cantidadPersonas = maxPersonas;
        }

        await guardarCambios();

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

        renderizarTabla();
        actualizarEstadisticas();
    }
}

// Eliminar invitado
async function eliminarInvitado(codigo) {
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
        datosEvento.invitados = datosEvento.invitados.filter(inv => inv.codigo !== codigo);
        await guardarCambios();

        Swal.fire({
            icon: 'success',
            title: '¡Eliminado!',
            text: 'El invitado ha sido eliminado',
            confirmButtonText: 'Perfecto',
            confirmButtonColor: '#d4a574',
            timer: 2000,
            timerProgressBar: true
        });

        renderizarTabla();
        actualizarEstadisticas();
    }
}

// Abrir modal editar
function abrirModalEditar(codigo) {
    const invitado = datosEvento.invitados.find(inv => inv.codigo === codigo);
    
    if (invitado) {
        document.getElementById('codigoEditar').value = invitado.codigo;
        document.getElementById('nombresEditar').value = invitado.nombres;
        document.getElementById('maxPersonasEditar').value = invitado.maxPersonas;
        
        const modal = new bootstrap.Modal(document.getElementById('modalEditarInvitado'));
        modal.show();
    }
}

// Copiar link al portapapeles
async function copiarLink(codigo) {
    const url = `${window.location.origin}${window.location.pathname.replace('admin.html', 'index.html')}?codigo=${codigo}`;
    
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

// Generar link
function generarLink(codigo) {
    return `${window.location.origin}${window.location.pathname.replace('admin.html', 'index.html')}?codigo=${codigo}`;
}

// Renderizar tabla
function renderizarTabla() {
    if (!datosEvento) return;

    const tbody = document.getElementById('tablaInvitados');
    tbody.innerHTML = '';

    datosEvento.invitados.forEach(invitado => {
        const tr = document.createElement('tr');
        tr.className = 'invitado-row';

        const estadoBadge = getEstadoBadge(invitado.estado);
        const link = generarLink(invitado.codigo);

        tr.innerHTML = `
            <td><strong>${invitado.codigo}</strong></td>
            <td>${invitado.nombres}</td>
            <td>${invitado.maxPersonas}</td>
            <td>${estadoBadge}</td>
            <td>${invitado.confirmacion || '-'}</td>
            <td>
                <span class="link-copy" onclick="copiarLink('${invitado.codigo}')" title="Haz click para copiar">
                    <i class="bi bi-link-45deg"></i> Copiar Link
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="abrirModalEditar('${invitado.codigo}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarInvitado('${invitado.codigo}')">
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
function actualizarEstadisticas() {
    if (!datosEvento) return;

    const total = datosEvento.invitados.length;
    const confirmados = datosEvento.invitados.filter(inv => inv.estado === 'confirmado').length;
    const pendientes = datosEvento.invitados.filter(inv => inv.estado === 'pendiente').length;

    document.getElementById('totalInvitados').textContent = total;
    document.getElementById('confirmados').textContent = confirmados;
    document.getElementById('pendientes').textContent = pendientes;
}

// Guardar cambios (simulado - en producción se enviaría al servidor)
async function guardarCambios() {
    // En producción, aquí harías una petición PUT/POST al servidor
    // Por ahora, solo guardamos en localStorage como respaldo
    try {
        localStorage.setItem('invitados_backup', JSON.stringify(datosEvento));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
    
    // Nota: Para una implementación real, descomentar esto:
    // await fetch('/api/invitados', {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(datosEvento)
    // });
}

