import type { drive_v3 } from 'googleapis'
import { exifDateCache } from '@/lib/cache'
import { mapWithConcurrency } from '@/lib/utils/concurrency'
import { extractDateTimeOriginal, type ExifDate } from './exif'

/** Primeros 64 KB: suficiente para el segmento APP1 en fotos de cámara/iPhone. */
const EXIF_RANGE_BYTES = 64 * 1024

/** Tope de lecturas por request; el resto queda con la fecha de Drive. */
export const MAX_EXIF_LOOKUPS_PER_REQUEST = 20

const EXIF_CONCURRENCY = 4

/**
 * Lee `DateTimeOriginal` para archivos sin fecha en el nombre.
 * Cachea por `id+modifiedTime` (re-subir el archivo invalida la entrada).
 */
export async function readExifDates(
  drive: drive_v3.Drive,
  files: drive_v3.Schema$File[]
): Promise<Map<string, ExifDate>> {
  const eligible = files
    .filter((file) => file.id)
    .slice(0, MAX_EXIF_LOOKUPS_PER_REQUEST)

  const dates = new Map<string, ExifDate>()

  await mapWithConcurrency(eligible, EXIF_CONCURRENCY, async (file) => {
    const fileId = file.id!

    const date = await readExifDate(drive, fileId, file.modifiedTime ?? undefined)

    if (date) {
      dates.set(fileId, date)
    }

    return null
  })

  return dates
}

async function readExifDate(
  drive: drive_v3.Drive,
  fileId: string,
  modifiedTime?: string
): Promise<ExifDate | null> {
  const cacheKey = `${fileId}:${modifiedTime ?? ''}`
  const cached = exifDateCache.get(cacheKey)

  if (cached !== undefined) {
    return cached
  }

  try {
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      {
        responseType: 'arraybuffer',
        headers: { Range: `bytes=0-${EXIF_RANGE_BYTES - 1}` },
      }
    )

    const buffer = Buffer.from(response.data as ArrayBuffer)
    const date = extractDateTimeOriginal(buffer)

    exifDateCache.set(cacheKey, date, 3600000)
    return date
  } catch (error) {
    console.warn(`EXIF read failed for ${fileId}`, error)
    exifDateCache.set(cacheKey, null, 3600000)
    return null
  }
}
