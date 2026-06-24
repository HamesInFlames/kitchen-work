import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Recipe, Photo, BakeProgress } from '../types/recipe'

// IndexedDB is the recommended store for structured recipe data: async,
// non-blocking, and able to hold image Blobs alongside records. We use Jake
// Archibald's `idb` promise wrapper.

const DB_NAME = 'tova-recipe-book'
const DB_VERSION = 1

interface RecipeDB extends DBSchema {
  recipes: {
    key: string
    value: Recipe
    indexes: { 'by-updated': number }
  }
  photos: {
    key: string
    value: Photo
    indexes: { 'by-recipe': string }
  }
  progress: {
    key: string
    value: BakeProgress
  }
}

let dbPromise: Promise<IDBPDatabase<RecipeDB>> | null = null

export function getDB(): Promise<IDBPDatabase<RecipeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RecipeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('recipes')) {
          const recipes = db.createObjectStore('recipes', { keyPath: 'id' })
          recipes.createIndex('by-updated', 'updatedAt')
        }
        if (!db.objectStoreNames.contains('photos')) {
          const photos = db.createObjectStore('photos', { keyPath: 'id' })
          photos.createIndex('by-recipe', 'recipeId')
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'recipeId' })
        }
      },
    })
  }
  return dbPromise
}

/** Stable id helper — crypto.randomUUID is available in modern browsers and Node. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.abs(hashString(String(performance.now()) + ':' + globalThis.navigator?.userAgent))
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

// --- Recipes ---------------------------------------------------------------

export async function getAllRecipes(): Promise<Recipe[]> {
  const db = await getDB()
  const all = await db.getAll('recipes')
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  const db = await getDB()
  return db.get('recipes', id)
}

export async function putRecipe(recipe: Recipe): Promise<void> {
  const db = await getDB()
  await db.put('recipes', recipe)
}

export async function deleteRecipe(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['recipes', 'photos', 'progress'], 'readwrite')
  await tx.objectStore('recipes').delete(id)
  await tx.objectStore('progress').delete(id)
  const photoStore = tx.objectStore('photos')
  let cursor = await photoStore.index('by-recipe').openCursor(id)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}

// --- Photos ----------------------------------------------------------------

export async function putPhoto(photo: Photo): Promise<void> {
  const db = await getDB()
  await db.put('photos', photo)
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  const db = await getDB()
  return db.get('photos', id)
}

export async function getPhotosForRecipe(recipeId: string): Promise<Photo[]> {
  const db = await getDB()
  return db.getAllFromIndex('photos', 'by-recipe', recipeId)
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('photos', id)
}

// --- Bake progress ---------------------------------------------------------

export async function getProgress(recipeId: string): Promise<BakeProgress | undefined> {
  const db = await getDB()
  return db.get('progress', recipeId)
}

export async function putProgress(progress: BakeProgress): Promise<void> {
  const db = await getDB()
  await db.put('progress', progress)
}

export async function clearProgress(recipeId: string): Promise<void> {
  const db = await getDB()
  await db.delete('progress', recipeId)
}

// --- Backup / restore (anti-lock-in; resilience) ---------------------------

export interface BackupV1 {
  format: 'tova-recipe-book'
  version: 1
  exportedAt: number
  recipes: Recipe[]
  progress: BakeProgress[]
  photos: Array<Omit<Photo, 'blob'> & { dataUrl: string; mime: string }>
}

export async function getAllProgress(): Promise<BakeProgress[]> {
  const db = await getDB()
  return db.getAll('progress')
}

export async function getAllPhotos(): Promise<Photo[]> {
  const db = await getDB()
  return db.getAll('photos')
}

/** Restore a backup. Existing records with the same id are overwritten. */
export async function importBackup(backup: BackupV1): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['recipes', 'photos', 'progress'], 'readwrite')
  for (const r of backup.recipes) await tx.objectStore('recipes').put(r)
  for (const p of backup.progress) await tx.objectStore('progress').put(p)
  for (const meta of backup.photos) {
    let blob: Blob
    try {
      blob = await (await fetch(meta.dataUrl)).blob()
    } catch {
      // A single corrupt photo shouldn't abort the whole restore.
      continue
    }
    const { dataUrl: _dataUrl, mime: _mime, ...rest } = meta
    void _dataUrl
    void _mime
    await tx.objectStore('photos').put({ ...rest, blob })
  }
  await tx.done
}
