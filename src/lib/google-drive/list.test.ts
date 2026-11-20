import type { drive_v3 } from 'googleapis'
import { describe, expect, it } from 'vitest'
import { listAllFiles, MAX_LIST_PAGES } from './list'

type Page = { files: drive_v3.Schema$File[]; nextPageToken?: string }

function fakeDrive(
  pages: Record<string, Page>,
  onCall?: (params: drive_v3.Params$Resource$Files$List) => void
): drive_v3.Drive {
  return {
    files: {
      list: async (params: drive_v3.Params$Resource$Files$List) => {
        onCall?.(params)
        return { data: pages[params.pageToken ?? 'start'] }
      },
    },
  } as unknown as drive_v3.Drive
}

describe('listAllFiles', () => {
  it('returns a single page when there is no nextPageToken', async () => {
    let calls = 0

    const drive = fakeDrive(
      { start: { files: [{ id: 'a' }, { id: 'b' }] } },
      () => calls++
    )

    const files = await listAllFiles(drive, { pageSize: 100 })

    expect(files.map((file) => file.id)).toEqual(['a', 'b'])
    expect(calls).toBe(1)
  })

  it('follows nextPageToken and keeps the order', async () => {
    const drive = fakeDrive({
      start: { files: [{ id: 'a' }], nextPageToken: 'page-2' },
      'page-2': { files: [{ id: 'b' }], nextPageToken: 'page-3' },
      'page-3': { files: [{ id: 'c' }] },
    })

    const files = await listAllFiles(drive, { pageSize: 100 })

    expect(files.map((file) => file.id)).toEqual(['a', 'b', 'c'])
  })

  it('stops if drive repeats a token', async () => {
    const drive = fakeDrive({
      start: { files: [{ id: 'a' }], nextPageToken: 'same' },
      same: { files: [{ id: 'b' }], nextPageToken: 'same' },
    })

    const files = await listAllFiles(drive, { pageSize: 100 })

    expect(files.map((file) => file.id)).toEqual(['a', 'b'])
  })

  it('caps the number of pages', async () => {
    let calls = 0

    const drive = {
      files: {
        list: async (params: drive_v3.Params$Resource$Files$List) => {
          calls++
          const current = params.pageToken ? Number(params.pageToken) : 0

          return {
            data: {
              files: [{ id: `f${current}` }],
              nextPageToken: String(current + 1),
            },
          }
        },
      },
    } as unknown as drive_v3.Drive

    const files = await listAllFiles(drive, { pageSize: 100 })

    expect(calls).toBe(MAX_LIST_PAGES)
    expect(files).toHaveLength(MAX_LIST_PAGES)
  })
})
