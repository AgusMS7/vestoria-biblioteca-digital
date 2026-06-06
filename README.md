# Biblioteca Rosana — Álbumes Familiares

Una biblioteca vintage de álbumes de fotos familiares construida con Next.js 16 + TypeScript.

## Características

- 📚 Galería de álbumes con diseño vintage estilo madera
- 🔍 Búsqueda y filtrado por año/categoría
- 🖼️ Visor fullscreen con soporte para imágenes y videos
- 🎬 Presentación automática (slideshow)
- 🎨 Diseño responsivo con animaciones fluidas
- 📦 TypeScript strict, optimizado para producción

## Tecnologías

- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4 + CSS personalizado
- **Animaciones**: Framer Motion
- **UI**: Lucide React (iconos)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Build

```bash
npm run build
npm start
```

## Estructura del Proyecto

```
src/
├── app/              # Rutas y layouts (App Router)
├── components/       # Componentes React
│   ├── layout/      # Componentes de layout
│   ├── library/     # Componentes de biblioteca
│   ├── ui/          # Componentes UI
│   └── viewer/      # Componentes de visor
├── types/           # Definiciones TypeScript
├── constants/       # Datos y constantes
└── lib/             # Utilidades
```

## Características por Página

### `/` - Biblioteca
- Galería de álbumes en grid responsivo
- Búsqueda en tiempo real
- Agrupación por año o categoría
- Diseño de estantes de madera

### `/album/[id]` - Detalle de Álbum
- Galería de fotos estilo Polaroid
- Visor fullscreen
- Presentación automática
- Controles de video

## Licencia

Privado - Proyecto familiar
