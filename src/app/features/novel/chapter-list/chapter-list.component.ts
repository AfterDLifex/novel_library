import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { SearchCoordinatorService } from '../../../features/search/services/search-coordinator.service';
import { Chapter } from '../../../models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ScrollShadowDirective } from '../../../shared/directives/scroll-shadow.directive';

@Component({
  selector: 'app-chapter-list',
  template: `
    <div class="chapter-list" appScrollShadow>
      @if (loading()) {
        <div class="loading">Loading chapters...</div>
      } @else {
        <cdk-virtual-scroll-viewport itemSize="56" class="viewport">
          <div
            *cdkVirtualFor="let chapter of chapters(); let i = index"
            class="chapter-item"
            [class.current]="readChapters.has(chapter.id)"
            (click)="select(chapter)"
          >
            <span class="num">Ch. {{ chapter.number }}</span>
            <span class="title">{{ chapter.title }}</span>
            <app-icon *ngIf="readChapters.has(chapter.id)" name="check" size="16" class="read-icon" />
          </div>
        </cdk-virtual-scroll-viewport>
      }
    </div>
  `,
  styles: [`
    .chapter-list {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .viewport { height: 300px; width: 100%; }
    .chapter-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      transition: background 0.15s;
    }
    .chapter-item:hover { background: color-mix(in srgb, var(--md-sys-color-on-surface) 4%, transparent); }
    .chapter-item.current { background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent); }
    .chapter-item:last-child { border-bottom: none; }
    .num { font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); min-width: 80px; }
    .title { font-size: 0.85rem; flex: 1; }
    .read-icon { color: var(--md-sys-color-primary); margin-left: auto; }
    .loading { padding: 1rem; text-align: center; color: var(--md-sys-color-on-surface-variant); }
  `],
  standalone: true,
  imports: [CommonModule, IconComponent, CdkVirtualScrollViewport, CdkVirtualForOf, ScrollShadowDirective],
})
export class ChapterListComponent implements OnInit {
  @Input() chapterCount: number = 0;
  @Input() novelId: string = '';
  @Input() readChapters: Set<string> = new Set();
  @Output() chapterSelected = new EventEmitter<string>();

  readonly chapters = signal<Chapter[]>([]);
  readonly loading = signal(true);

  private coordinator = inject(SearchCoordinatorService);

  async ngOnInit() {
    if (this.novelId) {
      const chs = await this.coordinator.getChapters(this.novelId);
      this.chapters.set(chs);
      this.loading.set(false);
    }
  }

  select(chapter: Chapter) {
    this.chapterSelected.emit(chapter.id);
  }
}
