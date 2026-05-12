import { Injectable, signal } from '@angular/core';
import { Photo } from '../models/photo.model';

const DB_NAME = 'photo-pwa-db';
const DB_VERSION = 1;
const STORE = 'photos';

@Injectable({ providedIn: 'root' })
export class PhotoStorageService {
  readonly photos = signal<Photo[]>([]);

  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.dbPromise;
  }

  private async store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.openDB();
    return db.transaction(STORE, mode).objectStore(STORE);
  }

  async addPhoto(blob: Blob): Promise<Photo> {
    const store = await this.store('readwrite');
    const photo = { blob, createdAt: Date.now() };
    const id = await new Promise<number>((resolve, reject) => {
      const req = store.add(photo);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
    const created: Photo = { id, ...photo };
    this.photos.update((list) => [created, ...list]);
    return created;
  }

  async loadAll(): Promise<Photo[]> {
    const store = await this.store('readonly');
    const photos = await new Promise<Photo[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as Photo[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    photos.sort((a, b) => b.createdAt - a.createdAt);
    this.photos.set(photos);
    return photos;
  }

  async remove(id: number): Promise<void> {
    const store = await this.store('readwrite');
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    this.photos.update((list) => list.filter((p) => p.id !== id));
  }
}
