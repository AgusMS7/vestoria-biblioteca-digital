/**
 * Texto de conteo de medios de un álbum.
 * Sin videos mantiene la etiqueta histórica ("9 fotos"); con videos agrega
 * el desglose ("8 fotos · 1 video") para que el número coincida con lo visible.
 */
export function formatMediaCount(
  photoCount: number,
  videoCount: number
): string {
  const photos = `${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'}`

  if (videoCount === 0) {
    return photos
  }

  const videos = `${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`

  return `${photos} · ${videos}`
}
