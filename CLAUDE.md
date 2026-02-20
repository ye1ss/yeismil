# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Landing page personal de la marca **YEISMIL** (Tech Builder). Stack: HTML/CSS/JS vanilla + Cloudflare Workers como backend + Brevo como servicio de email.

## Architecture

**No build system.** Todo es estático — se edita directamente y se sube al hosting.

```
index.html        → Landing principal (hero, recursos, kakebo waitlist, footer)
styles.css        → Todos los estilos (incluye neco.css via @import)
worker.js         → Cloudflare Worker que maneja las suscripciones de email
confirmado.html   → Página post-confirmación de email
aviso-legal.html / privacidad.html / cookies.html → Páginas legales
fonts/            → Fuente Neco (ITF) en woff2/woff/ttf
```

## Email Flow

Hay dos flujos de suscripción manejados en `worker.js`:

1. **Recursos gratuitos** (`type: 'resources'`): envía email con los links de descarga + opcionalmente añade al newsletter (double opt-in via Brevo)
2. **Kakebo waitlist** (`type: 'kakebo_waitlist'`): añade al usuario a la lista de espera con atributos `EARLY_ACCESS` y `LAUNCH_DISCOUNT`

El frontend llama a `CONFIG.API_ENDPOINT` (`/api/subscribe`) que mapea al Worker de Cloudflare. El Worker necesita las env vars `BREVO_API_KEY` y `ALLOWED_ORIGIN`.

## Configuración en index.html

El objeto `CONFIG` (línea ~352) es el único lugar donde configurar:
- `API_ENDPOINT`: URL del Cloudflare Worker
- `NEWSLETTER_LIST_ID` / `KAKEBO_LIST_ID`: IDs de listas en Brevo
- `RESOURCES`: URLs reales de los archivos a enviar por email

## Design System

- **Fuente display**: Neco-Black (custom, cargada desde `fonts/`)
- **Fuente body**: DM Sans (Google Fonts)
- **Fuente mono**: Space Mono (Google Fonts)
- **Color primario**: `#0066FF` (azul eléctrico)
- **Estilo**: Brutalist editorial — bordes duros, sombras offset en azul

Las tarjetas de recursos usan un shadow-offset con `::before` (fondo azul desplazado 6-8px). El estado `.selected` cambia ese fondo a negro.

## Recursos activos

Actualmente hay 2 recursos en la grid (n8n workflow + GPT asistente). El grid está configurado a `repeat(2, 1fr)` en desktop. Para añadir más recursos: copiar un `<article class="resource-card">` con un nuevo `data-resource-id` único, y añadir la entry correspondiente en `CONFIG.RESOURCES`.

## Despliegue

1. Subir `worker.js` a Cloudflare Workers con las env vars configuradas
2. El resto de archivos va al hosting estático (Cloudflare Pages, Vercel, etc.)
3. Actualizar `ALLOWED_ORIGIN` en el Worker y `API_ENDPOINT` en `index.html`
