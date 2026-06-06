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

### `/api/media/[id]` (GET) - NUEVO

**Propósito:** Servir archivos multimedia (imágenes y videos) desde Google Drive.

**Parámetros:**
- `id`: ID del archivo en Google Drive

**Comportamiento:**
- Obtiene metadatos del archivo (MIME type, nombre)
- Redirige a `webContentLink` de Google Drive (sin proxying)
- Establece headers de caché agresivo (1 año, immutable)
- Habilita CORS

**Response (éxito):**
```
HTTP/1.1 302 Found
Location: https://drive.google.com/uc?id=...
Cache-Control: public, max-age=31536000, immutable
Access-Control-Allow-Origin: *
```

**Response (error):**
```json
{
  "error": "File not found"
}
```

### `/api/media/[id]/thumbnail` (GET) - NUEVO

**Propósito:** Servir miniaturas optimizadas de archivos multimedia.

**Parámetros:**
- `id`: ID del archivo en Google Drive
- `size` (query): `small` (200px, por defecto), `medium` (400px), `large` (800px)

**Comportamiento:**
- Obtiene thumbnail desde Google Drive metadata
- Modifica URL de thumbnail para solicitar dimensión específica
- Devuelve JPEG comprimido
- Caché de 1 año

**Response (éxito):**
```
HTTP/1.1 200 OK
Content-Type: image/jpeg
Cache-Control: public, max-age=31536000, immutable
[imagen JPEG binaria]
```

**Response (error):**
```json
{
  "error": "Failed to serve thumbnail"
}
```

### Otras APIs Existentes

- `/api/categories` (GET) - Lista todas las categorías
- `/api/categories/[id]/albums` (GET) - Lista álbumes de una categoría
- `/api/albums/[id]` (GET) - Obtiene un álbum específico con su media completa
- `/api/albums/[id]/media` (GET) - Lista media de un álbum

---

### Análisis: Streaming vs. Buffer Completo

**Decisión**: Mantener buffer completo (actual), no `ReadableStream` por ahora.

**Razón**:
- Google Drive API retorna `stream` que debe consumirse completamente
- Next.js Response API requiere `BodyInit` (que incluye Buffer)
- `ReadableStream` sería más complejo sin beneficio real para archivos típicos
- Archivos de imágenes/videos son generalmente < 50 MB en biblioteca digital personal
- Buffer en memoria es más simple y predecible

**Si escalamos a archivos > 100 MB**:
- Implementar streaming real con `ReadableStream`
- Usar `transformer` para comprimir mientras se descarga
- Implementar `Content-Range` para descargas resumibles

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

### Media (`src/types/media.ts`) - ACTUALIZADO

```typescript
export interface Media {
  id: string                    # ID del archivo en Google Drive
  type: 'image' | 'video'      # Tipo de contenido multimedia
  fileName: string              # Nombre original del archivo
  title?: string               # Título (por ahora, igual a fileName)
  date?: string                # Fecha de captura (futuro)
  width: number                # Ancho en píxeles
  height: number               # Alto en píxeles
  duration?: number            # Duración en segundos (solo videos)
  thumbnailUrl: string         # URL a /api/media/[id]/thumbnail
  mediaUrl: string             # URL a /api/media/[id]
}
```

**Cambios en esta fase:**
- Reemplazó `src` y `thumbnail` con `mediaUrl` y `thumbnailUrl` (URLs a APIs propias)
- Agregó dimensiones `width` y `height` desde Google Drive metadata
- Agregó `duration` para videos
- Eliminó dependencia de URLs de Google Drive públicas
- Todos los archivos ahora se sirven a través de `/api/media/` (permite proxying futuro)

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

## 🎨 Cambios en la Interfaz de Usuario (Fase Multimedia)

### Página Principal (/)

**Cambios realizados:**
1. ✅ Removido selector "Agrupar por Año/Categoría"
2. ✅ Removido buscador "Buscar recuerdos..."
3. ✅ Navegación ahora **solo por categorías**
4. ✅ Header simplificado mostrando solo el título

**Antes:**
```
Header
├── Título: "Biblioteca Rosana"
├── Buscador: "Buscar recuerdos..."
└── Selector: "Agrupar por" (Por Año / Por Categoría)

Contenido
├── Estantería por Año (2026)
│   └── Tarjetas de álbumes
└── Estantería por Año (2025)
    └── Tarjetas de álbumes
```

**Ahora:**
```
Header
└── Título: "Biblioteca Rosana" (centrado)

Contenido
├── Estantería "Categoría 1"
│   └── Tarjetas de álbumes
├── Estantería "Categoría 2"
│   └── Tarjetas de álbumes
└── Estantería "Categoría 3"
    └── Tarjetas de álbumes
```

### Página de Álbum (/album/[id])

**Cambios realizados:**
1. ✅ Grilla usa `thumbnailUrl` de API en lugar de URLs directas de Google Drive
2. ✅ Implementado lazy loading con `IntersectionObserver`
3. ✅ Las imágenes fuera de pantalla NO se cargan
4. ✅ Margen de previsualización: 100px (carga imágenes próximas a entrar en pantalla)
5. ✅ Componente `PolaroidPhoto` ahora es más eficiente

**Optimizaciones:**
```typescript
// Antes: Todas las imágenes se cargaban
<img src={album.coverImage} loading="lazy" />

// Ahora: Solo imágenes visibles
const [isVisible, setIsVisible] = useState(false)

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '100px' }
  )
  observer.observe(ref.current)
}, [])

{isVisible && <img src={thumbnailUrl} />}
```

### Visor a Pantalla Completa

**Características implementadas:**
1. ✅ Abre en pantalla completa (fondo negro)
2. ✅ Imagen/video centrado
3. ✅ Navegación lateral (flechas)
4. ✅ Swipe táctil (detecta y navega)
5. ✅ Videos con controles nativos
6. ✅ **Precargas inteligentes**: carga anterior, actual, siguiente
7. ✅ Cambio de media es instantáneo

**Precarga de media:**
```typescript
// Se precarga automáticamente:
// - mediaUrl del índice anterior
// - mediaUrl del índice actual
// - mediaUrl del índice siguiente

useEffect(() => {
  const indicesToPreload = [
    currentIndex - 1,
    currentIndex,
    currentIndex + 1,
  ].filter((idx) => idx >= 0 && idx < media.length)

  indicesToPreload.forEach((idx) => {
    const m = media[idx]
    if (m.type === 'image') {
      const img = new Image()
      img.onload = () => {
        setPreloadedImages((prev) => ({ ...prev, [m.id]: true }))
      }
      img.src = m.mediaUrl
    }
  })
}, [currentIndex, media, preloadedImages])
```

**Controles:**
- **Navegación**: Flechas ← →
- **Cerrar**: Esc o botón X
- **Swipe**: Deslizar izquierda (siguiente) o derecha (anterior)
- **Videos**: Controles nativos del navegador (sin autoplay)

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

## 🚀 Próximas Mejoras Planeadas

### Fase 6: Optimizaciones Avanzadas
- [ ] Implementar proxying real de media (en lugar de redirect)
- [ ] Caché de miniaturas en servidor
- [ ] Compresión de imágenes bajo demanda (WebP)
- [ ] Análisis de color dominante de portadas (para colores temáticos)

### Fase 7: Slideshow
- [ ] Modo presentación automática
- [ ] Transiciones suaves entre imágenes
- [ ] Buffer rotativo de precarga
- [ ] Control de duración por slide

### Fase 8: Búsqueda y Filtros
- [ ] Búsqueda full-text en nombres de archivos
- [ ] Filtro por tipo (solo imágenes, solo videos)
- [ ] Filtro por rango de fechas (futuro)

### Fase 9: Compartir y Exportar
- [ ] URLs públicas para compartir álbumes individuales
- [ ] Descarga de álbum completo (ZIP)
- [ ] Descarga de fotos individuales

### Fase 10: PWA y Offline
- [ ] Progressive Web App
- [ ] Service Worker para caché offline
- [ ] Sincronización en background

---

## 🔧 Mejoras Implementadas (Iteración 3)

### Optimizaciones de Rendimiento

#### 1. Thumbnails Realmente Optimizadas
- Implementación en dos niveles:
  1. **Primary**: Usa `thumbnailLink` de Google Drive (5-20 KB típicamente)
  2. **Fallback**: Comprime localmente con `sharp` (200x200 a 800x800 px)
- Compresión JPEG con calidad 80% y Progressive encoding
- Resultado: thumbnails ~10-50 KB vs imágenes originales de varios MB

#### 2. Caché de Thumbnails en Memoria
- `Map<string, Buffer>` con clave `{fileId}_{size}`
- Máximo 100 entradas (LRU simple)
- Evita regeneraciones repetidas
- Funciona con streaming interno

#### 3. Lazy Loading Mejorado
- `IntersectionObserver` con `rootMargin: 300px`
- Precarga imágenes 300px antes de entrar en pantalla
- Scroll suave sin saltos visuales
- Componentes HTML reducen-se hasta ser visibles

#### 4. Búsqueda Mejorada
- Búsqueda en tiempo real en categorías y álbumes
- Case-insensitive
- Filtra estantería completa reactivamente
- Sin peticiones adicionales (client-side puro)

#### 5. Ordenamiento Elegante
- Botón A↔Z integrado en Header
- Toggle entre ascendente y descendente
- Usa `localeCompare()` para orden alfabético español
- Respeta números naturales (IMG_2 antes que IMG_10)

#### 6. Thumbnails para Vídeos
- Si `thumbnailLink` existe: úsalo
- Si no: retorna 204 No Content
- Cliente muestra placeholder elegante con icono de reproducción
- Nunca espacios vacíos en grilla

## 🔧 Correcciones Realizadas (Iteración 2)

### Problema Identificado
Las imágenes no se mostraban porque:
1. La ruta `/api/media/[id]` estaba usando redirect a `webContentLink`, que no funciona para visualización
2. Las portadas estaban usando URLs directas de Google Drive en lugar de nuestras APIs
3. El streaming no era real, solo redireccionaba

### Soluciones Implementadas

#### 1. Streaming Real en `/api/media/[id]`
- Cambio: De redirect a streaming real
- Implementa Promise-based streaming que carga el buffer completo
- Retorna Content-Type correcto y headers de caché
- Elimina problemas de CORS

#### 2. Thumbnails Mejorado
- Intenta usar `thumbnailLink` de Google Drive primero
- Si no disponible, sirve el archivo completo (navegador lo escala)
- Soporta parámetro `size` para optimizar ancho de banda
- Fallback a streaming real

#### 3. Corrección de URLs de Portadas
- **Antes**: `https://drive.google.com/uc?id=${fileId}`
- **Ahora**: `/api/media/${fileId}/thumbnail`
- Las portadas ahora pasan por nuestro API

#### 4. Restauración de Búsqueda
- Restaurada barra de búsqueda en Header
- Busca en tiempo real en categorías y álbumes
- Completamente en cliente (sin backend)
- Selector "Categoría/Año" sigue eliminado

### Archivos Modificados
- `src/app/api/media/[id]/route.ts` - Streaming real
- `src/app/api/media/[id]/thumbnail/route.ts` - Thumbnails mejorado
- `src/lib/google-drive/service.ts` - URLs de portadas
- `src/components/layout/Header.tsx` - Búsqueda restaurada
- `src/app/page.tsx` - Lógica de búsqueda
- `README.md` - Actualización de documentación

## 🔧 Agrupación Cronológica en Álbumes (Iteración 4)

### Implementación

#### Extracción Inteligente de Años
- **Archivo**: `src/lib/google-drive/date-extractor.ts`
- **Función**: `extractYearFromMetadata()` - usa metadatos sin buffer
- **Función**: `extractYearFromMedia()` - puede leer EXIF si se descarga buffer
- **Prioridades**:
  1. EXIF DateTimeOriginal (para imágenes)
  2. Metadata de vídeo
  3. Patrón inequívoco en nombre (20\d{2})
  4. createdTime de Google Drive
  5. modifiedTime de Google Drive

#### Cambios en Mapper
- `mapToMediaItem()` ahora extrae `year` usando `extractYearFromMetadata()`
- Se pasan `createdTime` y `modifiedTime` desde Google Drive
- Campo `year?: number` agregado a tipo `Media`

#### Cambios en Service
- Solicitudes a Google Drive incluyen `createdTime, modifiedTime`
- Estos datos se pasan al mapper para análisis

#### Cambios en Componente de Álbum
- Agrupación `useMemo` de medios por año
- Grupo sin año (`year === null`) siempre al final
- Ordenamiento ascendente/descendente de grupos
- Selector de ordenamiento en header (A↔Z para años)
- Encabezado sutil (`border-b dashed`) para cada grupo de año

### Validación
- ✅ Compilación exitosa
- ✅ Sin cambios en arquitectura
- ✅ Lazy loading preservado
- ✅ Precarga en visor intacta
- ✅ No se descarga data innecesaria (todo client-side)

**Última actualización:** Enero 2025
**Versión del documento:** 1.3.0
**Última fase completada:** Agrupación Cronológica (Iteración 4)
