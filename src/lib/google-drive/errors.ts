/**
 * Error de dominio: el recurso pedido no existe en Google Drive.
 * La capa HTTP lo traduce a 404; cualquier otro error sigue siendo 500.
 */
export class DriveNotFoundError extends Error {
  readonly code = 'DRIVE_NOT_FOUND'

  constructor(message = 'Drive resource not found') {
    super(message)
    this.name = 'DriveNotFoundError'
  }
}

type DriveErrorShape = {
  code?: number | string
  response?: { status?: number }
}

/** Extrae el status HTTP de un error de googleapis/gaxios, si lo tiene. */
export function getDriveErrorStatus(error: unknown): number | undefined {
  const candidate = error as DriveErrorShape | null

  if (!candidate || typeof candidate !== 'object') {
    return undefined
  }

  if (typeof candidate.response?.status === 'number') {
    return candidate.response.status
  }

  return typeof candidate.code === 'number' ? candidate.code : undefined
}

export function isDriveNotFoundError(error: unknown): boolean {
  return error instanceof DriveNotFoundError || getDriveErrorStatus(error) === 404
}

/** Re-lanza el error de Drive como DriveNotFoundError cuando es un 404. */
export function rethrowDriveError(error: unknown): never {
  if (isDriveNotFoundError(error)) {
    throw new DriveNotFoundError()
  }

  throw error
}
