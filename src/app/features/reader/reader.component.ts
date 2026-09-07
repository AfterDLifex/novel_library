import { Component, signal, computed, ElementRef, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressTrackerService } from './progress-tracker.service';
import { ReaderSettingsService } from './reader-settings.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Chapter } from '../../models';
import { SearchCoordinatorService } from '../search/services/search-coordinator.service';


@Component({
  selector: 'app-reader',
  templateUrl: './reader.component.html',
  styleUrl: './reader.component.scss',
  standalone: true,
  imports: [CommonModule, IconComponent, LoadingSpinnerComponent],
})
export class ReaderComponent implements OnInit, OnDestroy {
  @ViewChild('contentEl', { static: true }) contentEl!: ElementRef;

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private coordinator: SearchCoordinatorService,
    private progressTracker: ProgressTrackerService,
    public readerSettings: ReaderSettingsService,
  ) { }

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly chapters = signal<Chapter[]>([]);
  readonly currentChapter = signal<Chapter | null>(null);
  readonly showControls = signal(true);
  readonly progressPercent = signal(0);
  readonly fontSize = this.readerSettings.fontSize;
  readonly theme = this.readerSettings.theme;
  readonly isBottomSheetOpen = signal(false);

  readonly novelIdVal: string = '';
  private chapterId: string = '';
  private scrollTimer: any = null;

  readonly readerStyle = computed(() => ({
    '--reader-font-size': `${this.fontSize()}px`,
    '--reader-line-height': this.readerSettings.lineHeight(),
    '--reader-font-family': this.readerSettings.fontFamily(),
  } as Record<string, string>));



  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('novelId') ?? '';
    const chParam = this.route.snapshot.paramMap.get('chapterId') ?? '';
    this.novelIdVal = idParam.startsWith('novel:') ? idParam : `novel:${idParam}`;
    this.chapterId = chParam;

    await this.loadChapters();
    await this.loadProgress();

    // Save on visibility change
    document.addEventListener('visibilitychange', () => {
      this.progressTracker.saveOnVisibilityChange();
    });
  }

  ngOnDestroy() {
    this.progressTracker.cleanup();
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
  }

  async loadChapters() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const all = await this.coordinator.getChapters(this.novelIdVal);
      this.chapters.set(all);
      const ch = all.find((c) => c.id === this.chapterId);
      if (ch) {
        this.currentChapter.set(ch);
      } else if (all.length > 0) {
        this.currentChapter.set(all[0]);
        this.router.navigate(['/reader', this.novelIdVal, all[0].id]);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading.set(false);
    }
  }

  async loadProgress() {
    const progress = await this.progressTracker.loadProgress(
      this.novelIdVal.replace(/^novel:/, '')
    );
    if (progress && this.contentEl) {
      setTimeout(() => {
        const el = this.contentEl.nativeElement as HTMLElement;
        if (progress.scrollPosition && el.scrollHeight > progress.scrollPosition) {
          el.scrollTop = progress.scrollPosition;
        }
      }, 100);
    }
  }

  onScroll() {
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      const el = this.contentEl.nativeElement as HTMLElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight;
      const clientHeight = el.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll > 0) {
        const percent = Math.min(100, Math.round((scrollTop / maxScroll) * 100));
        this.progressPercent.set(percent);

        this.progressTracker.updateProgress({
          progressPercent: percent,
          scrollPosition: scrollTop,
        });
      }
    }, 500);
  }

  toggleControls() {
    this.showControls.update((v) => !v);
  }

  toggleBottomSheet() {
    this.isBottomSheetOpen.update((v) => !v);
  }

  prevChapter() {
    const all = this.chapters();
    const current = this.currentChapter();
    if (!current || all.length === 0) return;
    const idx = all.findIndex((c) => c.number === current.number);
    if (idx > 0) {
      const prev = all[idx - 1];
      this.router.navigate(['/reader', this.novelIdVal, prev.id]);
    }
  }

  nextChapter() {
    const all = this.chapters();
    const current = this.currentChapter();
    if (!current || all.length === 0) return;
    const idx = all.findIndex((c) => c.number === current.number);
    if (idx < all.length - 1) {
      const next = all[idx + 1];
      this.router.navigate(['/reader', this.novelIdVal, next.id]);
    }
  }

  async goToChapter(num: number) {
    const chapter = this.chapters().find((c) => c.number === num);
    if (chapter) {
      this.router.navigate(['/reader', this.novelIdVal, chapter.id]);
    }
  }

  async changeFontSize(delta: number) {
    const current = this.fontSize();
    await this.readerSettings.updateFontSize(Math.max(12, Math.min(32, current + delta)));
  }
}
