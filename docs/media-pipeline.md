# Pipeline multimedia

## 1. Propósito y alcance

Este documento describe cómo Vestoria sirve imágenes y videos desde Google
Drive: qué formatos acepta, cómo genera miniaturas, cómo soporta `Range`, cómo
convierte HEIC y qué límites operativos existen. No cubre el orden cronológico
([`date-ordering.md`](./date-ordering.md)) ni las variables de entorno
([`configuration.md`](./configuration.md)).

Principio rector: **ningún archivo se sirve mediante una URL pública de Drive**.
Todo pasa por las API Routes, que deciden el tipo MIME, los headers de caché y
el rango devuelto.

## 2. Formatos soportados

Allowlist en `src/lib/google-drive/mapper.ts:127-141` (`isMediaFile`):

| Tipo | MIME |
|---|---|
| Imagen | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, `image/heif` |
| Video | `video/mp4`, `video/quicktime`, `video/x-msvideo`, `video/mpeg` |

`getMediaType` (`mapper.ts:154-157`) clasifica por prefijo `image/` o `video/`.
Los archivos fuera de la lista se ignoran al mapear el álbum. Si se pide uno por
ID, `/api/media/[id]` responde **415 Unsupported media type**.

`isCoverFile` (`mapper.ts:146-149`) acepta `cover.jpg`, `cover.jpeg`, `cover.png`
y `cover.webp` (case-insensitive). Si no hay portada, se usa la primera imagen
del álbum.

## 3. Miniaturas

Endpoint: `GET /api/media/[id]/thumbnail?size=<size>`.

### Tamaños

| `size` | Dimensiones en `sharp` | Sufijo en `thumbnailLink` de Drive |
|---|---|---|
| `small` (default) | 200 × 200 | `=w200-h200` |
| `medium` | 400 × 400 | `=w400-h400` |
| `large` | 800 × 800 | `=w800-h800` |

Fuente: `thumbnail/route.ts:156-161` y `thumbnail/route.ts:72-77`. El parámetro
`size` **no se valida**: cualquier valor distinto de los tres cae en `small`.

### Prioridad de origen

1. **`thumbnailLink` de Drive** (`thumbnail/route.ts:66-119`). Se reescribe el
   sufijo de resize con una regex y se pide con `User-Agent: Vestoria/1.0`. Si
   responde, se devuelve tal cual.
2. **Fallback `sharp`** solo para imágenes (`thumbnail/route.ts:134-215`):
   `resize(dimension, dimension, {fit: 'cover', position: 'center'})` y
   `.jpeg({quality: 80, progressive: true})`.
3. Si `sharp` falla, se sirve el original con su `mimeType` (`route.ts:210-215`).
4. Si falla el stream, **500** `Failed to process image`.

Para **videos sin `thumbnailLink`** (o cuyo fetch falla) la respuesta es **204**
con body vacío (`route.ts:124-132`); el cliente dibuja un placeholder.

### Caché

- `Map<string, Buffer>` en memoria, clave `` `${fileId}_${size}` ``.
- **Sin TTL**: se evica la entrada más antigua al superar 100 elementos
  (`route.ts:8,97-101,175-178`).
- Header en respuestas 200 y 204:
  `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`.

## 4. Archivo original

Endpoint: `GET /api/media/[id]`, con header `Range` opcional.

| Situación | Respuesta | Detalle |
|---|---|---|
| ID ausente o inválido | 400 | Texto plano: `File ID is required` / `Invalid file ID` |
| No encontrado en Drive | 404 | `File not found` (`DriveNotFoundError`) |
| MIME fuera de la allowlist | 415 | `Unsupported media type` |
| Sin `Range` | 200 | Buffer completo, `Content-Type` = MIME real |
| Con `Range` válido | 206 | `Content-Range: bytes {start}-{end}/{total}` |
| Con `Range` inválido | 416 | `Content-Range: bytes */{totalSize}` |
| Error inesperado | 500 | JSON `{success:false, error:"Failed to serve media"}` |

Headers en 200/206:
`Cache-Control: public, max-age=3600, stale-while-revalidate=86400`,
`Accept-Ranges: bytes` y `Content-Length` calculado.

### Cómo se calcula el rango

`src/lib/http/range.ts` usa `/^bytes=(\d*)-(\d*)$/`:

- `bytes=0-499` → `start=0`, `end=499`.
- `bytes=500-` → `end=total-1`.
- `bytes=-500` (sufijo) → `start=max(total-500, 0)`, `end=total-1`.
- Devuelve `null` si `total <= 0`, si ambos extremos están vacíos, si
  `start >= total` o si `end < start`. Ese `null` se traduce en **416**.
- `end` se recorta a `total-1`.

La ruta exige además un `size` finito mayor que cero para habilitar `Range`
(`media/[id]/route.ts:149-151`). El mismo `Range` se reenvía a Drive, de modo
que no se descarga el archivo completo.

## 5. HEIC / HEIF

- Están en la allowlist y se convierten a JPEG en `/api/media/[id]`
  (`route.ts:36-69,145-147`): `sharp(...).jpeg({quality: 90})`.
- Si `sharp` no logra decodificar el binario, se sirve el `thumbnailLink` de
  Drive forzado a `=w1600` como respaldo.
- Si tampoco hay miniatura utilizable, la respuesta es **415**.
- Esta rama se ejecuta **antes** del bloque de `Range`: para HEIC/HEIF no se
  aplica el soporte 206/416.

Los archivos de prueba HEIC son fixtures de formato, no parte del catálogo
definitivo de la demo.

## 6. Límites operativos

- `/api/media/[id]` arma el cuerpo **en memoria** (`streamToBuffer`,
  `route.ts:14-30,195`): no es streaming real.
- El límite de respuesta de funciones de Vercel es **4,5 MB** para respuestas no
  streamed (hecho operativo documentado en la ficha, no una constante en `src/`).
  Por eso los videos de la demo se mantienen entre **2,24 y 3,65 MB**.
- Para videos más grandes haría falta streaming real o Blob Storage; subir el
  límite de la plataforma no alcanza con este handler.
- La caché de catálogo (`public, s-maxage=3600,
  stale-while-revalidate=86400`) se aplica a `/api/categories` y a
  `/api/categories/[id]/albums`. `/api/albums/[id]` no emite `Cache-Control`.
- Los errores 4xx/5xx se sirven con `Cache-Control: no-store`.

## 7. Decisiones y porqués

| Decisión | Motivo | Consecuencia |
|---|---|---|
| `thumbnailLink` primero | Drive ya generó la miniatura; evita CPU y ancho de banda | Depende del link y de su sufijo de resize |
| `sharp` como fallback | No todos los archivos tienen `thumbnailLink` útil | Consume CPU del runtime |
| `Range` reenviado a Drive | El video arranca y hace seek sin descargar todo | Complejidad en el parseo y en los headers |
| JPEG progresivo al 80% | Suficiente para grillas y tarjetas | Se pierde transparencia en portadas |
| Miniaturas sin TTL | Evita crecimiento infinito | Entradas calientes pueden caducar antes de tiempo |
| Conversión HEIC a JPEG | Compatibilidad con navegadores | Sin `Range` en esa rama |

## 8. Verificación

Los módulos puros tienen tests unitarios: `src/lib/http/range.test.ts` y
`src/lib/google-drive/mapper.test.ts`. En la última verificación (2026-11-20):
**49 tests, 10 archivos, todos verdes**; `npm run lint` 0 errores (5 warnings) y
`npm run build` OK.

## 9. Referencias

- [`architecture.md`](./architecture.md) — capas y contrato general.
- [`date-ordering.md`](./date-ordering.md) — prioridad de fechas.
- [`configuration.md`](./configuration.md) — `ALLOW_EMBED` y variables.
- [`troubleshooting.md`](./troubleshooting.md) — síntomas y causas.
