// Variables globales
let datosEvento = null;
let invitadoActual = null;
let countdownInterval = null;
let uuidInvitado = null;
let musica = null;
let musicPlaying = false;

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
            if (invitadoActual) {
                // Iniciar la música inmediatamente al hacer click para asegurar que el navegador lo permita
                if (musica) {
                    musica.volume = 0.3;
                    musica.play().then(() => {
                        musicPlaying = true;
                        document.getElementById('musicControl').classList.remove('d-none');
                        document.getElementById('musicControl').classList.add('fade-in');
                        const musicIcon = document.getElementById('musicIcon');
                        if (musicIcon) {
                            musicIcon.classList.replace('bi-volume-mute-fill', 'bi-volume-up-fill');
                        }
                    }).catch(error => {
                        console.error("Error al reproducir música en el click:", error);
                    });
                }

                // Si ya está validado, abrir invitación
                sobreImg.classList.add('fade-out');
                mostrarInvitacion();
            } else {
                // Si no, mostrar input para validar
                mostrarInputCodigo();
            }
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

    // Botones RSVP
    const btnAsistir = document.getElementById('btnAsistir');
    if (btnAsistir) {
        btnAsistir.addEventListener('click', () => enviarRSVP('si'));
    }

    const btnNoAsistir = document.getElementById('btnNoAsistir');
    if (btnNoAsistir) {
        btnNoAsistir.addEventListener('click', () => enviarRSVP('no'));
    }

    // Control de música
    musica = document.getElementById('musicaInvitacion');
    
    if (musica) {
        musica.addEventListener('error', function(e) {
            console.error("Error cargando el archivo de audio:", musica.error);
        });
    }

    const btnMusica = document.getElementById('btnMusica');
    if (btnMusica && musica) {
        btnMusica.addEventListener('click', toggleMusica);
    }

    // Failsafe: Intentar reproducir en cualquier primer click si ya se validó
    document.addEventListener('click', function() {
        if (!musicPlaying && invitadoActual) {
            iniciarMusica();
        }
    }, { once: true });
}

// Alternar reproducción/silencio de música
function toggleMusica() {
    if (!musica) return;

    const musicIcon = document.getElementById('musicIcon');
    
    if (musica.paused) {
        musica.play().catch(e => console.error("Error al reproducir:", e));
        musicIcon.classList.replace('bi-volume-mute-fill', 'bi-volume-up-fill');
        musicPlaying = true;
    } else {
        musica.pause();
        musicIcon.classList.replace('bi-volume-up-fill', 'bi-volume-mute-fill');
        musicPlaying = false;
    }
}

// Iniciar música con volumen al 30%
function iniciarMusica() {
    if (!musica) {
        musica = document.getElementById('musicaInvitacion');
    }
    
    if (!musica) return;
    
    musica.volume = 0.3;
    
    // Forzar la carga del audio si no ha comenzado
    if (musica.readyState < 2) {
        musica.load();
    }

    const playPromise = musica.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log("Música iniciada correctamente");
            musicPlaying = true;
            const musicControl = document.getElementById('musicControl');
            if (musicControl) {
                musicControl.classList.remove('d-none');
                musicControl.classList.add('fade-in');
            }
            const musicIcon = document.getElementById('musicIcon');
            if (musicIcon) {
                musicIcon.classList.replace('bi-volume-mute-fill', 'bi-volume-up-fill');
            }
        }).catch(error => {
            console.warn("La reproducción automática fue bloqueada o falló:", error);
            // Mostrar el control de música de todos modos para que el usuario pueda activarla
            const musicControl = document.getElementById('musicControl');
            if (musicControl) {
                musicControl.classList.remove('d-none');
            }
            const musicIcon = document.getElementById('musicIcon');
            if (musicIcon) {
                musicIcon.classList.replace('bi-volume-up-fill', 'bi-volume-mute-fill');
            }
        });
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
            // Ya no abrimos automáticamente, esperamos el click en el sobre
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
        // Ya no abrimos automáticamente, esperamos el click en el sobre
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Código inválido',
            html: '<p class="poppins-font">El código ingresado no es válido. Por favor verifica e intenta nuevamente.</p>',
            confirmButtonText: 'Reintentar',
            confirmButtonColor: '#d4a574',
            customClass: {
                title: 'poppins-font',
                confirmButton: 'poppins-font'
            }
        });
    }
}

// Mostrar nombre del invitado
function mostrarNombreInvitado() {
    if (!invitadoActual) return;

    const nombreDiv = document.getElementById('nombreInvitado');
    const nombreTexto = document.getElementById('nombreInvitadoTexto');
    const cantidadTexto = document.getElementById('cantidadInvitadoTexto');
    const textoSobre = document.getElementById('textoSobre');

    nombreTexto.textContent = invitadoActual.nombres;
    const maxAdultos = invitadoActual.max_adultos || invitadoActual.max_personas || 0;
    const maxNinos = invitadoActual.max_ninos || 0;
    
    // Mostrar adultos
    const cantidadAdultosTexto = document.getElementById('cantidadAdultosTexto');
    if (cantidadAdultosTexto) {
        if (maxAdultos > 0) {
            cantidadAdultosTexto.textContent = `-${maxAdultos} ${maxAdultos === 1 ? 'Adulto' : 'Adultos'}-`;
            cantidadAdultosTexto.style.display = 'block';
        } else {
            cantidadAdultosTexto.style.display = 'none';
        }
    }
    
    // Mostrar niños
    const cantidadNinosTexto = document.getElementById('cantidadNinosTexto');
    if (cantidadNinosTexto) {
        if (maxNinos > 0) {
            cantidadNinosTexto.textContent = `-${maxNinos} ${maxNinos === 1 ? 'Niño' : 'Niños'}-`;
            cantidadNinosTexto.style.display = 'block';
        } else {
            cantidadNinosTexto.style.display = 'none';
        }
    }

    nombreDiv.classList.remove('d-none');
    nombreDiv.classList.add('fade-in');

    // Actualizar instrucción
    if (textoSobre) {
        textoSobre.textContent = '¡Bienvenido! Haz click en el sobre para ver tu invitación';
        textoSobre.style.display = 'block';
        textoSobre.classList.remove('fw-bold'); // Asegurar que no tenga negrita
        textoSobre.style.textAlign = 'center'; // Asegurar centrado
    }

    // Asegurar que el sobre sea visible, esté centrado y animado
    const sobreImg = document.getElementById('sobreImg');
    if (sobreImg) {
        sobreImg.style.display = 'block';
        sobreImg.style.margin = '0 auto'; // Asegurar centrado manual si es necesario
        sobreImg.classList.add('pulse-animation');
    }

    // Ocultar input de código si estaba abierto
    const codigoInput = document.getElementById('codigoInput');
    if (codigoInput) {
        codigoInput.style.display = 'none';
    }
}

// Mostrar invitación completa
function mostrarInvitacion() {
    if (!invitadoActual || !datosEvento) return;

    // Intentar iniciar la música inmediatamente para aprovechar la interacción del usuario (click)
    iniciarMusica();

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
    
    // Código de Vestimenta
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

    const maxAdultos = invitadoActual.max_adultos || invitadoActual.max_personas || 0;
    const maxNinos = invitadoActual.max_ninos || 0;
    const maxPersonas = maxAdultos + maxNinos;
    
    // Actualizar texto de adultos y niños
    const maxAdultosModal = document.getElementById('maxAdultosModal');
    const maxNinosModal = document.getElementById('maxNinosModal');
    
    if (maxAdultosModal) {
        maxAdultosModal.textContent = `-${maxAdultos} ${maxAdultos === 1 ? 'Adulto' : 'Adultos'}-`;
    }
    
    if (maxNinosModal) {
        if (maxNinos > 0) {
            maxNinosModal.textContent = `-${maxNinos} ${maxNinos === 1 ? 'Niño' : 'Niños'}-`;
            maxNinosModal.style.display = 'block';
        } else {
            maxNinosModal.style.display = 'none';
        }
    }
    
    document.getElementById('nombresInvitadosModal').textContent = invitadoActual.nombres;
    document.getElementById('cantidadInvitadosModal').textContent = maxPersonas;
    
    // Texto dinámico del botón asistir
    const textoAsistir = document.getElementById('textoAsistir');
    if (textoAsistir) {
        textoAsistir.textContent = maxPersonas === 1 ? 'Sí, asistiré' : 'Sí, asistiremos';
    }

    // Si ya confirmó, mostrar estado y ocultar botones
    const estado = invitadoActual.estado;
    const rsvpButtons = document.getElementById('rsvpButtons');
    const rsvpEstado = document.getElementById('rsvpEstado');
    const rsvpEstadoTexto = document.getElementById('rsvpEstadoTexto');

    if (estado !== 'pendiente') {
        if (rsvpButtons) rsvpButtons.classList.add('d-none');
        if (rsvpEstado) rsvpEstado.classList.remove('d-none');
        if (rsvpEstadoTexto) {
            rsvpEstadoTexto.textContent = invitadoActual.confirmacion || 'Confirmado';
        }
    } else {
        if (rsvpButtons) rsvpButtons.classList.remove('d-none');
        if (rsvpEstado) rsvpEstado.classList.add('d-none');
    }
}

// Enviar RSVP
async function enviarRSVP(confirmacion) {
    if (!invitadoActual || !uuidInvitado) return;

    try {
        const maxAdultos = invitadoActual.max_adultos || invitadoActual.max_personas || 0;
        const maxNinos = invitadoActual.max_ninos || 0;
        
        // Preparar datos del RSVP
        const rsvpData = {
            confirmacion: confirmacion
        };
        
        // Si confirma, incluir adultos y niños
        if (confirmacion === 'si') {
            rsvpData.cantidad_adultos = maxAdultos;
            rsvpData.cantidad_ninos = maxNinos;
        }
        
        // Enviar RSVP a la API
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RSVP}/${uuidInvitado}/rsvp`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rsvpData)
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
            title: confirmacion === 'si' ? '¡Muchas gracias!' : 'Gracias por informarnos',
            html: `
                <p class="poppins-font" style="font-size: 1.1rem;">
                    ${confirmacion === 'si' 
                        ? 'Tu asistencia ha sido confirmada con éxito. ¡Estamos felices de que nos acompañes!' 
                        : 'Lamentamos que no puedas asistir, pero agradecemos mucho tu respuesta.'}
                </p>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#d4a574',
            timer: 4000,
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
    const mapsUrl = datosEvento.evento.recepcion.google_maps_url;
    if (mapsUrl) {
        window.open(mapsUrl, '_blank');
    } else {
        const direccion = encodeURIComponent(datosEvento.evento.recepcion.direccion || '');
        window.open(`https://www.google.com/maps/search/?api=1&query=${direccion}`, '_blank');
    }
}

// Abrir Waze
function abrirWaze() {
    if (!datosEvento) return;
    const wazeUrl = datosEvento.evento.recepcion.waze_url;
    if (wazeUrl) {
        window.open(wazeUrl, '_blank');
    } else {
        const direccion = encodeURIComponent(datosEvento.evento.recepcion.direccion || '');
        window.open(`https://waze.com/ul?q=${direccion}`, '_blank');
    }
}

// Agregar al calendario
function agregarAlCalendario() {
    if (!datosEvento) return;
    
    const evento = datosEvento.evento;
    const titulo = encodeURIComponent(`Boda de ${evento.nombres_novios}`);
    const detalles = encodeURIComponent('¡Nos encantaría que nos acompañes en este día especial!');
    const lugar = encodeURIComponent(`${evento.ceremonia.lugar}, ${evento.recepcion.direccion}`);
    
    // Formato de fecha para Google Calendar: YYYYMMDDTHHMMSSZ
    // El evento es el 17 de enero de 2026 a las 3:00 PM (15:00)
    const fechaInicio = '20260117T150000';
    const fechaFin = '20260118T020000'; // Finaliza a las 2 AM del día siguiente
    
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${fechaInicio}/${fechaFin}&details=${detalles}&location=${lugar}&sf=true&output=xml`;
    
    window.open(googleCalendarUrl, '_blank');
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

