import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Collection, LibraryItem } from '../../models';
import { DatabaseService } from '../../core/database/database.service';


@Component({
  selector: 'app-collections-page',
  template: `
    <div class="page">
      <header class="page-header">
        <h1>Collections</h1>
        <button class="add-btn" (click)="startNew()">
          <app-icon name="add" [size]="18" /> New Collection
        </button>
      </header>

      <div class="collections-list" *ngIf="items().length > 0; else empty">
        <div *ngFor="let col of items()" class="collection-card">
          <div class="collection-header">
            <h3>{{ col.name }}</h3>
            <button class="menu-btn" (click)="delete(col)">
              <app-icon name="delete" [size]="16" />
            </button>
          </div>
          <p class="desc" *ngIf="col.description">{{ col.description }}</p>
          <div class="novels-count">{{ col.novelIds.length }} novels</div>
          <div class="tags">
            <span *ngFor="let id of col.novelIds.slice(0, 3)" class="tag">{{ getNovelTitle(id) }}</span>
            <span *ngIf="col.novelIds.length > 3" class="tag">+{{ col.novelIds.length - 3 }} more</span>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <app-empty-state icon="collections" title="No collections" message="Create a collection to group novels together." />
      </ng-template>

      @if (editing()) {
        <div class="overlay" (click)="editing.set(false)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <h3>{{ editingCollection()?.id ? 'Edit' : 'New' }} Collection</h3>
            <input type="text" placeholder="Name" [(ngModel)]="editingCollection()!.name" />
            <textarea placeholder="Description (optional)" [(ngModel)]="editingCollection()!.description"></textarea>
            <div class="dialog-actions">
              <button class="secondary-btn" (click)="editing.set(false)">Cancel</button>
              <button class="primary-btn" (click)="save()">Save</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .page-header h1 { font-size: 1.25rem; margin: 0; }
    .add-btn { display: flex; align-items: center; gap: 0.3rem; padding: 0.4rem 0.8rem; background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.85rem; }
    .collections-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .collection-card { padding: 0.75rem; border-radius: 0.5rem; background: var(--md-sys-color-surface); box-shadow: var(--md-sys-elevation-1); }
    .collection-header { display: flex; justify-content: space-between; align-items: center; }
    .collection-header h3 { font-size: 1rem; margin: 0; }
    .menu-btn { background: none; border: none; cursor: pointer; padding: 0.2rem; color: var(--md-sys-color-on-surface-variant); }
    .desc { font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant); margin: 0.3rem 0; }
    .novels-count { font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin: 0.25rem 0; }
    .tags { display: flex; gap: 0.25rem; flex-wrap: wrap; }
    .tag { font-size: 0.7rem; background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent); color: var(--md-sys-color-primary); padding: 0.1rem 0.4rem; border-radius: 0.25rem; }
    .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
    .dialog { background: var(--md-sys-color-surface); border-radius: 0.75rem; padding: 1.5rem; width: 90%; max-width: 400px; }
    .dialog h3 { margin: 0 0 1rem; }
    .dialog input, .dialog textarea { width: 100%; padding: 0.5rem; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 0.3rem; background: var(--md-sys-color-surface-container); color: var(--md-sys-color-on-surface); margin-bottom: 0.5rem; font-family: inherit; }
    .dialog textarea { min-height: 80px; resize: vertical; }
    .dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .secondary-btn, .primary-btn { padding: 0.4rem 1rem; border: none; border-radius: 0.3rem; cursor: pointer; font-weight: 600; }
    .secondary-btn { background: var(--md-sys-color-surface-variant); }
    .primary-btn { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, EmptyStateComponent],
})
export class CollectionsPageComponent {
  readonly items = signal<Collection[]>([]);
  readonly editing = signal(false);
  readonly editingCollection = signal<Collection | null>(null);
  readonly libraryItems = signal<LibraryItem[]>([]);

  constructor(private db: DatabaseService) {
    this.load();
  }

  async load() {
    this.items.set(await this.db.getAllCollections());
    this.libraryItems.set(await this.db.getAllLibraryItems());
  }

  getNovelTitle(id: string): string {
    return this.libraryItems().find((i) => i.novelId === id)?.title ?? id;
  }

  startNew() {
    this.editingCollection.set({ id: `col_${crypto.randomUUID()}`, name: '', description: '', novelIds: [], createdAt: Date.now(), updatedAt: Date.now() });
    this.editing.set(true);
  }

  async save() {
    const col = this.editingCollection();
    if (!col || !col.name.trim()) return;
    col.updatedAt = Date.now();
    await this.db.saveCollection(col);
    this.editing.set(false);
    this.editingCollection.set(null);
    await this.load();
  }

  async delete(col: Collection) {
    if (!confirm(`Delete collection "${col.name}"?`)) return;
    await this.db.deleteCollection(col.id);
    await this.load();
  }
}