# 📊 AUDITORÍA TÉCNICA: SISTEMA DE COLORES DE ÁLBUMES

**Fecha**: Junio 2026  
**Status**: Investigación Completa (Sin Cambios)  
**Responsable**: Análisis Automatizado

---

## 1. RESUMEN EJECUTIVO

El sistema de colores de Vestoria es **actualmente muy simple**: todos los álbumes comparten LA MISMA PALETA de color (gris neutro) porque la asignación de `dominantColor` está **hardcodeada como constante**.

```typescript
// src/lib/google-drive/mapper.ts línea 87
dominantColor: { h: 0, s: 0, l: 50 }
// ↑ IDÉNTICO PARA TODOS LOS ÁLBUMES
```

---

## 2. ARQUITECTURA ACTUAL

### 2.1 Flujo de Datos

```
Google Drive (carpeta del álbum)
         ↓
mapper.ts: mapToAlbum()
         ↓
dominantColor: { h: 0, s: 0, l: 50 }  ← HARDCODEADO
         ↓
Album type (TypeScript)
         ↓
Frontend: AlbumCard.tsx o album/[id]/page.tsx
         ↓
getAlbumColors(dominantColor)
         ↓
CSS generado dinámicamente con HSL
```

### 2.2 Archivo Responsable

**Única fuente de asignación de colores:**
- `src/lib/google-drive/mapper.ts` línea 87

**Funciones que usan los colores:**
- `src/components/library/AlbumCard.tsx`: `getAlbumColors()`
- `src/app/album/[id]/page.tsx`: `getAlbumPageColors()`

---

## 3. DETALLES TÉCNICOS

### 3.1 Estructura HSL

Cada `dominantColor` tiene 3 valores:
- **h** (Hue / Matiz): 0-360° (actualmente SIEMPRE 0)
- **s** (Saturation / Saturación): 0-100% (actualmente SIEMPRE 0)
- **l** (Lightness / Luminosidad): 0-100% (actualmente SIEMPRE 50)

**Valor Actual Global:**
```json
{
  "h": 0,
  "s": 0,
  "l": 50
}
```

Esto produce: `hsl(0 0% 50%)` = **GRIS PURO #808080**

### 3.2 Cálculo de Colores Derivados

Ambas funciones (`getAlbumColors` y `getAlbumPageColors`) aplican transformaciones matemáticas al `dominantColor`:

**Patrón General:**
```typescript
function getAlbumColors(color: { h, s, l }) {
  return {
    // Varía saturation y lightness, mantiene hue
    cover: `hsl(${h} ${Math.min(s + 5, 45)}% ${Math.max(l - 5, 30)}%)`,
    coverLight: `hsl(${h} ${Math.min(s, 40)}% ${Math.min(l + 8, 45)}%)`,
    // ... más variaciones
  }
}
```

**Con h=0, s=0, l=50:**
- Todas las fórmulas resultan en valores de gris
- La saturación siempre es 0 (sin color)
- Solo varían lightness (claridad)

**Ejemplo de salida (para TODOS los álbumes):**
```
cover: hsl(0 0% 45%)      = gris oscuro
coverLight: hsl(0 0% 50%) = gris medio
coverDark: hsl(0 0% 35%)  = gris oscuro
band: hsl(0 0% 85%)       = gris claro
```

---

## 4. CUÁNTAS PALETAS EXISTEN

**Respuesta: 1 ÚNICA PALETA (la gris)**

Actualmente, el sistema está diseñado para soportar múltiples paletas (línea 87 comenta "futuro: extraer de la portada"), pero en producción:

- ❌ NO hay paletas aleatorias
- ❌ NO hay paletas derivadas de ID
- ❌ NO hay paletas derivadas de nombre
- ❌ NO hay hash de colores
- ✅ TODAS comparten: h=0, s=0, l=50

---

## 5. ESTABILIDAD

### 5.1 ¿Es estable entre deploys?
✅ **SÍ, COMPLETAMENTE**

El color es una constante. No cambia entre:
- Deployments
- Reinicios
- Cambios de nombre
- Cambios de ID
- Movimientos de carpeta

### 5.2 ¿Cambia si se renombra el álbum?
❌ **NO** - La asignación es independiente del nombre

### 5.3 ¿Cambia si se cambia el ID?
❌ **NO** - La asignación es independiente del ID

---

## 6. CÓMO SE ASIGNAN A COMPONENTES

### En AlbumCard (vista de biblioteca)

```typescript
const colors = getAlbumColors(album.dominantColor)

return {
  // Portada del libro
  background: `linear-gradient(145deg, ${colors.coverLight} 0%, ${colors.cover} 60%, ${colors.coverDark} 100%)`,
  
  // Lomo del libro (spine)
  spineBg: colors.spine,
  
  // Cinta/banda decorativa
  bandBg: colors.band,
  bandBorderColor: colors.bandBorder,
  
  // Texto de título
  titleColor: colors.textDark,
  
  // Texto de año/subtítulo
  subtitleColor: colors.textMuted,
}
```

### En Album Page (vista detalle)

```typescript
const colors = getAlbumPageColors(album.dominantColor)

return {
  // Header (encabezado del álbum)
  header: colors.header,
  headerLight: colors.headerLight,
  headerDark: colors.headerDark,
  
  // Botones
  buttonHue: colors.buttonHue,
  buttonSat: colors.buttonSat,
  buttonLight: colors.buttonLight,
  
  // Anillos de encuadernación
  ringColor: colors.ringColor,
  ringHighlight: colors.ringHighlight,
  
  // Otros
  titleColor: colors.titleColor,
  subtitleColor: colors.subtitleColor,
  playBtnText: colors.playBtnText,
}
```

---

## 7. EJEMPLOS REALES

Como todos los álbumes tienen el mismo color, aquí está lo que VES:

| Álbum | ID | Paleta | Motivo |
|-------|---|--------|--------|
| Junio de 2026 | 1Y0VSu0ASKPTHKMejB4hMoE83cUN2BG5u | Gris #808080 | Hardcodeado |
| [Otro álbum] | [Cualquier ID] | Gris #808080 | Hardcodeado |
| [Otro álbum] | [Cualquier ID] | Gris #808080 | Hardcodeado |

**Todas muestran la MISMA PALETA**

---

## 8. VARIABLES CSS/TAILWIND INVOLUCRADAS

### En globals.css

```css
:root {
  /* Estos NO se usan para los colores de álbumes */
  --background: 30 20% 12%;
  --foreground: 35 25% 92%;
  /* ... más variables de tema global */
}
```

**IMPORTANTE:** Las variables de tema global NO se usan para álbumes. Los colores de álbumes se generan DINÁMICAMENTE en el componente.

### En AlbumCard.tsx y album/[id]/page.tsx

```typescript
// NO hay clases Tailwind con colores
// TODO es inline style generado con hsl()
style={{ 
  background: `hsl(${h} ${s}% ${l}%)`
}}
```

---

## 9. IMPACTO EN LA ARQUITECTURA

### 9.1 ¿Qué hace que un color "pertenezca" a un álbum?

Actualmente: **NADA**. El color no está vinculado a:
- ❌ ID del álbum
- ❌ Nombre del álbum
- ❌ Contenido multimedia
- ❌ Categoría
- ❌ Portada
- ✅ UNA CONSTANTE GLOBAL

### 9.2 ¿Podría dos álbumes tener colores diferentes?

❌ **NO** - Actualmente es imposible, todos comparten la misma constante.

Pero la arquitectura PERMITE múltiples paletas si se implementara la asignación.

---

## 10. RESUMEN TÉCNICO PARA EVOLUCIÓN

### Situación Actual

```typescript
type Album = {
  dominantColor: { h: 0, s: 0, l: 50 }  // SIEMPRE igual
}
```

### Opciones de Evolución (Sin Romper Compatibilidad)

#### **Opción A: Hash Basado en ID del Álbum** ⭐ RECOMENDADO

```typescript
function generateColorFromId(albumId: string): { h, s, l } {
  // Hash el ID para generar h, s, l consistentemente
  // Resultado: cada álbum siempre el mismo color, pero diferente entre sí
  // Ventaja: Determinístico, no requiere guardar datos
}
```

**Ventajas:**
- Determinístico (mismo color siempre)
- No requiere base de datos
- Compatible con arquitectura actual
- Escalable

**Código necesario:** ~20 líneas

#### **Opción B: Derivar de Portada**

```typescript
function extractColorFromCover(coverImageUrl: string): { h, s, l } {
  // Descargar imagen, analizar píxeles dominantes
  // Más lento, pero más bonito
}
```

**Ventajas:**
- Colores auténticos de la portada
- Visualmente cohesivo

**Desventajas:**
- Requiere procesamiento de imagen
- Más lento (en la ruta crítica)
- Cambiaría si la portada cambia

#### **Opción C: Combinación Hash + Portada (Híbrida)**

```typescript
// Primary: Intentar color de portada
// Fallback: Color basado en hash de ID
```

---

## 11. RECOMENDACIÓN FINAL

### Para Implementar Colores Diferentes sin Romper:

1. **Crear función de generación de color:**
   ```typescript
   function getAlbumColorFromId(albumId: string): { h, s, l } {
     // Simple hash -> HSL
   }
   ```

2. **Cambiar mapper.ts línea 87:**
   ```typescript
   // De:
   dominantColor: { h: 0, s: 0, l: 50 }
   
   // A:
   dominantColor: getAlbumColorFromId(id)
   ```

3. **Nada más cambia** - Las funciones `getAlbumColors()` y `getAlbumPageColors()` funcionan idénticamente

4. **Beneficio:** Cada álbum tendrá su color único automáticamente

---

## 12. NOTAS IMPORTANTES

- **El comentario en mapper.ts (línea 87)** dice "futuro: extraer de la portada" - eso era el plan original pero nunca se implementó
- **La arquitectura está lista** para soportar colores diferentes - solo necesita la función de asignación
- **No hay breaking changes** - cambiar la asignación no requiere refactor
- **El CSS es seguro** - usa HSL que es seguro con cualquier valor h/s/l

---

**Conclusión:** El sistema actual está "preparado pero desactivado". Cambiar a colores dinámicos es una cuestión de 20-30 líneas de código.
