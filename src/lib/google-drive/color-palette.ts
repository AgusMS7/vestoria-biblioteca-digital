/**
 * Paletas de color elegantes, cálidas y emocionales para álbumes.
 * 
 * Cada paleta ha sido cuidadosamente seleccionada para:
 * - Mantener coherencia visual con la estética de Vestoria
 * - Proporcionar identidad propia a cada álbum
 * - Evitar saturaciones exageradas
 * - Preservar la sensación elegante y sobria
 */

interface ColorPalette {
  name: string
  h: number  // Hue: 0-360
  s: number  // Saturation: 0-100
  l: number  // Lightness: 0-100
}

/**
 * 16 paletas base elegantes inspiradas en colores naturales y sofisticados
 * Cada una mantiene saturación moderada y luminosidad equilibrada
 */
const COLOR_PALETTES: ColorPalette[] = [
  // 1. Azul Petróleo - Profundo, sofisticado, cálido
  { name: 'Azul Petróleo', h: 195, s: 35, l: 35 },
  
  // 2. Verde Salvia - Tranquilo, natural, elegante
  { name: 'Verde Salvia', h: 120, s: 20, l: 45 },
  
  // 3. Terracota - Cálido, emocional, enraizado
  { name: 'Terracota', h: 20, s: 45, l: 50 },
  
  // 4. Borgoña Suave - Rico, profundo, romántico
  { name: 'Borgoña Suave', h: 345, s: 40, l: 40 },
  
  // 5. Lavanda Gris - Suave, sofisticado, calmante
  { name: 'Lavanda Gris', h: 270, s: 18, l: 50 },
  
  // 6. Azul Acero - Industrial elegante, confiable
  { name: 'Azul Acero', h: 200, s: 25, l: 50 },
  
  // 7. Verde Oliva - Naturalmente elegante, atemporal
  { name: 'Verde Oliva', h: 90, s: 30, l: 40 },
  
  // 8. Mostaza Apagada - Cálida, sofisticada, vintage
  { name: 'Mostaza Apagada', h: 45, s: 35, l: 48 },
  
  // 9. Azul Noche - Profundo, misterioso, reflexivo
  { name: 'Azul Noche', h: 215, s: 40, l: 35 },
  
  // 10. Marrón Cuero - Cálido, robusto, clásico
  { name: 'Marrón Cuero', h: 30, s: 30, l: 42 },
  
  // 11. Gris Pizarra - Neutral elegante, moderno
  { name: 'Gris Pizarra', h: 210, s: 15, l: 45 },
  
  // 12. Verde Bosque Suave - Natural, profundo, calmante
  { name: 'Verde Bosque Suave', h: 145, s: 25, l: 38 },
  
  // 13. Azul Humo - Etéreo, sofisticado, sereno
  { name: 'Azul Humo', h: 190, s: 15, l: 55 },
  
  // 14. Beige Cálido - Clásico, acogedor, naturalmente elegante
  { name: 'Beige Cálido', h: 35, s: 25, l: 60 },
  
  // 15. Vino Apagado - Refinado, enológico, emocional
  { name: 'Vino Apagado', h: 355, s: 35, l: 42 },
  
  // 16. Óxido - Oxidado natural, histórico, cálido
  { name: 'Óxido', h: 25, s: 40, l: 38 },
]

/**
 * Genera un hash determinístico de una cadena
 * Utiliza algoritmo simple pero efectivo para distribución uniforme
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Asigna una paleta de color determinística basada en el ID del álbum
 * 
 * @param albumId - ID único del álbum de Google Drive
 * @returns Objeto { h, s, l } listo para usar con getAlbumColors()
 * 
 * @example
 * const color = getAlbumColor('1Y0VSu0ASKPTHKMejB4hMoE83cUN2BG5u')
 * // Siempre retorna el mismo color para el mismo ID
 * // Color es determinístico y uniforme
 */
export function getAlbumColor(
  albumId: string
): { h: number; s: number; l: number } {
  // Generar hash basado en ID
  const hash = hashString(albumId)
  
  // Seleccionar paleta usando módulo (distribución uniforme)
  const paletteIndex = hash % COLOR_PALETTES.length
  const palette = COLOR_PALETTES[paletteIndex]
  
  return {
    h: palette.h,
    s: palette.s,
    l: palette.l,
  }
}

/**
 * Retorna información sobre la paleta asignada (útil para debugging)
 */
export function getAlbumColorInfo(albumId: string): ColorPalette & { index: number } {
  const hash = hashString(albumId)
  const paletteIndex = hash % COLOR_PALETTES.length
  const palette = COLOR_PALETTES[paletteIndex]
  
  return {
    ...palette,
    index: paletteIndex + 1, // 1-indexed para visualización
  }
}

/**
 * Retorna todas las paletas disponibles (para documentación/debugging)
 */
export function getAllPalettes(): ColorPalette[] {
  return COLOR_PALETTES
}
