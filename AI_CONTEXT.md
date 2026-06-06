# 🤖 AI_CONTEXT.md - Contexto Arquitectónico del Proyecto Vestoria

Este documento contiene todas las decisiones arquitectónicas, reglas de desarrollo, convenciones y contexto que debe conocer cualquier IA o desarrollador que continúe este proyecto en el futuro.

## 📌 Información General

- **Proyecto**: Vestoria - Biblioteca Digital
- **Stack**: Next.js 16+ (App Router), TypeScript, Tailwind CSS, googleapis
- **Versión Actual**: 0.1.0
- **Estado**: En desarrollo activo
- **Última Actualización**: Enero 2025

---

## 🏗️ Arquitectura General

### Filosofía Fundamental

**Google Drive es la única fuente de verdad.**

- No existe base de datos relacional
- No existe índice persistente local
- No existe sincronización de datos
- Toda la información se obtiene en tiempo real desde Google Drive

**Consecuencias:**
- Más simple: Sin gestión de datos, sin migraciones
- Más escalable: Delegamos almacenamiento a Google
- Más lento: Cada solicitud requiere consultar Drive (futuro: caché)
- Más seguro: No hay datos sensibles en nuestros servidores

### Flujo de Datos Linear

```
Google Drive API
        ↓
client.ts (Autenticación JWT)
        ↓
service.ts (Lógica de negocio)
        ↓
mapper.ts (Transformación)
        ↓
API Routes (Respuestas HTTP)
        ↓
Frontend (React Components)
```

**Regla crítica:** El frontend NUNCA debe depender directamente del formato de Google Drive. Siempre debe pasar por las capas intermedias.

---

## 📁 Estructura de Carpetas en Google Drive

### Patrón Esperado

```
GOOGLE_ROOT_FOLDER_ID/
├── Categoría 1/           # Primer nivel: CATEGORÍAS
│   ├── Álbum 1/           # Segundo nivel: ÁLBUMES
│   │   ├── cover.jpg      # [Opcional] Portada
│   │   ├── foto1.jpg      # Tercer nivel: ARCHIVOS
│   │   ├── foto2.jpg
│   │   └── video1.mp4
│   └── Álbum 2/
│       ├── cover.png
│       └── [archivos]
├── Categoría 2/
│   └── [álbumes y archivos]
└── Categoría 3/
    └── [álbumes y archivos]
```

### Convenciones

1. **Nombres sensibles a mayúsculas/minúsculas**: Google Drive los preserva, el código debe respetarlos
2. **Portadas especiales**: Deben llamarse exactamente `cover.{jpg|jpeg|png|webp}`
3. **Primer match**: Si hay múltiples portadas, usar la primera en orden alfabético
4. **Fallback**: Si no existe portada, usar la primera imagen del álbum ordenada alfabéticamente
5. **No hay archivos en raíz**: Solo carpetas de categoría en GOOGLE_ROOT_FOLDER_ID

---

## 🔑 Capas de Integración

### 1. **client.ts** - Autenticación Lazy (Validación en Llamada)

**Responsabilidad única:** Proveer una instancia autenticada del cliente Google Drive.

**Implementación:**
```typescript
export function getDriveClient() {
  // Validación ocurre SOLO cuando se llama
  // No al importar el módulo

  // Valida:
  // - GOOGLE_PROJECT_ID
  // - GOOGLE_CLIENT_EMAIL
  // - GOOGLE_PRIVATE_KEY

  // Reconstruye: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  // Crea JWT auth con scopes: drive.readonly
  // Retorna: google.drive({ version: 'v3', auth })

  // Implementa patrón singleton: reutiliza instancia
}
```

**Ventajas de validación lazy:**
- Importar el módulo nunca causa errores
- Errores ocurren solo cuando se intenta usar Drive
- Facilita testing sin Google Drive
- Permite inicializar variables de entorno dinámicamente

**Variables de entorno requeridas en momento de llamada:**
- `GOOGLE_PRIVATE_KEY`: Clave privada del Service Account
- `GOOGLE_CLIENT_EMAIL`: Email del Service Account
- `GOOGLE_PROJECT_ID`: ID del proyecto Google Cloud

---

### 2. **service.ts** - Lógica de Negocio

**Responsabilidad única:** Implementar la lógica de obtención de datos y negocio.

**Funciones preparadas (algunas no implementadas aún):**

```typescript
getCategories()         // Obtener todas las categorías
getAlbums(categoryId?)  // Obtener álbumes de una categoría
getAlbum(albumId)       // Obtener un álbum específico
getMedia(albumId)       // Obtener archivos de un álbum
getAlbumCover(albumId)  // Obtener portada de un álbum
listFolderContents()    // Listar contenido de una carpeta (IMPLEMENTADA)
```

**Lo que sí está implementado:**
- `listFolderContents(folderId)`: Usa `drive.files.list()` con query básica
  - Filtra carpeta específica: `'${folderId}' in parents and trashed=false`
  - Ordena por nombre alfabéticamente (por defecto de Google)
  - Retorna: `id`, `name`, `mimeType`, `webContentLink`, `thumbnailLink`

**Lógica de portadas (preparada para implementación):**
1. Listar archivos de la carpeta del álbum
2. Filtrar archivos que coincidan con `/^cover\.(jpg|jpeg|png|webp)$/i`
3. Si hay coincidencias, usar la primera
4. Si no hay portadas, usar la primera imagen alfabéticamente
5. **Futuro**: Caché esta búsqueda para no repetirla

---

### 3. **mapper.ts** - Transformación de Datos

**Responsabilidad única:** Convertir datos de Google Drive a nuestros modelos.

**Funciones disponibles:**

```typescript
mapToMediaItem()     // Convierte Google Drive File → MediaItem
mapToAlbum()         // Convierte Google Drive Folder → Album
isMediaFile()        // Valida si archivo es imagen/video
isCoverFile()        // Valida si archivo es portada (cover.*)
getMediaType()       // Detecta si es 'image' o 'video'
```

**MIME types soportados:**
- Imágenes: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Videos: `video/mp4`, `video/quicktime`, `video/x-msvideo`

**Importante:** Estos mappers aún no están implementados. Cuando se implementen, NUNCA expondrán directamente datos de Google Drive al frontend.

---

## 🛣️ API Routes

### `/api/test-drive` (GET)

**Propósito:** Validar que la autenticación con Google Drive funciona.

**Response (éxito):**
```json
{
  "success": true,
  "message": "Successfully connected to Google Drive",
  "rootFolderId": "...",
  "itemCount": 3,
  "items": [
    { "id": "...", "name": "Momentos", "mimeType": "application/vnd.google-apps.folder" },
    { "id": "...", "name": "Viajes", "mimeType": "application/vnd.google-apps.folder" },
    { "id": "...", "name": "Eventos", "mimeType": "application/vnd.google-apps.folder" }
  ]
}
```

**Response (error):**
```json
{
  "success": false,
  "error": "Failed to connect to Google Drive",
  "details": "[Descripción del error]"
}
```

**Runtime:** Explícitamente `export const runtime = "nodejs"` (no Edge)

---

## 🔒 Seguridad y Consideraciones

### Runtime Node.js Obligatorio

Todas las API Routes de Google Drive DEBEN usar:
```typescript
export const runtime = 'nodejs'
```

**Razón:** Google Drive API requiere acceso a variables de entorno y puede necesitar operaciones que no soporta Edge Runtime.

### Credenciales Seguras

1. **Nunca expongas credenciales al frontend**: Las claves privadas viven SOLO en `.env.local` del servidor
2. **Service Account solo lectura**: Tiene permisos `drive.readonly`, no puede crear/modificar/eliminar
3. **Compartir carpeta explícitamente**: La carpeta raíz debe ser compartida con el email del Service Account

### Rate Limiting (Futuro)

Google Drive API tiene límites:
- 1.000.000 de solicitudes por día por usuario
- Con caché, esto se vuelve un no-problema

**Implementar caché es CRÍTICO para escalabilidad.**

---

## 🧹 Sistema de Caché (Implementado)

### Arquitectura Preparada

Se ha implementado una infraestructura de caché modular y extensible:

**Interfaz base** (`src/lib/cache/cache.interface.ts`):
```typescript
interface ICache<T> {
  get(key: string): T | undefined
  set(key: string, value: T, ttl?: number): void
  delete(key: string): boolean
  clear(): void
  stats(): { size: number; keys: string[] }
}
```

**Implementación en memoria** (`src/lib/cache/memory.cache.ts`):
- Almacenamiento simple en memoria
- Soporte para TTL (Time To Live)
- Expiración automática de valores obsoletos
- Métodos para debugging y estadísticas

**Instancias singleton** (`src/lib/cache/index.ts`):
```typescript
export const categoryCache = new MemoryCache<Category[]>()
export const albumCache = new MemoryCache<Album[]>()
export const mediaCache = new MemoryCache<Media[]>()
export const coverCache = new MemoryCache<string>()
```

### Próximas Fases de Integración

1. **Fase 4a**: Integrar caché en `service.ts`
   - Envolver `getCategories()` con `categoryCache`
   - Envolver `getAlbums()` con `albumCache`
   - Envolver `getMedia()` con `mediaCache`

2. **Fase 4b**: Política de invalidación
   - TTL de 1 hora para categorías/álbumes (cambios infrecuentes)
   - TTL de 30 minutos para media (cambios más frecuentes)
   - Invalidación manual por webhook (futuro)

3. **Fase 4c**: Almacenamiento persistente
   - Migrar a Redis para producción
   - Sincronización entre instancias

### Portadas (Cover Detection)

**Lógica preparada en `mapper.ts`:**
- `isCoverFile()` - Detecta archivos `cover.*`
- `getAlbumCover()` - Implementación futura en `service.ts`

**Algoritmo esperado:**
1. Listar archivos del álbum
2. Buscar `cover.{jpg|jpeg|png|webp}`
3. Si existe, usar el primero alfabéticamente
4. Si no existe, usar primer archivo multimedia alfabéticamente
5. Guardar en `coverCache` con TTL para evitar búsquedas repetitivas

---

## 📐 Modelos Internos Tipados (Implementados)

### Album (`src/types/album.ts`)

```typescript
import type { Media } from './media'

export interface Album {
  id: string
  title: string
  year: number
  category: string
  coverImage: string
  description?: string
  mediaCount: number
  media: Media[]
  dominantColor: { h: number; s: number; l: number }
}
```

### Category (`src/types/category.ts`)

```typescript
export interface Category {
  id: string
  name: string
  albumCount: number
}
```

### Media (`src/types/media.ts`)

```typescript
export interface Media {
  id: string
  type: 'image' | 'video'
  src: string
  thumbnail?: string
  title?: string
  date?: string
  fileName: string
}
```

**Notas sobre refactoring:**
- `Media` reemplaza el anterior `MediaItem`
- Alias de compatibilidad: `export { Media as MediaItem }`
- Se eliminó archivo obsoleto `src/types/albums.ts`
- Modelos internos NUNCA exponen directamente datos de Google Drive

---

## 🎯 Convenciones de Código

### Nombres de Componentes

- PascalCase para React components: `Header.tsx`, `AlbumCard.tsx`
- camelCase para funciones y variables
- SCREAMING_SNAKE_CASE solo para constantes globales verdaderas

### Organización de Carpetas

Seguir el patrón Feature-based cuando es posible:
```
components/
├── layout/              # Componentes de estructura
├── library/             # Componentes de biblioteca
├── ui/                  # Componentes genéricos
├── viewer/              # Componentes de visualización
└── index.ts
```

### Importaciones

Usar path aliases:
```typescript
import { Album } from '@/types'
import { getAlbums } from '@/lib/google-drive'
import { Header } from '@/components'
```

No imports relativos: `../../components/Header` ❌

---

## 🚀 Próximas Implementaciones

### Fase 2: Implementar Mappers

1. **mapToAlbum()**: Convertir carpeta → Album
   - Obtener nombre de la carpeta → `title`
   - Extraer año del nombre o metadatos
   - Categoría del padre
   - Llamar a `getAlbumCover()` → `coverImage`
   - Llamar a `getMedia()` → `media`

2. **mapToMediaItem()**: Convertir archivo → MediaItem
   - Filename → `title`
   - Drive fileId → `id`
   - Detectar tipo con `getMediaType()`
   - Generar URLs de Google Drive

3. **Lógica de portadas**
   - En `getAlbumCover()`, implementar búsqueda y fallback

### Fase 3: Implementar Servicios

1. **getCategories()**: Listar carpetas de primer nivel
2. **getAlbums()**: Listar carpetas de segundo nivel
3. **getMedia()**: Listar archivos multimedia de un álbum

### Fase 4: Sistema de Caché

1. Implementar `src/lib/cache/` con estrategia de invalidación
2. Caché de metadatos (no contenido, que ya está en Google Drive)
3. Tiempos de TTL (Time To Live)
4. Invalidación manual si es necesario

### Fase 5: UI Avanzada

1. Viewer a pantalla completa
2. Galería de imágenes
3. Reproducción de videos
4. Filtros de búsqueda avanzada

---

## 🐛 Debugging

### Activar Logs

```typescript
console.log('Debug info:', data)
```

Los logs de API Routes aparecen en:
- **Local**: Terminal donde corrió `npm run dev`
- **Vercel**: Dashboard Vercel → Logs → Functions

### Validar Conexión

```bash
curl http://localhost:3000/api/test-drive
```

Debería retornar JSON con éxito.

### Validar Variables de Entorno

```typescript
// En client.ts se validan automáticamente
// Si no existen, lanza error claro al compilar
```

---

## 🗑️ Eliminación de Sistema de Mocks (Consolidación)

### Archivos Eliminados

- `src/constants/albums.ts` - Datos mock de álbumes de prueba
- `src/constants/index.ts` - Exportaciones de constantes
- `src/types/albums.ts` - Tipos duplicados (consolidados en `album.ts`)

### Por qué se eliminaron

- Vestoria ahora obtiene TODOS los datos de Google Drive
- No hay coexistencia de dos fuentes de datos
- Código más limpio y mantenible
- Eliminados conflictos de tipo (Album duplicado)

### Archivos Afectados (Refactorizados)

- `src/app/page.tsx` - Removidos imports de `@/constants`, ahora muestra estado transitorio
- `src/app/album/[id]/page.tsx` - Removidos imports de `@/constants`, preparado para cargar desde Drive

### Estado Actual

- Frontend está "preparado para recibir datos"
- Páginas muestran mensajes "En construcción" apropiados
- No hay residuos de lógica mock en el código
- Próxima fase: Implementar funciones de `service.ts`

---

## ⚖️ Decisiones Importantes y Sus Motivos

### ¿Por qué Google Drive y no una Base de Datos?

**Motivos:**
1. **Simplicidad**: Los usuarios ya tienen Google Drive, no necesitan otro servicio
2. **Costo**: Google Drive es gratis (hasta cierto límite), base de datos cuesta dinero
3. **Gestión**: Sin tablas, migraciones, backups. Todo lo maneja Google
4. **Escalabilidad**: Google maneja petabytes de datos, nosotros solo leemos

**Desventajas:**
- Más lento: Cada consulta es una llamada HTTP a Google
- Menos control: No podemos indexar, no podemos hacer queries complejas
- **Solución**: Caché estratégico en futuras fases

### ¿Por qué sin Login/Panel Admin?

**Motivos:**
1. **Simplicidad**: Es una visualizador, no editor
2. **Seguridad**: Sin UI pública, sin puntos de ataque
3. **Privacidad**: Solo quien tenga la URL ve el contenido
4. **Mantenimiento**: Sin autenticación, sin gestión de usuarios

**Si queremos multi-usuario futuro:** Habría que repensar esta arquitectura.

### ¿Por qué Service Account y no OAuth?

**Motivos:**
1. **Sin interacción**: Service Account = credenciales estáticas, no requiere login del usuario
2. **Automático**: Ideal para aplicaciones backend-only
3. **Seguro**: Google Cloud IAM maneja permisos

**OAuth sería si:** Queremos que el usuario autorice, no que nosotros tengamos credenciales permanentes.

### ¿Por qué Node.js Runtime?

**Motivos:**
1. **google-sdk es Node**: La librería googleapis está optimizada para Node.js
2. **Credenciales**: Necesitamos acceder a `process.env`, que no funciona en Edge Runtime
3. **Operaciones síncronas**: Algunas operaciones pueden requerir sincronización que Edge no soporta

**Edge Runtime de Next.js:** Es más rápido pero limitado. Nuestro backend integrado es simple, Node.js es la mejor opción.

### ¿Por qué estructura feature-based en componentes?

**Motivos:**
1. **Mantenibilidad**: Components agrupados por funcionalidad
2. **Escalabilidad**: Fácil agregar nuevas features sin tocar las viejas
3. **Claridad**: Alguien nuevo entiende rápido qué components existen

---

## 📋 Reglas para Agregar Funcionalidades

### Regla 1: Respeta las Capas

```typescript
// ✅ CORRECTO
// En API Route:
import { getAlbums } from '@/lib/google-drive'
const albums = await getAlbums(categoryId)

// ❌ INCORRECTO
// En API Route, llamar directamente a Google Drive:
const response = await drive.files.list(...)
```

### Regla 2: Siempre Mapea

```typescript
// ✅ CORRECTO
const driveFiles = await listFolderContents(folderId)
const mediaItems = driveFiles.map(f => mapToMediaItem(f, albumId))

// ❌ INCORRECTO
// Devolver datos de Google directamente al frontend:
return Response.json(driveFiles)
```

### Regla 3: Documenta Futuras Implementaciones

```typescript
/**
 * Obtiene todas las imágenes de un álbum.
 * Implementación futura: agregar filtros por fecha, tipo, etc.
 */
export async function getMedia(_albumId: string): Promise<MediaItem[]> {
  // TODO: implementar
  return []
}
```

### Regla 4: Mantén Tipos Actualizados

Toda nueva función debe tener:
- Tipos de entrada bien definidos
- Tipos de salida bien definidos
- Documentación JSDoc

### Regla 5: Valida en Boundaries

```typescript
// ✅ CORRECTO
// En API Route, validar que userId existe
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return Response.json({ error: '...' }, { status: 400 })
  // Luego confía que service.ts hará lo correcto
}

// ❌ INCORRECTO
// Validar en service.ts, que es solo lógica interna
export async function getAlbum(id: string) {
  if (!id) throw new Error('...')
}
```

---

## 🧪 Testing

**No existe suite de tests todavía.**

Cuando se agregue testing:
- Usar Jest o Vitest
- Tests unitarios para mappers
- Tests de integración para servicios
- NO mockear Google Drive en tests: usar carpeta de prueba real o fixtures

---

## 📚 Referencias Externas

- [Google Drive API v3](https://developers.google.com/drive/api/v3/about-sdk)
- [googleapis NPM](https://www.npmjs.com/package/googleapis)
- [Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Next.js 16 Documentation](https://nextjs.org/docs)

---

## 💡 Notas Finales

Este proyecto está diseñado para ser **mantenible, escalable y fácil de entender** para futuras IAs y desarrolladores.

**Si encuentras algo confuso:**
1. Revisa esta documentación
2. Revisa los comentarios en el código
3. Revisa el archivo README.md

**Si necesitas hacer cambios arquitectónicos:**
1. Actualiza esta documentación
2. Notifica en los PR (pull request)
3. Mantén la separación de capas

**Filosofía:** Simple es mejor que complejo. Claro es mejor que mágico.

---

**Última actualización:** Enero 2025  
**Versión del documento:** 1.0.0
