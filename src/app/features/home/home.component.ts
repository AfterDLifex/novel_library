import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NovelCardComponent } from '../../shared/components/novel-card/novel-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LibraryStore } from '../library/library.store';

@Component({
  selector: 'app-home',
  template: `
    <div class="home content-shell">
      <!-- Welcome & Stats Dashboard Banner -->
      <section class="dashboard-banner glass-strong lift">
        <div class="banner-content">
          <h2 class="greeting">Welcome to Novel Library</h2>
          <p class="subtitle">Track your reading progress, manage your collection & discover new stories.</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <app-icon name="library" [size]="20" class="stat-icon" />
              <div class="stat-info">
                <span class="stat-value">{{ totalNovels() }}</span>
                <span class="stat-label">In Library</span>
              </div>
            </div>
            <div class="stat-card">
              <app-icon name="bookOpen" [size]="20" class="stat-icon reading" />
              <div class="stat-info">
                <span class="stat-value">{{ readingCount() }}</span>
                <span class="stat-label">Reading</span>
              </div>
            </div>
            <div class="stat-card">
              <app-icon name="check" [size]="20" class="stat-icon completed" />
              <div class="stat-info">
                <span class="stat-value">{{ completedCount() }}</span>
                <span class="stat-label">Completed</span>
              </div>
            </div>
            <div class="stat-card">
              <app-icon name="star" [size]="20" class="stat-icon favorite" />
              <div class="stat-info">
                <span class="stat-value">{{ favoriteCount() }}</span>
                <span class="stat-label">Favorites</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Continue Reading Section -->
      <section class="section" *ngIf="store.continueReading().length > 0">
        <header class="section-header">
          <div class="header-title">
            <app-icon name="history" [size]="20" />
            <h2>Continue Reading</h2>
          </div>
          <a routerLink="/library" class="see-all">
            See all <app-icon name="arrowForward" [size]="14" />
          </a>
        </header>
        <div class="grid">
          <app-novel-card
            *ngFor="let item of store.continueReading()"
            [novel]="item"
          />
        </div>
      </section>

      <!-- Favorites Section -->
      <section class="section" *ngIf="store.favorites().length > 0">
        <header class="section-header">
          <div class="header-title">
            <app-icon name="star" [size]="20" class="fav-icon" />
            <h2>Favorites</h2>
          </div>
          <a routerLink="/library" [queryParams]="{ filter: 'favorites' }" class="see-all">
            See all <app-icon name="arrowForward" [size]="14" />
          </a>
        </header>
        <div class="grid">
          <app-novel-card
            *ngFor="let item of store.favorites()"
            [novel]="item"
            [showProgress]="false"
          />
        </div>
      </section>

      <!-- Recent Additions Section -->
      <section class="section">
        <header class="section-header">
          <div class="header-title">
            <app-icon name="library" [size]="20" />
            <h2>Recent Additions</h2>
          </div>
          <a routerLink="/library" class="see-all">
            See all <app-icon name="arrowForward" [size]="14" />
          </a>
        </header>
        
        <div class="grid" *ngIf="store.recentAdditions().length > 0; else empty">
          <app-novel-card
            *ngFor="let item of store.recentAdditions()"
            [novel]="item"
          />
        </div>
        
        <ng-template #empty>
          <app-empty-state
            icon="library"
            title="Your library is empty"
            message="Search across online sources and add novels to your library to get started."
          >
            <a routerLink="/search" class="action-btn glass lift">
              <app-icon name="search" [size]="18" />
              Discover & Search Novels
            </a>
          </app-empty-state>
        </ng-template>
      </section>
    </div>
  `,
  styles: [`
    .home {
      padding-top: 1.25rem;
      padding-bottom: 2rem;
    }
    
    .dashboard-banner {
      padding: 1.5rem;
      border-radius: var(--radius-large);
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }
    
    .greeting {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
      letter-spacing: -0.02em;
    }
    
    .subtitle {
      font-size: 0.85rem;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0 0 1.25rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.75rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-medium);
      background: color-mix(in srgb, var(--md-sys-color-surface) 60%, transparent);
      border: 1px solid var(--glass-border);
    }

    .stat-icon {
      color: var(--md-sys-color-primary);
    }
    .stat-icon.reading { color: var(--md-sys-color-secondary); }
    .stat-icon.completed { color: #4caf50; }
    .stat-icon.favorite { color: #ffd700; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 700;
      line-height: 1.1;
    }

    .stat-label {
      font-size: 0.72rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    .section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--md-sys-color-on-background);
    }

    .header-title h2 {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .fav-icon { color: #ffd700; }

    .see-all {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--md-sys-color-primary);
      text-decoration: none;
      transition: color 0.2s;
    }
    .see-all:hover {
      text-decoration: underline;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.85rem;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.65rem 1.25rem;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-radius: var(--radius-medium);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .grid {
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 0.65rem;
      }
      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NovelCardComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly totalNovels = computed(() => this.store.items().length);
  readonly readingCount = computed(() => this.store.items().filter(i => i.status === 'reading').length);
  readonly completedCount = computed(() => this.store.items().filter(i => i.status === 'completed').length);
  readonly favoriteCount = computed(() => this.store.favorites().length);

  constructor(readonly store: LibraryStore) {}
}
