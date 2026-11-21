# Resolución de problemas

## 1. Cómo leer un error

Vestoria distingue tres niveles:

1. **Error de configuración**: faltan variables `GOOGLE_*` → 503 con
   `code: CONFIG_MISSING`.
2. **Error de Drive**: recurso inexistente o sin permiso → `DriveNotFoundError`
   (`code: DRIVE_NOT_FOUND`) → 404.
3. **Error inesperado**: 500 con mensaje genérico. El detalle real queda en
   `console.error` del servidor, nunca en la respuesta.

Regla: **si el mensaje de la API es genérico, buscá el detalle en los logs del
servidor**, no en la respuesta HTTP.

## 2. Síntomas y causas

| Síntoma | Causa probable | Acción |
|---|---|---|
| `/api/categories` devuelve `[]` | La carpeta raíz no está compartida con el service account, o no tiene subcarpetas | Compartir `GOOGLE_ROOT_FOLDER_ID` con `GOOGLE_CLIENT_EMAIL` como **Viewer**; crear categorías |
| `/api/categories` → 403 | Falta de permiso sobre la carpeta o Drive API deshabilitada | Revisar share y que Drive API esté habilitada en Google Cloud |
| `/api/categories` → 503 `CONFIG_MISSING` | Falta alguna `GOOGLE_*` | Completar las cuatro variables en el entorno correspondiente y redeployar |
| `/api/categories` → 500 | Error de Drive no clasificado como "no encontrado" o de red | Revisar logs; verificar validez de la clave privada y los scopes |
| Una categoría → 404 `Category not found` | ID inexistente o carpeta borrada | Verificar el ID; recargar la home |
| Un álbum → 404 `Album not found` | ID inexistente, borrado o sin acceso | Verificar el ID y el permiso heredado |
| Cualquier ruta → 400 `Invalid ... ID` | El ID no pasa `isValidDriveId` | Corregir el ID; no es un error de permisos |
| Archivo → 415 `Unsupported media type` | MIME fuera de la allowlist | Usar JPG/PNG/WebP/GIF/HEIC/HEIF o MP4/MOV/AVI/MPEG |
| Video no hace seek | `Range` no fue respetado o el archivo supera el límite de respuesta | Verificar `Accept-Ranges: bytes` y respuestas 206; usar videos <4 MB |
| Archivo → 416 | `Range` mal formado o fuera del tamaño | Revisar el header `Range`; el cliente suele corregirlo solo |
| Miniatura → 204 | Video sin `thumbnailLink` y sin fallback | Comportamiento esperado: el cliente dibuja un placeholder |
| Miniatura → 500 `Failed to process image` | `sharp` no pudo procesar el stream | Probar otra imagen; revisar logs del servidor |
| Todo `/api/*` → 429 | Rate limit (300 req / 60 s por IP) | Esperar el tiempo de `Retry-After`; reducir la frecuencia |
| Toda la app → 401 | Basic Auth activo | Ingresar con `SITE_AUTH_USER` / `SITE_AUTH_PASS`, o quitar ambas variables |
| La demo no se puede incrustar | `ALLOW_EMBED` no estaba seteada en el build | Setear `ALLOW_EMBED=true` en el proyecto demo y **redeployar** |
| El iframe funciona en local pero no en producción | La variable se resolvió en otro build | Verificar headers en producción, no solo en local |
| La app aparece en búsquedas | `X-Robots-Tag` se quitó o se sobreescribió | Restaurar `noindex, nofollow` en `next.config.ts` |
| Fotos en "Sin fecha" | No hay patrón en el nombre, EXIF ilegible y `modifiedTime` no resuelve | Renombrar con `IMG_YYYYMMDD...`; ver [`date-ordering.md`](./date-ordering.md) |
| El año de un álbum es incorrecto | El nombre de la carpeta tiene un número de 4 dígitos que no es año | Renombrar la carpeta sin ese número |
| Cambié fotos en Drive pero no se ven | Caché en memoria de 1 h por instancia | Esperar el TTL o reiniciar la instancia; no hay invalidación manual |

## 3. Códigos de respuesta por ruta

| Ruta | 200 | 206 | 204 | 400 | 404 | 415 | 416 | 500 | 503 |
|---|---|---|---|---|---|---|---|---|---|
| `/api/categories` | ✔ | | | | | | | ✔ | ✔ |
| `/api/categories/[id]/albums` | ✔ | | | ✔ | ✔ | | | ✔ | |
| `/api/albums/[id]` | ✔ | | | ✔ | ✔ | | | ✔ | ✔ |
| `/api/media/[id]` | ✔ | ✔ | | ✔ | ✔ | ✔ | ✔ | ✔ | |
| `/api/media/[id]/thumbnail` | ✔ | | ✔ | ✔ | ✔ | | | ✔ | |

Además, `src/proxy.ts` puede devolver **429** en cualquier `/api/*` y **401** en
toda la app cuando Basic Auth está activo.

## 4. Headers de caché esperados

| Respuesta | Header |
|---|---|
| Catálogo (200) | `public, s-maxage=3600, stale-while-revalidate=86400` |
| Media completo (200/206) | `public, max-age=3600, stale-while-revalidate=86400` |
| Miniatura (200/204) | `public, max-age=86400, stale-while-revalidate=604800` |
| Errores 4xx/5xx, 429 | `no-store` |

`/api/albums/[id]` **no emite** `Cache-Control`: es una diferencia intencional
del handler, no un bug de configuración.

## 5. Checklist de verificación

Antes de reportar un problema, comprobar en este orden:

1. `GET /api/categories` → ¿200 con datos, 503 o 500?
2. ¿Las cuatro variables `GOOGLE_*` están en el entorno correcto (Production vs
   Preview)?
3. ¿La carpeta raíz está compartida con el `client_email` como Viewer?
4. ¿El ID que falla existe y pertenece a esa carpeta?
5. ¿El tipo MIME del archivo está en la allowlist?
6. ¿El build incluye la variable que se está probando (`ALLOW_EMBED`)?
7. ¿El problema aparece en local, en la demo, en el cliente o en los tres?
8. ¿Los logs del servidor muestran el error real detrás del 500?

## 6. Precauciones

- No pegar credenciales en issues, PRs ni documentación.
- No probar escritura en Drive: la app es solo lectura y el service account no
  tiene permisos de escritura.
- No borrar ni renombrar la carpeta raíz mientras la app está sirviendo.
- No asumir que un 404 es un error de permisos: primero se valida el ID.

## 7. Referencias

- [`configuration.md`](./configuration.md) — variables y permisos.
- [`media-pipeline.md`](./media-pipeline.md) — `Range`, HEIC y límites.
- [`date-ordering.md`](./date-ordering.md) — fechas y agrupación.
- [`architecture.md`](./architecture.md) — contrato de las API Routes.
