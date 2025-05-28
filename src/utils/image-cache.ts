const DB_NAME = "image-cache"
const STORE_NAME = "images"
const DB_VERSION = 2
const DB_LIMIT = 3

interface CachedImage {
  data: string
  timestamp: number
}

let db: IDBDatabase | null = null

export const initImageCache = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
  })
}

export const checkAndClearDB = async (): Promise<void> => {
  const database = await initImageCache()
  const transaction = database.transaction(STORE_NAME, "readwrite")
  const store = transaction.objectStore(STORE_NAME)
  const request = store.count()

  request.onsuccess = () => {
    const count = request.result
    if (count > DB_LIMIT) {
      const cursor = store.openCursor()
      let oldestImage: { key: string; value: CachedImage } | null = null

      cursor.onsuccess = (event) => {
        const current = (event.target as IDBRequest).result
        if (current) {
          if (
            !oldestImage ||
            current.value.timestamp < oldestImage.value.timestamp
          ) {
            oldestImage = { key: current.key as string, value: current.value }
          }
          current.continue()
        } else if (oldestImage) {
          store.delete(oldestImage.key)
        }
      }
    }
  }
}

export const cacheImage = async (id: string, base64: string): Promise<void> => {
  const database = await initImageCache()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const cachedImage: CachedImage = {
      data: base64,
      timestamp: Date.now()
    }
    const request = store.put(cachedImage, id)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = async () => {
      await checkAndClearDB()
      resolve()
    }

    transaction.oncomplete = () => {
      resolve()
    }
  })
}

export const getCachedImage = async (
  id: string
): Promise<string | undefined> => {
  const database = await initImageCache()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      const result = request.result as CachedImage | undefined
      resolve(result?.data)
    }
  })
}

export const clearImageCache = async (): Promise<void> => {
  const database = await initImageCache()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve()
    }

    transaction.oncomplete = () => {
      resolve()
    }
  })
}
