import { google } from 'googleapis'
import { env } from '@/config/env'

let driveInstance: ReturnType<typeof google.drive> | null = null

/**
 * Obtiene una instancia autenticada del cliente de Google Drive
 * Valida variables de entorno en el momento de la llamada
 * Mantiene una instancia singleton para reutilizar la conexión
 *
 * @throws Error si faltan variables de entorno requeridas
 */
export function getDriveClient() {
  if (driveInstance) {
    return driveInstance
  }

  const auth = new google.auth.JWT({
    email: env.google.clientEmail,
    key: env.google.privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })

  driveInstance = google.drive({ version: 'v3', auth })
  return driveInstance
}
