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

function getEnvVarOptional(key: string): string | undefined {
  return process.env[key]
}

/**
 * Configuración de Google Drive
 * Se valida lazy solo cuando se accede a estas propiedades
 */
export const env = {
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
