import { describe, expect, it } from 'vitest'
import {
  getMediaType,
  isCoverFile,
  isMediaFile,
  mapToMediaItem,
} from './mapper'

describe('isMediaFile', () => {
  it('accepts the supported image formats', () => {
    for (const mimeType of [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
    ]) {
      expect(isMediaFile(mimeType)).toBe(true)
    }
  })

  it('accepts the supported video formats', () => {
    for (const mimeType of [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/mpeg',
    ]) {
      expect(isMediaFile(mimeType)).toBe(true)
    }
  })

  it('rejects svg and non-media types', () => {
    expect(isMediaFile('image/svg+xml')).toBe(false)
    expect(isMediaFile('application/pdf')).toBe(false)
    expect(isMediaFile('')).toBe(false)
  })
})

describe('isCoverFile', () => {
  it('only matches cover.<ext>', () => {
    expect(isCoverFile('cover.jpg')).toBe(true)
    expect(isCoverFile('COVER.PNG')).toBe(true)
    expect(isCoverFile('cover.webp')).toBe(true)
    expect(isCoverFile('cover.heic')).toBe(false)
    expect(isCoverFile('mycover.jpg')).toBe(false)
  })
})

describe('getMediaType', () => {
  it('separates images from videos', () => {
    expect(getMediaType('image/jpeg')).toBe('image')
    expect(getMediaType('video/mp4')).toBe('video')
    expect(getMediaType('application/pdf')).toBeNull()
  })
})

describe('mapToMediaItem', () => {
  it('builds a media item with a large thumbnail url', () => {
    expect(
      mapToMediaItem({
        id: 'abc',
        name: '2019-07-15 cumple.jpg',
        mimeType: 'image/jpeg',
        imageMediaMetadata: { width: 4000, height: 3000 },
        modifiedTime: '2020-01-01T00:00:00Z',
      })
    ).toEqual({
      id: 'abc',
      type: 'image',
      fileName: '2019-07-15 cumple.jpg',
      title: '2019-07-15 cumple.jpg',
      date: undefined,
      year: 2019,
      month: 7,
      width: 4000,
      height: 3000,
      duration: undefined,
      thumbnailUrl: '/api/media/abc/thumbnail?size=large',
      mediaUrl: '/api/media/abc',
    })
  })

  it('marks videos and keeps their duration in seconds', () => {
    const media = mapToMediaItem({
      id: 'vid',
      name: 'clip.mp4',
      mimeType: 'video/mp4',
      videoMediaMetadata: { width: 1920, height: 1080, durationMillis: '65000' },
    })

    expect(media?.type).toBe('video')
    expect(media?.duration).toBe(65)
  })

  it('returns null without id, name or a supported mime type', () => {
    expect(mapToMediaItem({ name: 'x.jpg', mimeType: 'image/jpeg' })).toBeNull()
    expect(mapToMediaItem({ id: 'a', mimeType: 'image/jpeg' })).toBeNull()
    expect(
      mapToMediaItem({ id: 'a', name: 'doc.pdf', mimeType: 'application/pdf' })
    ).toBeNull()
  })
})
