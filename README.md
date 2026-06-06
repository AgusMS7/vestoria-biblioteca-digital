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

## 📁 Estructura de Carpetas

```
src/
├── app/
│   ├── api/
│   │   └── test-drive/          # API de prueba para validar conexión
│   │       └── route.ts
│   ├── album/                   # Rutas dinámicas para álbumes individuales
│   │   └── layout.tsx
│   ├── globals.css
│   ├── layout.tsx               # Layout raíz
│   └── page.tsx                 # Página de inicio (biblioteca)
│
├── components/                  # Componentes React reutilizables
│   ├── layout/                  # Componentes de estructura
│   │   └── Header.tsx
│   ├── library/                 # Componentes de la biblioteca
│   │   └── AlbumCard.tsx
│   ├── ui/                      # Componentes de utilidad UI
│   │   └── TextureFilters.tsx
│   ├── viewer/                  # Componentes de visualización
│   │   └── FullscreenViewer.tsx
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

Privado - Proyecto personal

## 👨‍💻 Desarrollo Continuo

Este proyecto está en desarrollo activo. Para cambios no previstos o decisiones de arquitectura, ver [AI_CONTEXT.md](./AI_CONTEXT.md).

---

**Última actualización**: Enero 2025  
**Versión**: 0.1.0
