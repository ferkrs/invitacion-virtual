// Variables globales
let datosEvento = null;
let invitadoActual = null;
let countdownInterval = null;
let uuidInvitado = null;

// Fecha objetivo para el countdown (17 Enero 2026)
const fechaEvento = new Date('2026-01-17T15:00:00');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarEventListeners();
    verificarUUIDURL();
    iniciarCountdown();
});

// Cargar datos del evento desde la API
async function cargarDatosEvento(uuid) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DATOS_COMPLETOS}/${uuid}`);
        if (!response.ok) {
            throw new Error('Error al cargar datos');
        }
        datosEvento = await response.json();
        
        // Buscar el invitado actual por UUID
        invitadoActual = datosEvento.invitados.find(inv => inv.uuid === uuid);
        
        if (!invitadoActual) {
            throw new Error('Invitado no encontrado');
        }
        
        return datosEvento;
    } catch (error) {
        console.error('Error al cargar datos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los datos del evento',
            confirmButtonText: 'Reintentar',
            confirmButtonColor: '#d4a574'
        }).then(() => {
            window.location.reload();
        });
        throw error;
    }
}

// Inicializar event listeners
function inicializarEventListeners() {
    // Click en el sobre
    const sobreImg = document.getElementById('sobreImg');
    if (sobreImg) {
        sobreImg.addEventListener('click', function() {
            mostrarInputCodigo();
        });
    }

    // Botón validar código
    const btnValidar = document.getElementById('btnValidar');
    if (btnValidar) {
        btnValidar.addEventListener('click', validarCodigo);
    }

    // Enter en input de código
    const codigoInput = document.getElementById('codigoInvitado');
    if (codigoInput) {
        codigoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                validarCodigo();
            }
        });
    }

    // Botón enviar RSVP
    const btnEnviarRSVP = document.getElementById('btnEnviarRSVP');
    if (btnEnviarRSVP) {
        btnEnviarRSVP.addEventListener('click', enviarRSVP);
    }
}

// Verificar si hay UUID en la URL
async function verificarUUIDURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const uuid = urlParams.get('uuid');
    
    if (uuid) {
        try {
            await cargarDatosEvento(uuid);
            uuidInvitado = uuid;
            mostrarNombreInvitado();
            setTimeout(() => {
                mostrarInvitacion();
            }, 4000);
        } catch (error) {
            console.error('Error al cargar invitado:', error);
        }
    }
}

// Mostrar input de código
function mostrarInputCodigo() {
    const codigoInput = document.getElementById('codigoInput');
    if (codigoInput) {
        codigoInput.style.display = 'block';
        codigoInput.classList.add('fade-in');
        document.getElementById('codigoInvitado').focus();
    }
}

// Validar código de invitado (busca por código y obtiene UUID)
async function validarCodigo() {
    const codigo = document.getElementById('codigoInvitado').value.trim().toUpperCase();
    
    if (!codigo) {
        Swal.fire({
            icon: 'warning',
            title: 'Código requerido',
            text: 'Por favor ingresa tu código único',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d4a574'
        });
        return;
    }

    try {
        // Buscar invitado por código usando el endpoint público
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVITADO_CODIGO}/${codigo}`);
        
        if (!response.ok) {
            throw new Error('Código no encontrado');
        }
        
        const invitadoEncontrado = await response.json();
        uuidInvitado = invitadoEncontrado.uuid;
        
        // Cargar datos completos con el UUID
        await cargarDatosEvento(uuidInvitado);
        
        // Actualizar URL con UUID
        const nuevaURL = `${window.location.pathname}?uuid=${uuidInvitado}`;
        window.history.replaceState({}, '', nuevaURL);
        
        mostrarNombreInvitado();
        setTimeout(() => {
            mostrarInvitacion();
        }, 4000);
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Código inválido',
            text: 'El código ingresado no es válido. Por favor verifica e intenta nuevamente.',
            confirmButtonText: 'Reintentar',
            confirmButtonColor: '#d4a574'
        });
    }
}

// Mostrar nombre del invitado
function mostrarNombreInvitado() {
    if (!invitadoActual) return;

    const nombreDiv = document.getElementById('nombreInvitado');
    const nombreTexto = document.getElementById('nombreInvitadoTexto');
    const cantidadTexto = document.getElementById('cantidadInvitadoTexto');

    nombreTexto.textContent = invitadoActual.nombres;
    const maxPersonas = invitadoActual.max_personas || invitadoActual.maxPersonas;
    cantidadTexto.textContent = `-${maxPersonas} ${maxPersonas === 1 ? 'Persona' : 'Personas'}-`;

    nombreDiv.classList.remove('d-none');
    nombreDiv.classList.add('fade-in');

    // Ocultar input de código
    document.getElementById('codigoInput').style.display = 'none';
    document.getElementById('sobreImg').style.display = 'none';

    // Ocultar texto de instrucción para abrir el sobre
    const textoSobre = document.getElementById('textoSobre');
    if (textoSobre) {
        textoSobre.style.display = 'none';
    }
}

// Mostrar invitación completa
function mostrarInvitacion() {
    if (!invitadoActual || !datosEvento) return;

    // Ocultar vista de validación
    const validacionView = document.getElementById('validacionView');
    const invitacionView = document.getElementById('invitacionView');

    validacionView.style.opacity = '0';
    validacionView.style.transition = 'opacity 0.5s ease-out';
    
    setTimeout(() => {
        validacionView.classList.add('d-none');
        invitacionView.classList.remove('d-none');
        invitacionView.style.opacity = '0';
        invitacionView.style.transition = 'opacity 0.5s ease-in';
        cargarDatosInvitacion();
        window.scrollTo(0, 0);
        
        // Fade in de la invitación
        setTimeout(() => {
            invitacionView.style.opacity = '1';
        }, 100);
    }, 500);
}

// Cargar datos en la invitación
function cargarDatosInvitacion() {
    if (!datosEvento || !invitadoActual) return;

    const evento = datosEvento.evento;
    const padres = datosEvento.padres;

    // Nombres de novios
    document.getElementById('nombresNoviosHeader').textContent = evento.nombres_novios;
    
    // Fecha
    document.getElementById('diaSemana').textContent = evento.dia_semana;
    document.getElementById('fechaEvento').textContent = evento.fecha;
    
    // Ceremonia
    document.getElementById('lugarCeremonia').textContent = evento.ceremonia.lugar;
    document.getElementById('horaCeremonia').textContent = `-${evento.ceremonia.hora}-`;
    document.getElementById('notaCeremonia').textContent = evento.ceremonia.nota || '';
    
    // Recepción
    document.getElementById('lugarRecepcion').textContent = evento.recepcion.lugar;
    document.getElementById('horaRecepcion').textContent = `-${evento.recepcion.hora}-`;
    document.getElementById('notaRecepcion').textContent = evento.recepcion.nota || '';
    document.getElementById('direccionRecepcion').textContent = evento.recepcion.direccion || '';
    
    // Dress Code
    document.getElementById('dressCode').textContent = evento.dress_code;
    
    // Fecha límite RSVP
    document.getElementById('fechaLimiteRSVP').textContent = evento.fecha_limite_rsvp;
    
    // Padres
    document.getElementById('padreNovio').textContent = padres.novio.padre;
    document.getElementById('madreNovio').textContent = padres.novio.madre;
    document.getElementById('padreNovia').textContent = padres.novia.padre;
    document.getElementById('madreNovia').textContent = padres.novia.madre;

    // Datos del modal RSVP
    actualizarModalRSVP();
}

// Actualizar modal RSVP
function actualizarModalRSVP() {
    if (!invitadoActual) return;

    const maxPersonas = invitadoActual.max_personas || invitadoActual.maxPersonas;
    document.getElementById('maxPersonasModal').textContent = `-${maxPersonas} ${maxPersonas === 1 ? 'Adulto' : 'Adultos'}-`;
    document.getElementById('nombresInvitadosModal').textContent = invitadoActual.nombres;
    document.getElementById('cantidadInvitadosModal').textContent = maxPersonas;
    
    // Si ya confirmó, mostrar estado
    const estado = invitadoActual.estado || invitadoActual.estado;
    if (estado !== 'pendiente') {
        const select = document.getElementById('confirmacionSelect');
        const confirmacion = invitadoActual.confirmacion || '';
        if (confirmacion.includes('Si')) {
            select.value = 'si';
        } else if (confirmacion.includes('No')) {
            select.value = 'no';
        }
        select.disabled = true;
    }
}

// Enviar RSVP
async function enviarRSVP() {
    if (!invitadoActual || !uuidInvitado) return;

    const confirmacion = document.getElementById('confirmacionSelect').value;

    if (!confirmacion) {
        Swal.fire({
            icon: 'warning',
            title: 'Selecciona una opción',
            text: 'Por favor selecciona si asistirás o no',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d4a574'
        });
        return;
    }

    try {
        // Enviar RSVP a la API
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RSVP}/${uuidInvitado}/rsvp`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ confirmacion: confirmacion })
            }
        );

        if (!response.ok) {
            throw new Error('Error al enviar confirmación');
        }

        const invitadoActualizado = await response.json();
        invitadoActual = invitadoActualizado;

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('rsvpModal'));
        if (modal) {
            modal.hide();
        }

        // Actualizar modal
        actualizarModalRSVP();

        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: '¡Confirmación enviada!',
            text: confirmacion === 'si' 
                ? 'Estamos muy felices de que puedas acompañarnos en este día especial.'
                : 'Lamentamos que no puedas acompañarnos, pero agradecemos tu respuesta.',
            confirmButtonText: 'Gracias',
            confirmButtonColor: '#d4a574',
            timer: 3000,
            timerProgressBar: true
        });
    } catch (error) {
        console.error('Error al enviar RSVP:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo enviar la confirmación. Por favor intenta nuevamente.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d4a574'
        });
    }
}

// Countdown
function iniciarCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(actualizarCountdown, 1000);
    actualizarCountdown();
}

function actualizarCountdown() {
    const ahora = new Date().getTime();
    const diferencia = fechaEvento.getTime() - ahora;

    if (diferencia < 0) {
        // Evento ya pasó
        document.getElementById('dias').textContent = '00';
        document.getElementById('horas').textContent = '00';
        document.getElementById('minutos').textContent = '00';
        document.getElementById('segundos').textContent = '00';
        clearInterval(countdownInterval);
        return;
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    document.getElementById('dias').textContent = String(dias).padStart(2, '0');
    document.getElementById('horas').textContent = String(horas).padStart(2, '0');
    document.getElementById('minutos').textContent = String(minutos).padStart(2, '0');
    document.getElementById('segundos').textContent = String(segundos).padStart(2, '0');
}

// Abrir Google Maps
function abrirGoogleMaps() {
    if (!datosEvento) return;
    const direccion = encodeURIComponent(datosEvento.evento.recepcion.direccion || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${direccion}`, '_blank');
}

// Abrir Waze
function abrirWaze() {
    if (!datosEvento) return;
    const direccion = encodeURIComponent(datosEvento.evento.recepcion.direccion || '');
    window.open(`https://waze.com/ul?q=${direccion}`, '_blank');
}

// Agregar clase fade-out para animación de salida
const style = document.createElement('style');
style.textContent = `
    .fade-out {
        animation: fadeOut 0.3s ease-out forwards;
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

