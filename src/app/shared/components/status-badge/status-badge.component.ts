import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="badge" [class]="statusClass" [title]="label">
      {{ label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 0.375rem;
      line-height: 1.4;
    }
        .reading { background: color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent); color: var(--md-sys-color-primary); }
    .completed { background: color-mix(in srgb, var(--md-sys-color-secondary) 15%, transparent); color: var(--md-sys-color-secondary); }
    .planned { background: color-mix(in srgb, var(--md-sys-color-outline-variant) 20%, transparent); color: var(--md-sys-color-on-surface-variant); }
    .dropped { background: color-mix(in srgb, var(--md-sys-color-error) 15%, transparent); color: var(--md-sys-color-error); }
    .ongoing { background: color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent); color: var(--md-sys-color-primary); }
    .hiatus { background: color-mix(in srgb, var(--md-sys-color-outline-variant) 20%, transparent); color: var(--md-sys-color-on-surface-variant); }
    .unknown { background: color-mix(in srgb, var(--md-sys-color-outline-variant) 20%, transparent); color: var(--md-sys-color-on-surface-variant); }
  `],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  @Input() status: 'reading' | 'completed' | 'planned' | 'dropped' | 'ongoing' | 'hiatus' | 'unknown' = 'planned';

  get label(): string {
    const labels: Record<string, string> = {
      reading: 'Reading',
      completed: 'Completed',
      planned: 'Planned',
      dropped: 'Dropped',
      ongoing: 'Ongoing',
      hiatus: 'Hiatus',
      unknown: 'Unknown',
    };
    return labels[this.status] ?? this.status;
  }

  get statusClass(): string {
    return this.status;
  }
}
