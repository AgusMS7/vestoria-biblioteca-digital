# Configuración

## 1. Requisitos previos

- **Node.js >= 20.9** (declarado en `engines` de `package.json`).
- **npm** (hay `package-lock.json` v3: usar `npm ci` para instalación
  reproducible).
- Una cuenta de Google Cloud con **Drive API** habilitada y un **service
  account** con credenciales JSON.
- Una carpeta de Drive compartida en lectura con el email del service account.

El build funciona sin credenciales porque el acceso a `process.env` es lazy; las
credenciales se validan cuando se ejecuta una consulta a Drive.

## 2. Variables de entorno

| Variable | Obligatoria | Default | Dónde se lee | Propósito |
|---|---|---|---|---|
| `GOOGLE_PROJECT_ID` | Sí (en ejecución) | — | `env.ts:64-66` | ID del proyecto de Google Cloud. Participa en `isGoogleConfigured()`; no tiene otros usos en `src/`. |
| `GOOGLE_CLIENT_EMAIL` | Sí (en ejecución) | — | `env.ts:69-71` | Email del service account; se usa para el JWT y es quien debe tener acceso de lectura a la carpeta. |
| `GOOGLE_PRIVATE_KEY` | Sí (en ejecución) | — | `env.ts:73-79` | Clave privada del service account. Los `\n` literales se convierten a saltos reales. |
| `GOOGLE_ROOT_FOLDER_ID` | Sí (en ejecución) | — | `env.ts:81-83` | ID de la carpeta raíz: sus subcarpetas son las categorías. |
| `SITE_NAME` | No | `Vestoria` | `env.ts:46-48` | Marca visible del header. El deploy del cliente la personaliza; el footer **no** la usa. |
| `SITE_AUTH_USER` | No | — | `proxy.ts:56-58` | Usuario de Basic Auth. Solo se activa junto con `SITE_AUTH_PASS`. |
| `SITE_AUTH_PASS` | No | — | `proxy.ts:59-61` | Contraseña de Basic Auth. |
| `ALLOW_EMBED` | No | apagado | `next.config.ts:7` | Si es exactamente `'true'`, permite incrustar la app en un iframe. |

`.env.example` lista los ocho nombres con valores vacíos. Copiarlo a `.env.local`
para desarrollo local; **no versionar `.env.local`**.

### Acceso lazy

`src/config/env.ts` es el único módulo que toca `process.env`:

- `getEnvVar(key)` lanza si falta la variable.
- `getEnvVarOrDefault(key, fallback)` devuelve un default.
- `isGoogleConfigured()` es booleano y **no lanza**: permite responder 503
  `CONFIG_MISSING` en vez de tumbar el proceso.

Si faltan las `GOOGLE_*`, `/api/categories` y `/api/albums/[id]` responden:

```json
{ "success": false, "error": "Service unavailable", "code": "CONFIG_MISSING" }
```

## 3. Google Drive: permisos y estructura

1. Habilitar Drive API en el proyecto de Google Cloud.
2. Crear un service account y descargar su JSON de credenciales.
3. Compartir la carpeta raíz con el `GOOGLE_CLIENT_EMAIL` como **Viewer**. Las
   subcarpetas heredan el permiso.
4. Verificar con `GET /api/categories`: 200 con datos significa que el share
   funciona; 403 o lista vacía significa que no.

Estructura esperada:

```
GOOGLE_ROOT_FOLDER_ID/
├── Familia/
│   └── Vacaciones 2024/
│       ├── cover.jpg
│       ├── IMG_20240312_143000.jpg
│       └── PXL_20240312_150000.mp4
└── Viajes/
    └── Bariloche 2022/
        └── ...
```

- Nivel 1 → categoría.
- Nivel 2 → álbum.
- Nivel 3 → archivos multimedia.

El service account solo necesita lectura (`scope: drive.readonly`). Vestoria no
escribe ni modifica nada en Drive.

## 4. Marca por deploy

`SITE_NAME` cambia el título (`<SITE_NAME> - Biblioteca Digital`), la metadata y
el header. Por defecto es `Vestoria`.

El **footer es fijo**: siempre dice `VESTORIA · Agustín Sandoval` y
`CÓDIGO BAJO LICENCIA MIT · © 2026`, sin links y sin ícono. Es una decisión de
producto: la marca del producto no depende de la personalización del cliente.

## 5. Autenticación opcional

`SITE_AUTH_USER` y `SITE_AUTH_PASS` se leen juntas:

- Si **ambas** existen, `src/proxy.ts` exige Basic Auth en toda la app (excepto
  assets estáticos y de `public/`).
- Si falta alguna, no se pide login.
- La comparación es en tiempo constante; la codificación es UTF-8 manual.
- Respuesta sin credenciales: 401 con
  `WWW-Authenticate: Basic realm="Vestoria", charset="UTF-8"`.

Por decisión de diseño, los deploys públicos funcionan **sin login**: se prioriza
la baja fricción para usuarios no técnicos. Si se usa Vestoria con fotos
privadas, la recomendación es una cuenta dedicada y un dominio no público.

## 6. Iframe y `ALLOW_EMBED`

`ALLOW_EMBED` se evalúa en `next.config.ts`, es decir **en build**, no en runtime:

|Estado| Headers relevantes |
|---|---|
| Sin variable (o distinto de `'true'`) | `X-Frame-Options: DENY`, sin CSP de frame |
| `ALLOW_EMBED=true` | Sin `X-Frame-Options`, con `Content-Security-Policy: frame-ancestors *` |

Los demás headers se emiten siempre:

- `X-Robots-Tag: noindex, nofollow`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `poweredByHeader: false`

Consecuencias operativas:

- La variable debe setearse **antes** del deploy que debe habilitar el iframe.
- `frame-ancestors *` permite cualquier origen (riesgo aceptado).
- El sitio del cliente mantiene `DENY`: solo la demo recibe la variable.

## 7. Rate limiting

`src/proxy.ts` aplica un token bucket en memoria:

| Parámetro | Valor |
|---|---|
| Límite | 300 tokens |
| Ventana | 60.000 ms |
| Ámbito | Solo rutas que empiezan con `/api/` |
| Identidad | `x-forwarded-for` (primer valor), o `x-real-ip`, o `unknown` |
| Exceso | 429 `Too Many Requests` + `Retry-After` en segundos + `Cache-Control: no-store` |

Se ejecuta **antes** del Basic Auth. El estado es por instancia: en serverless
no se comparte entre réplicas.

## 8. Ejecutar en local

```bash
npm ci
cp .env.example .env.local   # completar los valores localmente, nunca versionarlos
npm run dev                  # http://localhost:3000
```

Comandos de verificación:

```bash
npm test       # vitest run
npm run lint   # eslint
npm run build  # next build
npm start      # servir el build en :3000
```

**Health check:** `GET http://localhost:3000/api/categories`. Responde 200 con
datos si Drive está configurado y compartido; 503 `CONFIG_MISSING` si faltan
credenciales. No existe una ruta `/api/health`.

## 9. Buenas prácticas

- No pegar valores reales en el README ni en `docs/`: solo nombres.
- Rotar credenciales si se sospecha exposición.
- Tratar un cambio de setup como un cambio de código: actualizar este archivo en
  el mismo PR.
- No sobrescribir `.env.local` ajeno ni versionarlo.

## 10. Referencias

- [`architecture.md`](./architecture.md) — capas y configuración general.
- [`media-pipeline.md`](./media-pipeline.md) — headers de caché de multimedia.
- [`troubleshooting.md`](./troubleshooting.md) — errores de configuración.
