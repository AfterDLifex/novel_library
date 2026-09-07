import { Component, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SearchCoordinatorService } from '../../../features/search/services/search-coordinator.service';
import { DatabaseService } from '../../../core/database/database.service';
import { NovelDetails } from '../../../models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { CoverImageComponent } from '../../../shared/components/cover-image/cover-image.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ChapterListComponent } from '../chapter-list/chapter-list.component';

@Component({
  selector: 'app-novel-details',
  templateUrl: './novel-details.component.html',
  styleUrl: './novel-details.component.scss',
  standalone: true,
  imports: [
    CommonModule, LoadingSpinnerComponent, ErrorMessageComponent,
    CoverImageComponent, IconComponent, StatusBadgeComponent, ChapterListComponent,
  ],
})
export class NovelDetailsComponent {
  readonly details = signal<NovelDetails | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private route = inject(ActivatedRoute);
  private coordinator = inject(SearchCoordinatorService);
  private db = inject(DatabaseService);

  readonly novelId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  constructor() {
    effect(() => {
      const id = this.novelId();
      if (id) this.load();
    });
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const details = await this.coordinator.getNovelDetails(this.novelId());
      if (details) {
        this.details.set(details);
      } else {
        this.error.set('Novel not found');
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading.set(false);
    }
  }

  async addToLibrary() {
    const d = this.details();
    if (!d) return;
    await this.db.addToLibrary(d as any);
  }

    startReading() {
    const d = this.details();
    if (!d || !d.chapters?.length) return;
    const firstChapter = d.chapters[0];
    window.location.href = `/reader/${this.novelId()}/${firstChapter.id}`;
  }

  openReader(chapterId: string) {
    window.location.href = `/reader/${this.novelId()}/${chapterId}`;
  }
}
