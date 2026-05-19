# Biblioteca Rosana - Stack Tecnico

## Descripcion del Proyecto
Aplicacion de albumes de fotos familiares con estetica de biblioteca de madera vintage. Los albumes se presentan como cuadernos con anillos de encuadernacion metalicos, y al abrirlos las fotos se muestran como polaroids pegadas con cinta adhesiva sobre papel.

## Stack Tecnologico

### Frontend
- **React 19** - Biblioteca de UI
- **Vite** - Bundler y servidor de desarrollo
- **TypeScript** - Tipado estatico
- **React Router DOM** - Enrutamiento SPA

### Estilos
- **Tailwind CSS 4** - Framework de utilidades CSS
- **PostCSS** - Procesador de CSS

### Animaciones
- **Framer Motion** - Animaciones declarativas

### Iconos
- **Lucide React** - Libreria de iconos

### Utilidades
- **clsx** - Construccion condicional de clases
- **tailwind-merge** - Merge inteligente de clases Tailwind
- **class-variance-authority** - Variantes de componentes

## Estructura del Proyecto

```
src/
├── App.tsx                 # Router principal
├── main.tsx               # Punto de entrada
├── index.css              # Estilos globales y tokens
├── components/
│   ├── Header.tsx         # Header con busqueda integrada en madera
│   ├── AlbumCard.tsx      # Tarjeta de album con anillos y textura
│   └── FullscreenViewer.tsx # Visor de fotos fullscreen
├── pages/
│   ├── LibraryPage.tsx    # Biblioteca con estantes de madera
│   └── AlbumPage.tsx      # Album con fotos polaroid
├── data/
│   └── albums.ts          # Datos de ejemplo
└── lib/
    └── utils.ts           # Utilidades (cn helper)

public/
└── textures/
    ├── dark-wood-header.jpg   # Textura madera oscura para header
    ├── wood-frame.jpg         # Textura para marcos laterales
    ├── wood-shelf.jpg         # Textura para estantes
    ├── wood-back.jpg          # Textura fondo de biblioteca
    ├── paper-background.jpg   # Textura papel para paginas de album
    └── cardboard-subtle.jpg   # Textura carton sutil para portadas
```

## Caracteristicas de Diseno

### Biblioteca (LibraryPage)
- Header con textura de madera oscura y titulo grabado
- Barra de busqueda y selector integrados en la madera
- Marcos laterales de madera con sombras realistas
- Estantes con texto grabado indicando ano/categoria
- Fondo de madera con profundidad

### Tarjetas de Album (AlbumCard)
- Orientacion horizontal (4:3)
- 4 anillos metalicos dorados (2 arriba, 2 abajo) en el lado izquierdo
- Colores dinamicos basados en el color dominante de la portada
- Banda clara para el titulo usando matices del color dominante
- Textura sutil de carton en la portada
- Banda elastica decorativa

### Pagina de Album (AlbumPage)
- Header con colores del album y anillos de encuadernacion
- Fondo de papel/cartulina color crema
- Fotos estilo polaroid con marco blanco
- Cintas adhesivas en diferentes posiciones (6 variaciones)
- Rotaciones aleatorias sutiles para efecto "pegado a mano"
- Visor fullscreen con presentacion

### Efectos de Texto
- `.header-title-engraved` - Titulo principal grabado en madera
- `.wood-engraved` - Texto grabado para etiquetas de estantes
- `.title-engraved` - Titulos elegantes con efecto tallado

## Tipografias
- **Nunito** - Fuente sans-serif para textos generales
- **Playfair Display** - Fuente serif cursiva para titulos principales

## Scripts

```bash
pnpm dev      # Servidor de desarrollo
pnpm build    # Build de produccion
pnpm preview  # Preview del build
```
