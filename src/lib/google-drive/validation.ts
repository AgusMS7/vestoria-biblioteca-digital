/**
 * Valida que un ID de Google Drive tenga un formato plausible
 * antes de consultar la API de Drive.
 */
export function isValidDriveId(id: string): boolean {
  return /^[A-Za-z0-9_-]{10,}$/.test(id)
}
