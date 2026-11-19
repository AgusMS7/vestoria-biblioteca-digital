/**
 * Módulo centralizado de configuración
 * Este es el ÚNICO archivo que debe acceder directamente a process.env
 * Todos los demás módulos deben importar desde aquí
 */

function getEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Environment variable ${key} is not defined. Check your .env.local file.`
    )
  }
  return value
}

const DEFAULT_SITE_NAME = 'Vestoria'

function getEnvVarOrDefault(key: string, fallback: string): string {
  return process.env[key] || fallback
}

/**
 * Indica si las credenciales de Google Drive están configuradas.
 * No lanza: permite responder con un error controlado cuando faltan.
 */
export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_PROJECT_ID &&
      process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_ROOT_FOLDER_ID
  )
}

/**
 * Configuración de Google Drive
 * Se valida lazy solo cuando se accede a estas propiedades
 */
export const env = {
  site: {
    /**
     * Nombre visible de la marca. Por defecto 'Vestoria'; cada deploy puede
     * pisarlo con SITE_NAME (el del cliente usa 'Biblioteca Rosanna').
     */
    get name(): string {
      return getEnvVarOrDefault('SITE_NAME', DEFAULT_SITE_NAME)
    },
  },
  auth: {
    /**
     * Interruptor opcional de Basic Auth. Si alguno falta, no se aplica.
     * Se leen con acceso estático para que Next las resuelva también en el
     * runtime Edge del middleware.
     */
    get user(): string | undefined {
      return process.env.SITE_AUTH_USER
    },
    get pass(): string | undefined {
      return process.env.SITE_AUTH_PASS
    },
  },
  google: {
    get projectId(): string {
      return getEnvVar('GOOGLE_PROJECT_ID')
    },

    get clientEmail(): string {
      return getEnvVar('GOOGLE_CLIENT_EMAIL')
    },

    /**
     * Retorna la clave privada ya reconstruida
     * (convierte \n literales en saltos de línea reales)
     */
    get privateKey(): string {
      const key = getEnvVar('GOOGLE_PRIVATE_KEY')
      return key.replace(/\\n/g, '\n')
    },

    get rootFolderId(): string {
      return getEnvVar('GOOGLE_ROOT_FOLDER_ID')
    },
  },
}
