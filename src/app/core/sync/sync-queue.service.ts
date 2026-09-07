import { Injectable, signal } from '@angular/core';
import { db } from '../database/indexed-db.service';
import { SyncOperation } from '../../models';

@Injectable({ providedIn: 'root' })
export class SyncQueueService {
  private _queue = signal<SyncOperation[]>([]);
  readonly queue = this._queue.asReadonly();

  constructor() {
    this.load();
  }

  private async load() {
    const ops = await db.syncQueue.where({ synced: 0 }).toArray();
    this._queue.set(ops);
  }

  async enqueue(operation: Omit<SyncOperation, 'id' | 'synced'>) {
    const op: SyncOperation = {
      ...operation,
      id: 'sync_' + crypto.randomUUID(),
      synced: false,
    };
    await db.syncQueue.add(op);
    await this.load();
    return op;
  }

  async markSynced(id: string) {
    await db.syncQueue.update(id, { synced: true });
    await this.load();
  }

  async removeSynced() {
    await db.syncQueue.where({ synced: 1 }).delete();
    await this.load();
  }

  async clear() {
    await db.syncQueue.clear();
    this._queue.set([]);
  }

  getPending(): Promise<SyncOperation[]> {
    return db.syncQueue.where({ synced: 0 }).toArray();
  }
}
