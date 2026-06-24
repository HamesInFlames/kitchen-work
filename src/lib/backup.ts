import {
  getAllRecipes,
  getAllProgress,
  getAllPhotos,
  importBackup,
  type BackupV1,
} from '../db/database'

// Export/import everything as one JSON file — resilience + no lock-in (users
// hate lock-in). Photos are inlined as data URLs so a backup is fully portable.

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function buildBackup(): Promise<BackupV1> {
  const [recipes, progress, photos] = await Promise.all([
    getAllRecipes(),
    getAllProgress(),
    getAllPhotos(),
  ])
  const photoMetas = await Promise.all(
    photos.map(async (p) => {
      const dataUrl = await blobToDataUrl(p.blob)
      const { blob: _blob, ...rest } = p
      void _blob
      return { ...rest, dataUrl, mime: p.blob.type }
    }),
  )
  return {
    format: 'tova-recipe-book',
    version: 1,
    exportedAt: Date.now(),
    recipes,
    progress,
    photos: photoMetas,
  }
}

export async function downloadBackup(): Promise<void> {
  const backup = await buildBackup()
  const json = JSON.stringify(backup)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tova-recipes-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function restoreFromFile(file: File): Promise<number> {
  const text = await file.text()
  let data: BackupV1
  try {
    data = JSON.parse(text) as BackupV1
  } catch {
    throw new Error('That file isn’t valid JSON.')
  }
  if (data.format !== 'tova-recipe-book' || !Array.isArray(data.recipes)) {
    throw new Error('That doesn’t look like a Tova’s Recipes backup file.')
  }
  // Reject malformed recipes before writing anything, so a bad file can't
  // corrupt the store with records the app will later crash on.
  for (const r of data.recipes) {
    if (
      !r ||
      typeof r !== 'object' ||
      typeof r.id !== 'string' ||
      typeof r.name !== 'string' ||
      !Array.isArray(r.groups) ||
      !Array.isArray(r.steps)
    ) {
      throw new Error('This backup is corrupted — a recipe is missing required fields.')
    }
  }
  await importBackup({
    ...data,
    progress: Array.isArray(data.progress) ? data.progress : [],
    photos: Array.isArray(data.photos) ? data.photos : [],
  })
  return data.recipes.length
}
