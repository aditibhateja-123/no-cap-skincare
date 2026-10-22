// On-device IndexedDB storage for timeline photos
// Photos NEVER leave this browser, are NEVER saved to localStorage, NEVER sent to any server or AI.

const DB_NAME = 'nocap_timeline_db';
const DB_VERSION = 1;
const STORE_NAME = 'timeline_photos';

export interface StoredTimelinePhoto {
  id: string;
  planId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  blob: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('planId', 'planId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Resizes an image file/blob to have its longest side at 800px max,
 * and re-encodes as JPEG. This drawing onto a fresh HTML canvas completely strips EXIF metadata.
 */
export async function shrinkAndStripExif(source: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(source);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        const maxSide = 800;
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (originalWidth > maxSide || originalHeight > maxSide) {
          if (originalWidth >= originalHeight) {
            targetWidth = maxSide;
            targetHeight = Math.round((originalHeight / originalWidth) * maxSide);
          } else {
            targetHeight = maxSide;
            targetWidth = Math.round((originalWidth / originalHeight) * maxSide);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        // Draw fresh pixels (strips all EXIF, metadata, orientation tags)
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to encode image to JPEG'));
            }
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image for re-encoding'));
      };

      img.src = objectUrl;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Saves a timeline photo to IndexedDB on this device only.
 */
export async function saveTimelinePhoto(
  planId: string,
  date: string,
  blob: Blob
): Promise<string> {
  try {
    const db = await openDB();
    const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const record: StoredTimelinePhoto = {
      id,
      planId,
      date,
      timestamp: Date.now(),
      blob,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(record);

      req.onsuccess = () => resolve(id);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save photo to IndexedDB:', err);
    throw err;
  }
}

/**
 * Retrieves all timeline photos for a specific plan, newest first.
 */
export async function getTimelinePhotosForPlan(
  planId: string
): Promise<{ id: string; planId: string; date: string; timestamp: number; url: string }[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('planId');
      const req = index.getAll(planId);

      req.onsuccess = () => {
        const results = (req.result as StoredTimelinePhoto[]) || [];
        // Sort newest first
        results.sort((a, b) => b.timestamp - a.timestamp);

        const mapped = results.map((r) => ({
          id: r.id,
          planId: r.planId,
          date: r.date,
          timestamp: r.timestamp,
          url: URL.createObjectURL(r.blob),
        }));
        resolve(mapped);
      };

      req.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Deletes a single photo by ID from IndexedDB.
 */
export async function deleteTimelinePhoto(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete photo from IndexedDB:', err);
  }
}

/**
 * Deletes all photos (optionally for a specific plan, or completely).
 */
export async function deleteAllTimelinePhotos(planId?: string): Promise<void> {
  try {
    const db = await openDB();
    if (!planId) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }

    // Delete matching planId
    const photos = await getTimelinePhotosForPlan(planId);
    for (const p of photos) {
      await deleteTimelinePhoto(p.id);
    }
  } catch (err) {
    console.warn('Could not clear photos from IndexedDB:', err);
  }
}
