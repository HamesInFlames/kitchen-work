import { newId, putPhoto, getPhoto } from './database'
import type { Photo } from '../types/recipe'

// Image handling: capture via <input type=file accept=image/* capture>, downscale
// + recompress on the client (kitchens take huge phone photos), then store the
// compressed Blob directly in IndexedDB tied to the recipe record.

const MAX_DIM = 1600
const JPEG_QUALITY = 0.82

export interface CompressedImage {
  blob: Blob
  width: number
  height: number
}

export async function compressImage(
  source: Blob,
  maxDim = MAX_DIM,
  quality = JPEG_QUALITY,
): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(source)
  // Capture originals before close() — close() zeroes bitmap.width/height.
  const sourceWidth = bitmap.width
  const sourceHeight = bitmap.height
  const scale = Math.min(1, maxDim / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return { blob: source, width: sourceWidth, height: sourceHeight }
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  // If encoding failed we keep the original source — so report ITS dimensions,
  // not the scaled ones we never produced.
  if (!blob) return { blob: source, width: sourceWidth, height: sourceHeight }
  return { blob, width, height }
}

export async function savePhoto(
  recipeId: string,
  kind: Photo['kind'],
  source: Blob,
  caption?: string,
): Promise<Photo> {
  const { blob, width, height } = await compressImage(source)
  const photo: Photo = {
    id: newId(),
    recipeId,
    kind,
    blob,
    width,
    height,
    caption,
    createdAt: Date.now(),
  }
  await putPhoto(photo)
  return photo
}

// --- Object URL cache ------------------------------------------------------
// One object URL per photo id, reused across components and revoked only when
// explicitly evicted (e.g. after a photo is deleted).

const urlCache = new Map<string, string>()
const inflight = new Map<string, Promise<string | null>>()

export async function getPhotoUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id)
  if (cached) return cached
  const pending = inflight.get(id)
  if (pending) return pending

  const promise = (async () => {
    const photo = await getPhoto(id)
    if (!photo) return null
    const url = URL.createObjectURL(photo.blob)
    urlCache.set(id, url)
    return url
  })()
  inflight.set(id, promise)
  try {
    return await promise
  } finally {
    inflight.delete(id)
  }
}

export function evictPhotoUrl(id: string): void {
  const url = urlCache.get(id)
  if (url) {
    URL.revokeObjectURL(url)
    urlCache.delete(id)
  }
}
