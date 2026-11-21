# Orden cronológico

## 1. Problema

Los archivos llegan de Drive con nombres heterogéneos (`IMG_20240312_143000`,
`PXL_2024-03-12`, `Vacaciones 2020`, o simplemente `DSC_001`). Vestoria necesita
agruparlos por mes y año **dentro de cada álbum** para que la grilla se lea como
un recorrido temporal, y además necesita un año para ordenar los álbumes.

La fecha no se guarda en una base de datos: se deriva en cada lectura. Por eso
existe una prioridad explícita y un fallback acotado.

## 2. Prioridad real

```
1. Nombre del archivo   → date-extractor.ts
2. EXIF DateTimeOriginal → exif-reader.ts + exif.ts   (solo si el nombre no dio fecha)
3. modifiedTime de Drive → date-extractor.ts
```

`createdTime` se evita deliberadamente: refleja la carga del archivo, no la
fecha del recuerdo. Está documentado en los comentarios de
`date-extractor.ts:79` y `mapper.ts:41`.

**La clave de la decisión**: el nombre del archivo va primero porque es el único
dato que el usuario puede controlar. Si renombra `DSC_001.jpg` a
`IMG_20180520_120000.jpg`, Vestoria lo ubica en mayo de 2018 aunque la metadata
del archivo diga otra cosa. El EXIF es un respaldo para cuando el usuario no
puso fecha en el nombre.

## 3. Extracción desde el nombre

Fuente: `src/lib/google-drive/date-extractor.ts:23-73`.

| Patrón | Formato | Ejemplo |
|---|---|---|
| Prefijo de cámara | `IMG\|PXL\|DSC\|DCIM[_-]?YYYY[_-]?MM[_-]?DD` | `IMG_20240312_143000.jpg` |
| ISO separado | `YYYY-MM-DD`, `YYYY_MM_DD`, `YYYYMMDD` entre separadores | `PXL_2024-03-12.mp4` |
| Año aislado | `[1-2]\d{3}` entre separadores | `Vacaciones_2020.jpg` |

Validación (`date-extractor.ts:11-15,40-44,56`):

- Año entre **1990** y el año actual.
- Mes entre 1 y 12.
- Día entre 1 y 31 (no se valida coincidencia real con el mes).

El año aislado se exige entre separadores para no confundir un año con un ID de
Drive o con parte de un número largo.

## 4. Fallback EXIF

Fuente: `src/lib/google-drive/exif-reader.ts` y `exif.ts`.

| Parámetro | Valor |
|---|---|
| Bytes leídos | **64 KB** (`64 * 1024`) |
| Request | `Range: bytes=0-65535`, `responseType: 'arraybuffer'` |
| Tag buscado | `DateTimeOriginal` (`0x9003`) vía `EXIF_IFD_POINTER` (`0x8769`) |
| Segmento | APP1 (`0xE1`) de un JPEG mínimo |
| Formato esperado | `YYYY:MM:DD HH:MM:SS` |
| Caché | `exifDateCache`, clave `${fileId}:${modifiedTime ?? ''}`, TTL 1 h |
| Límite | 20 lecturas por request, concurrencia 4 |

Reglas de aplicación (`service.ts:218-245`):

- Solo se intenta con **imágenes** de MIME soportado.
- Solo si `extractYearMonthFromName` **no** devolvió fecha.
- Si el EXIF da fecha, sobreescribe `year` y `month` del medio.
- Si no hay EXIF o no se lee a tiempo, queda `modifiedTime`.

Esto permite que un álbum con nombres no estándar (por ejemplo fotos escaneadas)
se ordene por la fecha real de captura cuando el archivo la conserva.

## 5. Fallback `modifiedTime`

Si no hay fecha en el nombre ni EXIF útil, se usa `modifiedTime` de Drive
(`date-extractor.ts:85-103`): se pide explícitamente en el listado de archivos
(`service.ts:166`) y se convierte con `getFullYear()` y `getMonth() + 1`.

Cuando ninguna fuente da fecha, `year` y `month` quedan `undefined` en el mapper
(`mapper.ts:49-51`) y el medio cae en el grupo **"Sin fecha"**.

## 6. Año del álbum

`mapToAlbum` (`mapper.ts:81-87`) calcula `Album.year` así:

1. Primer `\d{4}` en el **nombre de la carpeta**.
2. Si no hay, el **menor** `year` entre los medios del álbum.
3. Si ningún medio tiene año, **`null`**.

No se usa el año actual como fallback. El valor es `number | null` en el tipo
`Album` (`src/types/album.ts`).

## 7. Agrupación en la interfaz

Fuente: `src/app/album/[id]/page.tsx:274-342`.

- Clave de grupo: `` `${year}-${String(month || 0).padStart(2, '0')}` ``, o
  `'no-date'`.
- Etiqueta: **"Mes de Año"** cuando hay mes, solo **Año** cuando no, y
  **"Sin fecha"** para el grupo sin fecha.
- Orden interno: `year * 100 + month`, descendente por defecto ( hay selector
  ascendente/descendente en el header del álbum).
- El grupo **"Sin fecha" se empuja siempre al final**, independientemente del
  orden elegido.
- El separador visual del grupo sin fecha es una línea tenue, sin encabezado
  estridente.

## 8. Casos borde

| Caso | Resultado |
|---|---|
| Nombre con año fuera de 1990..actual | Se ignora; continúa al siguiente patrón |
| Nombre con día 32 | Se ignora el patrón |
| Dos fechas en el nombre | Gana la primera que coincida |
| EXIF presente pero nombre con fecha | Gana el nombre |
| Video sin fecha | No se intenta EXIF; cae a `modifiedTime` o "Sin fecha" |
|Álbum sin año en el nombre y sin medios fechados | `year: null` |

## 9. Tests

Los módulos puros tienen cobertura unitaria:

- `src/lib/google-drive/date-extractor.test.ts` — patrones y validación.
- `src/lib/google-drive/exif.test.ts` — parseo del tag `DateTimeOriginal`.
- `src/lib/google-drive/mapper.test.ts` — año del álbum y mapeo de medios.

Última ejecución verificada (2026-11-20): **49 tests / 10 archivos, verdes**.

## 10. Referencias

- [`architecture.md`](./architecture.md) — capas y servicios.
- [`media-pipeline.md`](./media-pipeline.md) — por qué el EXIF se lee con `Range`.
- [`troubleshooting.md`](./troubleshooting.md) — fechas incorrectas y grouping.
