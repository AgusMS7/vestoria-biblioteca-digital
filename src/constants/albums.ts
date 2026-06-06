import type { Album } from '@/types'

export const albums: Album[] = [
  {
    id: '1',
    title: 'Tarde de Jardín',
    year: 2024,
    category: 'Momentos',
    coverImage: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=80',
    description: 'Una tarde tranquila entre flores y amigos',
    mediaCount: 24,
    dominantColor: { h: 90, s: 50, l: 55 },
    media: [
      { id: '1-1', type: 'image', src: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&q=80', title: 'Jardín con flores' },
      { id: '1-2', type: 'image', src: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80', title: 'Picnic' },
      { id: '1-3', type: 'image', src: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=400&q=80', title: 'Lectura al sol' },
      { id: '1-4', type: 'image', src: 'https://images.unsplash.com/photo-1461939570285-7f9f3e152246?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1461939570285-7f9f3e152246?w=400&q=80', title: 'Flores silvestres' },
      { id: '1-5', type: 'image', src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80', title: 'Sombrilla y charla' },
      { id: '1-6', type: 'image', src: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&q=80', title: 'Atardecer en el jardín' },
    ]
  },
  {
    id: '2',
    title: 'Vacaciones en la Playa',
    year: 2024,
    category: 'Viajes',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    description: 'Verano inolvidable en la costa',
    mediaCount: 45,
    dominantColor: { h: 195, s: 65, l: 45 },
    media: [
      { id: '2-1', type: 'image', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80', title: 'Playa' },
      { id: '2-2', type: 'image', src: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&q=80', title: 'Atardecer' },
      { id: '2-3', type: 'image', src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80', title: 'Olas' },
      { id: '2-4', type: 'image', src: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=400&q=80', title: 'Palmeras' },
      { id: '2-5', type: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=80', title: 'Video de la playa' },
    ]
  },
  {
    id: '3',
    title: 'Noche de Cine en Casa',
    year: 2024,
    category: 'Entretenimiento',
    coverImage: 'https://picsum.photos/seed/cine/800/600',
    description: 'Peli, palomitas y risas en la sala',
    mediaCount: 22,
    dominantColor: { h: 20, s: 45, l: 38 },
    media: [
      { id: '3-1', type: 'image', src: 'https://picsum.photos/seed/cine1/1200/900', thumbnail: 'https://picsum.photos/seed/cine1/400/300', title: 'Pantalla y mantas' },
      { id: '3-2', type: 'image', src: 'https://picsum.photos/seed/cine2/1200/900', thumbnail: 'https://picsum.photos/seed/cine2/400/300', title: 'Palomitas' },
      { id: '3-3', type: 'image', src: 'https://picsum.photos/seed/cine3/1200/900', thumbnail: 'https://picsum.photos/seed/cine3/400/300', title: 'Sofá cómodo' },
      { id: '3-4', type: 'image', src: 'https://picsum.photos/seed/cine4/1200/900', thumbnail: 'https://picsum.photos/seed/cine4/400/300', title: 'Momentos compartidos' },
    ]
  },
  {
    id: '4',
    title: 'Primer Día de Clases',
    year: 2023,
    category: 'Aprendizaje',
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
    description: 'El inicio de una nueva aventura',
    mediaCount: 18,
    dominantColor: { h: 45, s: 60, l: 50 },
    media: [
      { id: '4-1', type: 'image', src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80', title: 'Escuela' },
      { id: '4-2', type: 'image', src: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80', title: 'Libros' },
      { id: '4-3', type: 'image', src: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80', title: 'Estudiando' },
    ]
  },
  {
    id: '5',
    title: 'Boda de Ana y Pedro',
    year: 2023,
    category: 'Eventos',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    description: 'El gran día de la pareja',
    mediaCount: 156,
    dominantColor: { h: 30, s: 45, l: 65 },
    media: [
      { id: '5-1', type: 'image', src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80', title: 'Ceremonia' },
      { id: '5-2', type: 'image', src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80', title: 'Ramo' },
      { id: '5-3', type: 'image', src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80', title: 'Novios' },
      { id: '5-4', type: 'image', src: 'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=400&q=80', title: 'Fiesta' },
      { id: '5-5', type: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80', title: 'Video de la boda' },
    ]
  },
  {
    id: '6',
    title: 'Ruta en Bicicleta',
    year: 2023,
    category: 'Aventuras',
    coverImage: 'https://picsum.photos/seed/bici/800/600',
    description: 'Recorrido entre senderos y paisajes tranquilos',
    mediaCount: 30,
    dominantColor: { h: 170, s: 55, l: 42 },
    media: [
      { id: '6-1', type: 'image', src: 'https://picsum.photos/seed/bici1/1200/900', thumbnail: 'https://picsum.photos/seed/bici1/400/300', title: 'Bicicleta en el camino' },
      { id: '6-2', type: 'image', src: 'https://picsum.photos/seed/bici2/1200/900', thumbnail: 'https://picsum.photos/seed/bici2/400/300', title: 'Paisaje verde' },
      { id: '6-3', type: 'image', src: 'https://picsum.photos/seed/bici3/1200/900', thumbnail: 'https://picsum.photos/seed/bici3/400/300', title: 'Parada en el mirador' },
    ]
  },
  {
    id: '7',
    title: 'Viaje a la Sierra',
    year: 2022,
    category: 'Viajes',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
    description: 'Fin de semana en las montañas',
    mediaCount: 67,
    dominantColor: { h: 210, s: 35, l: 40 },
    media: [
      { id: '7-1', type: 'image', src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80', title: 'Montañas' },
      { id: '7-2', type: 'image', src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80', title: 'Paisaje' },
      { id: '7-3', type: 'image', src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80', title: 'Niebla' },
      { id: '7-4', type: 'image', src: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=400&q=80', title: 'Bosque' },
    ]
  },
  {
    id: '8',
    title: 'Asado del Domingo',
    year: 2022,
    category: 'Momentos',
    coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    description: 'Familia reunida en el patio',
    mediaCount: 41,
    dominantColor: { h: 25, s: 55, l: 40 },
    media: [
      { id: '8-1', type: 'image', src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80', title: 'Asado' },
      { id: '8-2', type: 'image', src: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80', title: 'Carne' },
      { id: '8-3', type: 'image', src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80', thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', title: 'Comida' },
    ]
  },
]

export const categories = [...new Set(albums.map(a => a.category))].sort()
