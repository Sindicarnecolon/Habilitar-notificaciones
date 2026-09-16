/**
 * ============================================================
 *  Gestión de Notificaciones — Sindicato de la Carne
 *  Panel de Administración de Avisos de Novedades
 * ============================================================
 *
 *  CONFIGURACIÓN DEL BACKEND:
 *  Esta constante se completará en la Etapa 3 cuando se cree
 *  el nuevo Google Apps Script independiente para Notificaciones.
 */
const NOTIFICATION_API_URL = 'https://script.google.com/macros/s/AKfycbwGF4TrGZlVA1F3SaYkG91AqpW2XcTZqWGXSbRzUqoY742uqWpq2foyEMLNmY9IKgvI/exec';

// Estado local interactivo / demo
let currentState = {
    enabled: false,
    notificationId: 1,
    updatedAt: new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
};

/**
 * Inicialización al cargar la página
 */
window.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    const warningBanner = document.getElementById('backend-warning');
    const switchEl = document.getElementById('notification-switch');

    if (!NOTIFICATION_API_URL || NOTIFICATION_API_URL.trim() === '') {
        // Backend no configurado aún (Etapa 2) -> Modo vista previa / demostración
        warningBanner.style.display = 'flex';
        switchEl.disabled = false; // Permitir interactuar en demo
        updateUI(currentState.enabled, currentState.notificationId, currentState.updatedAt);
        showToast('Modo vista previa — Backend pendiente de configurar (Etapa 3)', 'info');
        return;
    }

    // Backend configurado (Etapa 3+) -> Consultar estado real del servidor
    warningBanner.style.display = 'none';
    await fetchNotificationState();
}

/**
 * Helper para peticiones con límite de tiempo (timeout) y manejo de cancelaciones
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'omit',
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Consulta el estado actual desde el backend de Google Apps Script
 */
async function fetchNotificationState() {
    const switchEl = document.getElementById('notification-switch');
    const pill = document.getElementById('status-pill');
    const icon = document.getElementById('status-icon');
    const text = document.getElementById('status-text');
    const subtext = document.getElementById('status-subtext');

    // Estado inicial en UI no bloqueante mientras consulta
    switchEl.disabled = true;
    if (pill && icon && text && subtext) {
        pill.className = 'status-pill state-pending';
        icon.textContent = 'sync';
        text.textContent = 'Consultando estado...';
        subtext.textContent = 'Conectando con el servidor para verificar novedades...';
    }

    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetchWithTimeout(`${NOTIFICATION_API_URL}?action=status`, {}, 20000);
            if (!response.ok) {
                throw new Error(`Error de servidor (${response.status})`);
            }
            const data = await response.json();

            if (data.success) {
                if (attempt > 1) {
                    console.log('[Notificaciones] Backend recuperado en segundo intento.');
                }
                currentState.enabled = Boolean(data.enabled);
                currentState.notificationId = data.notificationId || 0;
                currentState.updatedAt = formatTimestamp(data.updatedAt);
                
                updateUI(currentState.enabled, currentState.notificationId, currentState.updatedAt);
                switchEl.disabled = false;
                return;
            } else {
                if (pill && icon && text && subtext) {
                    pill.className = 'status-pill state-off';
                    icon.textContent = 'cloud_off';
                    text.textContent = 'Sin conexión';
                    subtext.textContent = 'No se pudo obtener el estado del servidor. Reintente recargando la página.';
                }
                showToast(data.message || data.error || 'No se pudo obtener el estado del servidor', 'error');
                switchEl.disabled = true;
                return;
            }
        } catch (err) {
            if (attempt === 1) {
                if (err.name === 'AbortError') {
                    console.warn('[Notificaciones] Primera consulta agotó timeout; reintentando...');
                } else {
                    console.warn('[Notificaciones] Error en primera consulta (' + err.message + '); reintentando...');
                }
                // Pausa breve y determinista de 1 segundo antes del único reintento
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                console.error('[Notificaciones] Error al consultar backend (reintento agotado):', err);
                if (pill && icon && text && subtext) {
                    pill.className = 'status-pill state-off';
                    icon.textContent = 'cloud_off';
                    text.textContent = 'Sin conexión';
                    subtext.textContent = 'No se pudo conectar con el servidor. Reintente recargando la página.';
                }
                showToast('No se pudo conectar con el servidor. El estado no fue modificado.', 'error');
                switchEl.disabled = true;
            }
        }
    }
}

/**
 * Manejador del evento de cambio del switch ON/OFF
 */
async function handleSwitchToggle(event) {
    const targetState = event.target.checked;
    const switchEl = event.target;

    if (!NOTIFICATION_API_URL || NOTIFICATION_API_URL.trim() === '') {
        // Modo vista previa (Etapa 2): Simular activación / desactivación
        currentState.enabled = targetState;
        if (targetState) {
            // Cada nueva activación genera un nuevo ID
            currentState.notificationId += 1;
        }
        currentState.updatedAt = formatTimestamp(new Date().toISOString());
        
        updateUI(currentState.enabled, currentState.notificationId, currentState.updatedAt);
        showToast(targetState ? 'Notificaciones activadas (Demo)' : 'Notificaciones desactivadas (Demo)', 'info');
        return;
    }

    // Modo real: enviar cambio al backend
    showLoader(true);
    switchEl.disabled = true;

    try {
        const action = targetState ? 'enable' : 'disable';
        const url = `${NOTIFICATION_API_URL}?action=${action}`;
        
        const response = await fetchWithTimeout(url, { method: 'GET' }, 20000);
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        const data = await response.json();

        if (data.success) {
            currentState.enabled = Boolean(data.enabled);
            currentState.notificationId = data.notificationId;
            currentState.updatedAt = formatTimestamp(data.updatedAt);

            updateUI(currentState.enabled, currentState.notificationId, currentState.updatedAt);
            showToast(currentState.enabled ? 'Notificaciones activadas correctamente' : 'Notificaciones desactivadas', 'info');
        } else {
            // Revertir switch si el servidor rechazó la solicitud
            event.target.checked = currentState.enabled;
            updateUI(currentState.enabled, currentState.notificationId, currentState.updatedAt);
            showToast(data.message || data.error || 'No se pudo guardar el cambio', 'error');
        }
    } catch (err) {
        console.error('[Notificaciones] Error al actualizar estado:', err);
        event.target.checked = currentState.enabled;
        updateUI(currentState.enabled, currentState.notificationId, currentState.updatedAt);
        showToast('No se pudo conectar con el servidor. El estado no fue modificado.', 'error');
    } finally {
        showLoader(false);
        switchEl.disabled = false;
    }
}

function formatTimestamp(raw) {
    if (!raw) return '--';
    try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return String(raw);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (_) {
        return String(raw);
    }
}

/**
 * Actualiza los elementos visuales de la interfaz
 */
function updateUI(enabled, notificationId, updatedAt) {
    const switchEl = document.getElementById('notification-switch');
    const pill = document.getElementById('status-pill');
    const icon = document.getElementById('status-icon');
    const text = document.getElementById('status-text');
    const subtext = document.getElementById('status-subtext');
    const metaId = document.getElementById('meta-id');
    const metaUpdated = document.getElementById('meta-updated');

    switchEl.checked = enabled;

    if (enabled) {
        pill.className = 'status-pill state-on';
        icon.textContent = 'notifications_active';
        text.textContent = 'Notificaciones activas';
        subtext.textContent = 'El indicador visual "Hay notificaciones nuevas" se mostrará a todos los afiliados.';
    } else {
        pill.className = 'status-pill state-off';
        icon.textContent = 'notifications_off';
        text.textContent = 'Notificaciones desactivadas';
        subtext.textContent = 'El indicador visual de novedades estará oculto para los afiliados.';
    }

    metaId.textContent = notificationId ? `#${notificationId}` : '--';
    metaUpdated.textContent = updatedAt || '--';
}

/**
 * Control del Spinner / Loader de la tarjeta
 */
function showLoader(show) {
    const loader = document.getElementById('card-loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Notificación Toast flotante
 */
let toastTimeout;
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-message');
    const icon = document.getElementById('toast-icon');

    msg.textContent = message;
    
    if (type === 'error') {
        toast.style.backgroundColor = '#D32F2F';
        icon.textContent = 'error';
    } else {
        toast.style.backgroundColor = '#323232';
        icon.textContent = 'info';
    }

    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}
