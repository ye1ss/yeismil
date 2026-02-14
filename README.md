# YEISMIL Landing Page - Guía de Configuración

## Archivos incluidos

```
yeismil/
├── index.html        # Landing principal
├── styles.css        # Estilos
├── confirmado.html   # Página post-confirmación email
├── aviso-legal.html  # Textos legales
├── privacidad.html
├── cookies.html
└── worker.js         # Backend para Cloudflare Workers
```

---

## PASO 1: Configurar Brevo (Email Marketing)

### 1.1 Crear cuenta
1. Ve a [brevo.com](https://www.brevo.com/es/)
2. Crea cuenta gratuita
3. Confirma tu email

### 1.2 Verificar dominio de envío
1. Ve a **Configuración > Remitentes y dominios**
2. Añade y verifica `hola@yeismil.com` (o tu email)
3. Si tienes dominio propio, verifica el dominio para mejor deliverability

### 1.3 Crear listas de contactos
1. Ve a **Contactos > Listas**
2. Crea lista "Newsletter" → anota el ID (ej: 2)
3. Crea lista "Kakebo Waitlist" → anota el ID (ej: 3)

### 1.4 Crear template de Double Opt-in
1. Ve a **Automatización > Templates transaccionales**
2. Crea un template para confirmación de email
3. Anota el ID del template

### 1.5 Obtener API Key
1. Ve a **Configuración > Claves API y SMTP**
2. Crea una API Key
3. Guárdala en lugar seguro

---

## PASO 2: Configurar Cloudflare Worker (Backend)

### 2.1 Crear cuenta
1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Crea cuenta gratuita

### 2.2 Crear Worker
1. Ve a **Workers & Pages**
2. Click en **Create application > Create Worker**
3. Ponle nombre (ej: `yeismil-api`)
4. Click en **Deploy**

### 2.3 Editar código
1. Click en **Edit code**
2. Borra todo y pega el contenido de `worker.js`
3. Click en **Save and deploy**

### 2.4 Configurar variables de entorno
1. Ve a **Settings > Variables**
2. Añade:
   - `BREVO_API_KEY` = tu API key de Brevo
   - `ALLOWED_ORIGIN` = `https://yeismil.com` (tu dominio)
3. Click en **Deploy**

### 2.5 Copiar URL del Worker
Tu URL será algo como: `https://yeismil-api.tu-usuario.workers.dev`

---

## PASO 3: Configurar el Frontend

### 3.1 Editar index.html
Busca la sección `CONFIG` en el JavaScript y actualiza:

```javascript
const CONFIG = {
    // URL de tu Cloudflare Worker
    API_ENDPOINT: 'https://yeismil-api.tu-usuario.workers.dev',
    
    // IDs de tus listas en Brevo
    NEWSLETTER_LIST_ID: 2,      // ← Pon tu ID real
    KAKEBO_LIST_ID: 3,          // ← Pon tu ID real
    
    // URLs donde tienes los recursos
    RESOURCES: {
        'n8n-workflow-001': {
            name: 'Workflow N8N',
            url: 'https://tu-dominio.com/recursos/workflow-n8n.json'
        },
        // ... añade los demás
    }
};
```

### 3.2 Editar worker.js
Actualiza el email del remitente:
```javascript
sender: {
    name: 'Yeismil',
    email: 'hola@yeismil.com' // ← Tu email verificado en Brevo
},
```

Y la URL de redirección:
```javascript
redirectionUrl: 'https://yeismil.com/confirmado',
```

---

## PASO 4: Subir archivos a tu hosting

Puedes usar:
- **GitHub Pages** (gratis)
- **Cloudflare Pages** (gratis)
- **Vercel** (gratis)
- **Netlify** (gratis)

### Opción recomendada: Cloudflare Pages
1. Sube tu código a GitHub
2. En Cloudflare, ve a **Workers & Pages > Create application > Pages**
3. Conecta tu repositorio de GitHub
4. Despliega

---

## PASO 5: Completar textos legales

Edita estos archivos y rellena:
- `[TU NOMBRE COMPLETO]`
- `[FECHA]`
- `[NOMBRE DEL SERVICIO DE EMAIL]` → Brevo

---

## Cómo añadir un nuevo recurso

1. En `index.html`, copia un `resource-card` existente
2. Cambia:
   - `data-resource-id` (único, ej: `nuevo-recurso-001`)
   - `value` del checkbox (igual que el ID)
   - Icono Material Symbols
   - Título y descripción
   - Tag

3. En la sección `CONFIG.RESOURCES`, añade:
```javascript
'nuevo-recurso-001': {
    name: 'Nombre del recurso',
    url: 'https://tu-dominio.com/recursos/archivo.pdf'
}
```

---

## Flujo de funcionamiento

### Recursos gratuitos:
1. Usuario selecciona recursos
2. Pone email y elige si quiere newsletter
3. Click en enviar
4. **Si NO quiere newsletter**: Solo recibe email con enlaces de descarga
5. **Si SÍ quiere newsletter**: Recibe email + email de confirmación (double opt-in)
6. Al confirmar, se añade a la lista Newsletter

### Kakebo waitlist:
1. Usuario pone email y marca opciones
2. Click en unirse
3. Recibe email de confirmación (double opt-in)
4. Al confirmar, se añade a la lista Kakebo Waitlist con sus preferencias

---

## Iconos Material Symbols útiles

```
sync            → Automatización/workflows
smart_toy       → IA/GPT
dashboard       → Dashboards/Notion
mail            → Email
download        → Descarga
check_circle    → Confirmado
construction    → En desarrollo
payments        → Finanzas
flag            → Objetivos
analytics       → Estadísticas
repeat          → Rutinas/loops
smartphone      → App/móvil
code            → Código
folder          → Archivos
edit_document   → Documentos
videocam        → Video
image           → Imágenes
link            → Enlaces
```

Más iconos: [fonts.google.com/icons](https://fonts.google.com/icons)

---

## Soporte

Si tienes dudas, revisa:
- [Documentación Brevo API](https://developers.brevo.com/)
- [Documentación Cloudflare Workers](https://developers.cloudflare.com/workers/)
