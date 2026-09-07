import { Injectable, signal, computed, effect } from '@angular/core';
import { ReadingProgress } from '../../models';
import { SettingsService } from '../../core/storage/settings.service';
import { LibraryService } from '../library/library.service';

const SAVE_DEBOUNCE_MS = 3000;
const SAVE_INTERVAL_MS = 5000;

/**
 * Service for tracking and persisting reading progress.
 * Uses throttling and debounced saves to avoid excessive writes.
 */
@Injectable({ providedIn: 'root' })
export class ProgressTrackerService {
  private readonly _progress = signal<ReadingProgress | null>(null);
  readonly progress = this._progress.asReadonly();

  private autoSaveTimer: any = null;
  private deviceId: string = '';

  constructor(
    private settings: SettingsService,
    private library: LibraryService
  ) {
    effect(() => {
      this.deviceId = this.settings.settings().deviceId;
    });
  }

  /**
   * Initializes progress tracking for a novel/chapter.
   */
  async loadProgress(novelId: string): Promise<ReadingProgress | null> {
    const progress = await this.library.getProgress(novelId);
    if (progress) {
      this._progress.set(progress);
    }
    return progress ?? null;
  }

  /**
   * Updates the in-memory progress. UI updates immediately.
   */
  updateProgress(updates: Partial<Omit<ReadingProgress, 'novelId' | 'deviceId'>>) {
    const current = this._progress();
    if (!current) return;

    this._progress.set({ ...current, ...updates });
    this.scheduleAutoSave();
  }

  /**
   * Schedules an auto-save after a delay. If another update comes in
   * before the save fires, the timer is reset.
   */
  private scheduleAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.saveNow();
    }, SAVE_DEBOUNCE_MS);
  }

  /**
   * Immediately saves progress to IndexedDB and enqueues a sync operation.
   */
  async saveNow(): Promise<void> {
    const current = this._progress();
    if (!current) return;

    await this.library.saveProgress(current);
    this.autoSaveTimer = null;
  }

  /**
   * Creates or updates progress for a novel.
   */
  setProgress(novelId: string, chapterId: string, chapterNumber: number, percent: number, scrollPos?: number) {
    this._progress.set({
      novelId,
      chapterId,
      chapterNumber,
      progressPercent: percent,
      scrollPosition: scrollPos,
      updatedAt: Date.now(),
      deviceId: this.deviceId,
    });
    this.scheduleAutoSave();
  }

  /**
   * Saves progress when the page becomes hidden or the app is closing.
   */
  saveOnVisibilityChange() {
    if (document.hidden) {
      this.saveNow();
    }
  }

  /**
   * Cleans up timers when the component is destroyed.
   */
  cleanup() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}
