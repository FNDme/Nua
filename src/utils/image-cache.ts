import { openDB, type DBSchema, type IDBPDatabase } from "idb"

const DB_NAME = "image-cache"
const STORE_NAME = "images"
// v3: stores Blobs (v2 stored base64 data URLs, which are ~33% larger)
const DB_VERSION = 3
// Current background + a few neighbours (the next one is preloaded)
const DB_LIMIT = 5

interface CachedImage {
  blob: Blob
  lastUsed: number
}

interface ImageCacheDB extends DBSchema {
  [STORE_NAME]: {
    key: string
    value: CachedImage
    indexes: { lastUsed: number }
  }
}

let dbPromise: Promise<IDBPDatabase<ImageCacheDB>> | null = null

const getDB = () => {
  dbPromise ??= openDB<ImageCacheDB>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      // Entries from older versions use a different format, drop them
      if (oldVersion < 3 && database.objectStoreNames.contains(STORE_NAME)) {
        database.deleteObjectStore(STORE_NAME)
      }
      const store = database.createObjectStore(STORE_NAME)
      store.createIndex("lastUsed", "lastUsed")
    }
  })
  return dbPromise
}

/** Returns the cached image and marks it as recently used. */
export const getCachedImage = async (
  key: string
): Promise<Blob | undefined> => {
  const database = await getDB()
  const tx = database.transaction(STORE_NAME, "readwrite")
  const cached = await tx.store.get(key)
  if (cached) {
    await tx.store.put({ ...cached, lastUsed: Date.now() }, key)
  }
  await tx.done
  return cached?.blob
}

export const hasCachedImage = async (key: string): Promise<boolean> => {
  const database = await getDB()
  return (await database.count(STORE_NAME, key)) > 0
}

/** Stores an image and evicts the least recently used ones over the limit. */
export const cacheImage = async (key: string, blob: Blob): Promise<void> => {
  const database = await getDB()
  const tx = database.transaction(STORE_NAME, "readwrite")
  await tx.store.put({ blob, lastUsed: Date.now() }, key)

  let excess = (await tx.store.count()) - DB_LIMIT
  let cursor = await tx.store.index("lastUsed").openCursor()
  while (cursor && excess > 0) {
    await cursor.delete()
    excess--
    cursor = await cursor.continue()
  }
  await tx.done
}

export const clearImageCache = async (): Promise<void> => {
  const database = await getDB()
  await database.clear(STORE_NAME)
}
