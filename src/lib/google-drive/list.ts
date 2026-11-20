import type { drive_v3 } from 'googleapis'

/**
 * Tope de páginas por listado (~50.000 archivos con pageSize 1000).
 * Evita un loop infinito si Drive devolviera el mismo nextPageToken.
 */
export const MAX_LIST_PAGES = 50

/**
 * Recorre `nextPageToken` hasta agotar el listado de Drive.
 * Sin esto, una carpeta de más de `pageSize` archivos se truncaba en silencio.
 */
export async function listAllFiles(
  drive: drive_v3.Drive,
  params: drive_v3.Params$Resource$Files$List
): Promise<drive_v3.Schema$File[]> {
  const files: drive_v3.Schema$File[] = []
  const seenTokens = new Set<string>()
  let pageToken: string | undefined

  for (let page = 0; page < MAX_LIST_PAGES; page++) {
    const response = await drive.files.list({ ...params, pageToken })
    const pageFiles = response.data.files ?? []

    files.push(...pageFiles)

    const nextPageToken = response.data.nextPageToken ?? undefined

    if (!nextPageToken || seenTokens.has(nextPageToken)) {
      break
    }

    seenTokens.add(nextPageToken)
    pageToken = nextPageToken
  }

  return files
}
