# IZISPACE Ocean Core — Cloudflare

Esta carpeta contiene una versión desplegable en **Cloudflare Workers**. El HTML se sirve como Static Asset y el anuncio global del panel Izi-Admin se guarda en **Workers KV**.

## Qué tendrás al desplegarlo

- `https://tu-dominio.com` servido por Cloudflare.
- HTTPS y certificado gestionados por Cloudflare al añadir un Custom Domain.
- Admin Panel con `Ctrl + Mayúsculas + L`.
- Difusor global de anuncios mediante `/api/announcement`.
- Publicación protegida con el secreto `ADMIN_TOKEN`.
- El resto del funcionamiento sigue estando dentro de `public/index.html`.

## Requisitos

Instala Node.js y Wrangler, e inicia sesión en Cloudflare:

```bash
npm install -g wrangler
npx wrangler login
```

## Despliegue desde cero

Ejecuta estos comandos dentro de esta carpeta:

```bash
npx wrangler kv namespace create ANNOUNCEMENTS
```

Cloudflare devolverá un bloque parecido a:

```text
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Copia ese ID y reemplaza `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` en `wrangler.toml`.

Después crea el secreto del administrador:

```bash
npx wrangler secret put ADMIN_TOKEN
```

Escribe una contraseña larga y privada cuando Wrangler la solicite. No la pongas dentro del HTML ni la subas a GitHub.

Finalmente despliega:

```bash
npx wrangler deploy
```

Wrangler te mostrará una URL `workers.dev` provisional para probarlo.

## Conectar tu dominio y activar SSL

1. Añade tu dominio a Cloudflare y cambia los nameservers en tu registrador si todavía no lo has hecho.
2. En Cloudflare entra en **Workers & Pages**.
3. Abre el Worker `izispace-ocean`.
4. Ve a **Settings → Domains & Routes → Add → Custom Domain**.
5. Escribe, por ejemplo, `www.tudominio.com` o `app.tudominio.com`.
6. Cloudflare creará el DNS y emitirá el certificado HTTPS automáticamente.

También puedes conectar el dominio raíz si la zona y el DNS están gestionados por Cloudflare.

## Cómo publicar un anuncio global

1. Abre tu web desplegada.
2. Pulsa `Ctrl + Mayúsculas + L`.
3. Escribe el texto del aviso.
4. Introduce el mismo valor que guardaste como `ADMIN_TOKEN`.
5. Pulsa **Difundir global**.

Los visitantes consultan el anuncio al cargar la página y después cada 15 segundos. El aviso se guarda durante 24 horas en KV, salvo que pulses **Limpiar global**.

## Seguridad importante

El token de administrador solo se usa desde el navegador para autorizar la petición de publicación. Para un proyecto con muchos administradores o una web pública grande, conviene sustituirlo por Cloudflare Access, autenticación con usuarios o un proveedor OAuth. No compartas el token ni lo pongas en un archivo público.

## Desarrollo local

Puedes probar el Worker en local con:

```bash
npx wrangler dev
```

En local, Wrangler usa su almacenamiento local para KV. Para publicar en Cloudflare, usa `npx wrangler deploy`.

## Archivos incluidos

| Archivo | Función |
|---|---|
| `public/index.html` | IZISPACE completo, con logo, juegos, modo pánico y Admin Panel |
| `worker.js` | API global de anuncios y servidor de Static Assets |
| `wrangler.toml` | Configuración del Worker, assets y KV |
