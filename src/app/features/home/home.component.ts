import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NovelCardComponent } from '../../shared/components/novel-card/novel-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LibraryStore } from '../library/library.store';


@Component({
  selector: 'app-home',
  template: `
    <div class="home">
      <section class="section" *ngIf="store.continueReading().length > 0">
        <header class="section-header">
          <h2>Continue Reading</h2>
          <a routerLink="/library" class="see-all">See all</a>
        </header>
        <div class="grid">
          <app-novel-card
            *ngFor="let item of store.continueReading()"
            [novel]="item"
            
            
          />
        </div>
      </section>

      <section class="section" *ngIf="store.favorites().length > 0">
        <header class="section-header">
          <h2>Favorites</h2>
          <a routerLink="/library?favorites=1" class="see-all">See all</a>
        </header>
        <div class="grid">
          <app-novel-card
            *ngFor="let item of store.favorites()"
            [novel]="item"
            [showProgress]="false"
          />
        </div>
      </section>

      <section class="section">
        <header class="section-header">
          <h2>Recent Additions</h2>
          <a routerLink="/library" class="see-all">See all</a>
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
            message="Search for novels and add them to your library to get started."
          >
            <a routerLink="/search" class="action-btn">
              <app-icon name="search" [size]="18" />
              Search Novels
            </a>
          </app-empty-state>
        </ng-template>
      </section>
    </div>
  `,
  styles: [`
    .home { padding: 1rem; }
    .section { margin-bottom: 2rem; }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .section-header h2 { font-size: 1.1rem; margin: 0; }
    .see-all {
      font-size: 0.8rem;
      color: var(--md-sys-color-primary);
      text-decoration: none;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.6rem;
    }
    app-novel-card { width: 100%; }
    @media (max-width: 640px) {
      .home { padding: 0.9rem 0.75rem; }
      .grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.5rem; }
    }
    @media (max-width: 400px) {
      .grid { grid-template-columns: 1fr 1fr; gap: 0.4rem; }
      .section-header h2 { font-size: 1rem; }
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
      color: var(--md-sys-color-primary);
      border-radius: 0.5rem;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
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
  constructor(readonly store: LibraryStore) {}
}
