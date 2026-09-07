import { Injectable, signal } from '@angular/core';
import { db } from '../database/indexed-db.service';
import { SettingsService } from '../storage/settings.service';
import { SyncQueueService } from './sync-queue.service';
import { ConflictResolverService } from './conflict-resolver.service';
import { LibraryItem, ReadingProgress, Bookmark, Collection, AppSettings, SyncOperation } from '../../models';

interface DriveFile {
  name: string;
  id: string;
  modifiedTime: string;
}

@Injectable({ providedIn: 'root' })
export class SyncEngineService {
  private _syncing = signal(false);
  readonly syncing = this._syncing.asReadonly();
  private _lastError = signal<string | null>(null);
  readonly lastError = this._lastError.asReadonly();

  private accessToken: string | null = null;
  private folderId: string | null = null;

  constructor(
    private settings: SettingsService,
    private queue: SyncQueueService,
    private resolver: ConflictResolverService
  ) {}

  setToken(token: string) {
    this.accessToken = token;
  }

  async sync() {
    if (!this.accessToken) {
      this._lastError.set('Not authenticated');
      return;
    }
    this._syncing.set(true);
    this._lastError.set(null);
    try {
      await this.ensureFolder();
      await this.pushQueue();
      await this.pullRemote();
      await this.settings.update({ lastSyncAt: Date.now() });
    } catch (e) {
      this._lastError.set(e instanceof Error ? e.message : String(e));
    } finally {
      this._syncing.set(false);
    }
  }

  private async ensureFolder() {
    const res = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=' +
        encodeURIComponent("name='NovelLibrary' and mimeType='application/vnd.google-apps.folder' and trashed=false") +
        '&spaces=appDataFolder',
      { headers: { Authorization: 'Bearer ' + this.accessToken } }
    );
    const data = await res.json();
    if (data.files?.length > 0) {
      this.folderId = data.files[0].id;
    } else {
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'NovelLibrary',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['appDataFolder'],
        }),
      });
      const createData = await createRes.json();
      this.folderId = createData.id;
    }
  }

  private async pushQueue() {
    const pending = await this.queue.getPending();
    if (pending.length === 0) return;

    const library = await db.library.toArray();
    const progress = await db.progress.toArray();
    const bookmarks = await db.bookmarks.toArray();
    const collections = await db.collections.toArray();
    const settings = (await db.settings.toArray())[0];

    await this.uploadJson('library.json', library);
    await this.uploadJson('progress.json', progress);
    await this.uploadJson('bookmarks.json', bookmarks);
    await this.uploadJson('collections.json', collections);
    if (settings) await this.uploadJson('settings.json', settings);

    for (const op of pending) {
      await this.queue.markSynced(op.id);
    }
  }

  private async pullRemote() {
    const files = await this.listFiles();
    const remoteLibrary = await this.downloadJson<LibraryItem[]>('library.json', files);
    const remoteProgress = await this.downloadJson<ReadingProgress[]>('progress.json', files);
    const remoteBookmarks = await this.downloadJson<Bookmark[]>('bookmarks.json', files);
    const remoteCollections = await this.downloadJson<Collection[]>('collections.json', files);
    const remoteSettings = await this.downloadJson<AppSettings>('settings.json', files);

    if (remoteLibrary) {
      for (const remote of remoteLibrary) {
        const local = await db.library.get(remote.id);
        if (!local) await db.library.add(remote);
        else {
          const winner = this.resolver.resolveLibraryItem(local, remote);
          await db.library.put(winner);
        }
      }
    }

    if (remoteProgress) {
      for (const remote of remoteProgress) {
        const local = await db.progress.get(remote.novelId);
        if (!local) await db.progress.add(remote);
        else {
          const winner = this.resolver.resolveProgress(local, remote);
          await db.progress.put(winner);
        }
      }
    }

    if (remoteBookmarks) {
      const local = await db.bookmarks.toArray();
      const merged = this.resolver.mergeBookmarks(local, remoteBookmarks);
      await db.bookmarks.clear();
      await db.bookmarks.bulkAdd(merged);
    }

    if (remoteCollections) {
      const local = await db.collections.toArray();
      const merged = this.resolver.mergeCollections(local, remoteCollections);
      await db.collections.clear();
      await db.collections.bulkAdd(merged);
    }

    if (remoteSettings) {
      const local = (await db.settings.toArray())[0];
      if (!local || remoteSettings.lastSyncAt! > (local.lastSyncAt ?? 0)) {
        await db.settings.put({ ...local, ...remoteSettings });
      }
    }
  }

  private async listFiles(): Promise<DriveFile[]> {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `'${this.folderId}' in parents and trashed=false`
      )}&fields=files(id,name,modifiedTime)`,
      { headers: { Authorization: 'Bearer ' + this.accessToken } }
    );
    const data = await res.json();
    return data.files || [];
  }

  private async uploadJson(name: string, data: unknown) {
    const files = await this.listFiles();
    const existing = files.find((f) => f.name === name);
    const body = JSON.stringify(data);
    const metadata = JSON.stringify({ name, parents: existing ? undefined : [this.folderId!] });
    const boundary = '-------314159265358979323846';
    const multipart =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n` +
      `--${boundary}--`;

    const url = existing
      ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const method = existing ? 'PATCH' : 'POST';

    await fetch(url, {
      method,
      headers: {
        Authorization: 'Bearer ' + this.accessToken,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipart,
    });
  }

  private async downloadJson<T>(name: string, files: DriveFile[]): Promise<T | null> {
    const file = files.find((f) => f.name === name);
    if (!file) return null;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      { headers: { Authorization: 'Bearer ' + this.accessToken } }
    );
    if (!res.ok) return null;
    return res.json();
  }
}
