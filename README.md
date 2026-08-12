# Gestión de Notificaciones — Sindicato de la Carne (Colón)

Página web de administración independiente diseñada para que los administradores del sindicato puedan activar y desactivar fácilmente el aviso visual de notificaciones (**"Hay notificaciones nuevas"**) que se muestra en la aplicación de los afiliados.

## Características

- 🔔 **Control ON / OFF**: Conmutador toggle simple y profesional para controlar el estado del aviso.
- 🆔 **ID de Notificación automático**: Cada nueva activación incrementa el `notificationId`, haciendo que el aviso vuelva a mostrarse a todos los usuarios independientemente de si ya habían leído la notificación anterior.
- 📱 **Diseño Responsive**: Totalmente adaptado para uso en smartphones, tablets y computadoras de escritorio.
- 🌐 **Sin dependencias pesadas**: Construida en HTML5, CSS3 y JavaScript vanilla.

## Configuración con el Backend (Etapa 3)

Al desplegar el nuevo Google Apps Script independiente para Notificaciones, pegue la URL pública generada en la constante `NOTIFICATION_API_URL` ubicada al inicio de `script.js`:

```javascript
const NOTIFICATION_API_URL = 'https://script.google.com/macros/s/NUEVA_URL_APPS_SCRIPT/exec';
```

## Guía de Publicación en GitHub Pages

1. Repositorio exclusivo de esta página:
   `https://github.com/Sindicarnecolon/Habilitar-notificaciones.git`
2. En GitHub: ve a **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: **`main` / `/(root)`** → **Save**.
3. La página estará accesible públicamente en la URL de GitHub Pages correspondiente.
