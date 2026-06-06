# 📚 Vestoria - Biblioteca Digital

Una biblioteca digital moderna diseñada para organizar, explorar y disfrutar de colecciones fotográficas y de video de forma elegante. Construida con Next.js y potenciada por Google Drive como único sistema de almacenamiento.

## 🎯 Objetivo

Crear una plataforma web intuitiva que permita a los usuarios organizar y visualizar sus recuerdos digitales, aprovechando la potencia de Google Drive como backend de almacenamiento, sin necesidad de base de datos adicional o infraestructura compleja.

## 📖 Filosofía del Proyecto

- **Google Drive es la fuente única de verdad**: Toda la información se obtiene directamente desde Google Drive. No hay base de datos persistente, sincronización, ni índices locales.
- **Simplicidad en la arquitectura**: Sin login, sin panel de administración, sin complejidad innecesaria. Solo una interfaz hermosa para tus recuerdos.
- **Escalabilidad sin servidor**: Aprovecha la infraestructura de Google Drive para escalar sin límites. Tus fotos se almacenan en Google, tu app en Vercel/Next.js.
- **Separación clara de capas**: El flujo de datos es lineal: Google Drive → API → Frontend. Cada capa tiene una única responsabilidad.

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| **Framework Frontend** | Next.js 16+ (App Router) |
| **Lenguaje** | TypeScript |
| **Estilos** | Tailwind CSS 4 |
| **Animaciones** | Framer Motion |
| **Backend** | API Routes (Node.js) |
| **Almacenamiento** | Google Drive |
| **Autenticación Drive** | Service Account (JWT) |
| **SDK Drive** | googleapis (oficial) |
| **Optimización de Imágenes** | sharp (compresión de thumbnails) |
| **Extracción de Metadatos** | exifr (lectura de EXIF, años de fotos) |

## 📁 Estructura de Carpetas

```
src/
├── app/
│   ├── api/
│   │   ├── test-drive/          # API de prueba para validar conexión
│   │   ├── categories/          # APIs de categorías
│   │   ├── albums/              # APIs de álbumes
│   │   └── media/               # APIs de multimedia
│   │       ├── [id]/
│   │       │   ├── route.ts     # GET /api/media/[id] - Servir media
│   │       │   └── thumbnail/
│   │       │       └── route.ts # GET /api/media/[id]/thumbnail
│   ├── album/
│   │   ├── layout.tsx
│   │   └── [id]/
│   │       └── page.tsx         # Página de álbum con galería
│   ├── globals.css
│   ├── layout.tsx               # Layout raíz
│   └── page.tsx                 # Página de inicio (biblioteca)
│
├── components/                  # Componentes React reutilizables
│   ├── layout/
│   │   └── Header.tsx           # Header simplificado (sin search)
│   ├── library/
│   │   └── AlbumCard.tsx        # Tarjeta de álbum
│   ├── ui/
│   │   └── TextureFilters.tsx   # Filtros visuales
│   ├── viewer/
│   │   └── FullscreenViewer.tsx # Visor a pantalla completa
│   └── index.ts                 # Exportaciones centralizadas
│
├── features/                    # Funcionalidades futuras (modular)
│   └── [feature-name]/
│       ├── hooks/
│       ├── components/
│       └── types/
│
├── hooks/                       # React Hooks personalizados
│   └── [hook-name].ts
│
├── lib/
│   ├── google-drive/            # Integración con Google Drive
│   │   ├── client.ts            # Cliente autenticado (JWT) - getDriveClient()
│   │   ├── mapper.ts            # Transformación Drive → Modelos internos
│   │   ├── service.ts           # Lógica de negocio (servicios principales)
│   │   └── index.ts             # Exportaciones
│   ├── cache/                   # Sistema de caché en memoria
│   │   ├── cache.interface.ts   # Interfaz ICache<T>
│   │   ├── memory.cache.ts      # Implementación MemoryCache
│   │   └── index.ts             # Instancias singleton
│   ├── utils/
│   │   └── cn.ts                # Utilidades de clases CSS
│   ├── index.ts
│   └── utils.ts
│
├── services/                    # Servicios generales (futuro)
│   └── [service-name].ts
│
├── types/                       # Modelos internos tipados
│   ├── album.ts                 # Modelo Album (basado en Google Drive)
│   ├── category.ts              # Modelo Category
│   ├── media.ts                 # Modelo Media (reemplaza MediaItem)
│   └── index.ts
│
└── constants/                   # Constantes globales
    ├── albums.ts                # [OBSOLETO] A eliminar
    └── index.ts
```

## 🚀 Instalación y Configuración

### 1. Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Una cuenta de Google Cloud con Drive API habilitada
- Un Service Account con credenciales JSON

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Configurar Google Drive

#### a. Crear un Service Account

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita la **Google Drive API**
4. Crea un **Service Account**
5. Genera una clave **JSON** privada

#### b. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Google Drive Configuration
GOOGLE_CLIENT_EMAIL=tu-email@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-clave-privada\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=tu-proyecto-id
GOOGLE_ROOT_FOLDER_ID=ID_DE_TU_CARPETA_RAIZ_EN_DRIVE
```

**Importante:**
- La `GOOGLE_PRIVATE_KEY` debe estar entrecomillada y contener `\n` literales para los saltos de línea
- El `GOOGLE_ROOT_FOLDER_ID` es el ID de la carpeta que contiene todas tus categorías

### 4. Compartir la Carpeta con el Service Account

1. Obtén el email del Service Account: `GOOGLE_CLIENT_EMAIL`
2. En Google Drive, comparte la carpeta raíz (`GOOGLE_ROOT_FOLDER_ID`) con ese email
3. Dale acceso de lectura

## 📂 Organización en Google Drive

La estructura en Google Drive debe seguir este patrón:

```
GOOGLE_ROOT_FOLDER_ID/
├── Momentos/                    # Categoría
│   ├── Tarde de Jardín/         # Álbum
│   │   ├── cover.jpg            # [Opcional] Portada del álbum
│   │   ├── foto1.jpg
│   │   ├── foto2.jpg
│   │   └── video1.mp4
│   └── Asado del Domingo/       # Otro álbum
│       ├── cover.png
│       ├── foto1.jpg
│       └── foto2.jpg
│
├── Viajes/                      # Otra categoría
│   ├── Vacaciones Playa/        # Álbum
│   │   ├── cover.webp
│   │   └── [fotos y videos]
│   └── Sierra/
│       └── [fotos y videos]
│
└── Eventos/                     # Otra categoría
    ├── Boda Ana y Pedro/
    │   └── [fotos y videos]
    └── [otros álbumes]
```

**Reglas:**
- **Primer nivel**: Son las **categorías** (carpetas)
- **Segundo nivel**: Son los **álbumes** (subcarpetas)
- **Tercer nivel**: Son los **archivos multimedia** (imágenes/videos)

### 5. Portadas de Álbum

Cada álbum puede contener una portada opcional:
- `cover.jpg`
- `cover.jpeg`
- `cover.png`
- `cover.webp`

Si hay múltiples coincidencias, se usa la primera encontrada. Si no existe portada, se usa la primera imagen del álbum.

## 🎬 Pipeline Multimedia

La aplicación implementa un sistema completo de servicio de multimedia desde Google Drive con optimización de ancho de banda y carga progresiva.

### API de Multimedia

#### GET /api/media/[id]
Sirve el archivo multimedia completo (imagen o video) desde Google Drive.
- **Parámetros**: ID del archivo (en la ruta)
- **Respuesta**: Stream de contenido (Buffer) con headers de caché
- **Cache**: 1 año (max-age=31536000)
- **Características**: Streaming real, no redirige (evita problemas de CORS), descarga bajo demanda

#### GET /api/media/[id]/thumbnail
Sirve una miniatura optimizada del archivo.
- **Parámetros**:
  - `id`: ID del archivo (en la ruta)
  - `size`: (query) `small` (200px, por defecto), `medium` (400px), `large` (800px)
- **Respuesta**: Imagen JPEG comprimida (~10-50 KB típicamente)
- **Cache**: 1 año + caché en memoria (máx. 100 entradas)
- **Características**:
  - Usa `thumbnailLink` de Google Drive cuando disponibles
  - Si no, comprime localmente con `sharp` (resize + JPEG 80% calidad)
  - Para vídeos sin thumbnail: retorna 204 (placeholder en cliente)
  - Caché en memoria evita regeneraciones repetidas

### Estrategia de Carga

1. **Biblioteca (página principal)**
   - Carga solo metadatos básicos de categorías
   - Carga solo portadas de álbumes (no contenido completo)
   - Uso de caché en memoria para evitar consultas repetidas

2. **Página de Álbum**
   - Carga lista completa de medios con metadatos (id, tipo, dimensiones, duración)
   - Renderiza solo miniaturas en grilla
   - Lazy loading con IntersectionObserver para imágenes fuera de pantalla

3. **Visor a Pantalla Completa**
   - Precargas inteligentes: anterior, actual, siguiente
   - Navegación con flechas, swipe táctil
   - Videos con controles nativos
   - Zoom automático para imágenes grandes

### Modelo Media

Cada archivo multimedia tiene la siguiente estructura:

```typescript
interface Media {
  id: string                    # ID del archivo en Google Drive
  type: 'image' | 'video'      # Tipo de media
  fileName: string              # Nombre original del archivo
  title?: string               # Título (igual a fileName por ahora)
  date?: string                # Fecha (futuro)
  width: number                # Ancho original
  height: number               # Alto original
  duration?: number            # Duración en segundos (solo videos)
  thumbnailUrl: string         # URL a /api/media/[id]/thumbnail
  mediaUrl: string             # URL a /api/media/[id]
}
```

### Caché en Memoria

Implementación optimizada con TTL (Time To Live):

- **Categorías**: 1 hora
- **Álbumes**: 1 hora
- **Media**: 30 minutos
- **Portadas**: 1 hora

El caché se invalida automáticamente tras expirar. Para invalidación manual:
```typescript
invalidateCategoryCache(categoryId)
invalidateAlbumCache(albumId)
invalidateAllCache()
```

### Optimizaciones Implementadas

✅ Streaming real de archivos desde Google Drive
✅ Thumbnails optimizadas (sharp) con caché en memoria
✅ Lazy loading de imágenes en grilla con IntersectionObserver (300px margin)
✅ Precargas de media en visor para navegación fluida
✅ Metadata completa (dimensiones, duración) sin descargar archivos
✅ Headers de caché agresivos (1 año, immutable)
✅ CORS habilitado para servir desde cualquier origen
✅ Ordenamiento alphabético en biblioteca y cronológico en álbumes
✅ Agrupación automática por año dentro de álbumes

## 📅 Organización Cronológica en Álbumes

Cada álbum agrupa automáticamente las fotografías y vídeos por año, utilizando esta prioridad:

1. **EXIF DateTimeOriginal** (para imágenes con metadatos originales)
2. **Metadata de grabación** (para vídeos)
3. **Patrón en nombre de archivo** (ej: IMG_20190523.jpg, Vacaciones_2020.jpg)
4. **createdTime de Google Drive**
5. **modifiedTime de Google Drive**

**Comportamiento especial:**
- Los medios sin año conocido se agrupan al final de forma discreta
- Selector ascendente/descendente en header del álbum
- Grupo sin año permanece siempre al final independientemente del orden
- Diseño integrado con estética del álbum papel

## 🏃 Desarrollo

### Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Probar la conexión a Google Drive

Visita `http://localhost:3000/api/test-drive` para validar que la autenticación es correcta. Deberías ver una respuesta JSON con el contenido de tu carpeta raíz.

### Compilar para producción

```bash
npm run build
```

## 🚀 Despliegue

### Desplegar en Vercel (recomendado)

1. Conecta tu repositorio a [Vercel](https://vercel.com)
2. Añade las variables de entorno en la configuración del proyecto
3. Vercel compilará y desplegará automáticamente

```bash
# O mediante CLI
npm install -g vercel
vercel
```

**Importante:** Vercel usa Node.js Runtime, que es compatible con nuestro backend integrado.

### Desplegar en otros hosting

Asegúrate de que el hosting soporta:
- Next.js 16+
- Node.js 18+
- Variables de entorno

## 📊 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                      USUARIO EN NAVEGADOR                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js/React)                       │
│  - Componentes visuales (Header, AlbumCard, Viewer)             │
│  - Manejo de estado (búsqueda, filtros)                         │
│  - Llamadas a API Routes                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ↓                         ↓
    ┌──────────────────┐    ┌──────────────────────┐
    │  API Routes      │    │  Static Files        │
    │  (Node.js)       │    │  (CSS, JS bundle)    │
    └────────┬─────────┘    └──────────────────────┘
             │
             ↓
    ┌──────────────────────────────────────────────┐
    │      Google Drive Integration Layer           │
    │                                              │
    │  ┌─────────────────────────────────────────┐ │
    │  │ client.ts: Autenticación JWT            │ │
    │  │ - Inicializa cliente googleapis         │ │
    │  │ - Maneja credenciales del Service Acc.  │ │
    │  └─────────────────────────────────────────┘ │
    │                      ↓                        │
    │  ┌─────────────────────────────────────────┐ │
    │  │ service.ts: Lógica de Negocio           │ │
    │  │ - getCategories()                       │ │
    │  │ - getAlbums()                           │ │
    │  │ - getMedia()                            │ │
    │  │ - listFolderContents()                  │ │
    │  └─────────────────────────────────────────┘ │
    │                      ↓                        │
    │  ┌─────────────────────────────────────────┐ │
    │  │ mapper.ts: Transformación de Datos      │ │
    │  │ - Convierte Drive Files → Album         │ │
    │  │ - Convierte Drive Files → MediaItem     │ │
    │  │ - Valida tipos MIME                     │ │
    │  │ - Detecta portadas (cover.*)            │ │
    │  └─────────────────────────────────────────┘ │
    └──────────────────┬───────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │     GOOGLE DRIVE             │
        │                              │
        │ - Almacenamiento de archivos │
        │ - Estructura de carpetas     │
        │ - Metadatos de archivos      │
        └──────────────────────────────┘
```

## 🔐 Seguridad

- **No hay acceso público**: Solo el Service Account autenticado accede a Google Drive
- **No hay credenciales en frontend**: Las credenciales están solo en variables de entorno del servidor
- **Lectura solo**: El Service Account solo tiene permisos de lectura (`drive.readonly`)
- **CORS habilitado**: Las API Routes pueden ser consumidas desde el frontend

## 📈 Arquitectura y Decisiones

Para una documentación detallada sobre las decisiones arquitectónicas, ver [AI_CONTEXT.md](./AI_CONTEXT.md).

## 🔮 Mejoras Futuras

- **Caché inteligente**: Implementar caché de metadatos para reducir llamadas a Google Drive
- **Búsqueda avanzada**: Búsqueda full-text dentro de los álbumes
- **Compartir álbumes**: URL públicas para compartir colecciones específicas
- **Resumen de colores dominantes**: Análisis visual de portadas para diseño adaptativo
- **Exportación**: Descargar álbumes completos en ZIP
- **Estadísticas**: Gráficos sobre colecciones (fotos por categoría, etc.)
- **Sincronización en tiempo real**: WebSockets para cambios simultáneos en Drive
- **Generación de miniaturas**: Service Worker para precargar imágenes
- **Soporte móvil mejorado**: Progressive Web App (PWA)
- **Comparación de fechas**: Detectar automáticamente fechas de archivos

## 📝 Licencia

Privado - Agustín Sandoval

## 👨‍💻 Desarrollo Continuo

Este proyecto está en desarrollo activo. Para cambios no previstos o decisiones de arquitectura, ver [AI_CONTEXT.md](./AI_CONTEXT.md).

---

**Última actualización**: Junio 2026  
**Versión**: 0.1.0
