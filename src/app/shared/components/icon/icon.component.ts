import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * A small shape-DSL used to draw crisp, stroke-based SVG icons.
 * Rendering primitives directly (path / circle / ellipse / rect / line)
 * keeps the markup safe (no innerHTML), theme-aware (currentColor) and
 * identical in weight across every size.
 */
interface PathPrim {
  t: 'p';
  d: string;
  f?: string;
  w?: number;
}
interface CirclePrim {
  t: 'c';
  cx: number;
  cy: number;
  r: number;
  f?: string;
}
interface RectPrim {
  t: 'r';
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  f?: string;
}
interface EllipsePrim {
  t: 'e';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  f?: string;
}
interface LinePrim {
  t: 'l';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
type Prim = PathPrim | CirclePrim | RectPrim | EllipsePrim | LinePrim;

const p = (d: string, f?: string, w?: number): Prim => ({ t: 'p', d, f, w });
const c = (cx: number, cy: number, r: number, f?: string): Prim => ({ t: 'c', cx, cy, r, f });
const r = (x: number, y: number, w: number, h: number, rx?: number, f?: string): Prim => ({ t: 'r', x, y, w, h, rx, f });
const e = (cx: number, cy: number, rx: number, ry: number, f?: string): Prim => ({ t: 'e', cx, cy, rx, ry, f });
const l = (x1: number, y1: number, x2: number, y2: number): Prim => ({ t: 'l', x1, y1, x2, y2 });

@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.viewBox]="viewBox"
      [attr.width]="size"
      [attr.height]="size"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <ng-container *ngFor="let s of shapes">
        <path *ngIf="s.t === 'p'" [attr.d]="s.d" [attr.fill]="s.f ?? null" [attr.stroke-width]="s.w ?? null" />
        <circle *ngIf="s.t === 'c'" [attr.cx]="s.cx" [attr.cy]="s.cy" [attr.r]="s.r" [attr.fill]="s.f ?? null" />
        <rect *ngIf="s.t === 'r'" [attr.x]="s.x" [attr.y]="s.y" [attr.width]="s.w" [attr.height]="s.h" [attr.rx]="s.rx ?? null" [attr.fill]="s.f ?? null" />
        <ellipse *ngIf="s.t === 'e'" [attr.cx]="s.cx" [attr.cy]="s.cy" [attr.rx]="s.rx" [attr.ry]="s.ry" [attr.fill]="s.f ?? null" />
        <line *ngIf="s.t === 'l'" [attr.x1]="s.x1" [attr.y1]="s.y1" [attr.x2]="s.x2" [attr.y2]="s.y2" />
      </ng-container>
    </svg>
  `,
  styles: [
    `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    :host-context(svg) {
      vertical-align: middle;
    }
  `,
  ],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  @Input() name!: IconName;
  @Input() size = 24;

  protected viewBox = '0 0 24 24';
  protected shapes: Prim[] = [];

  ngOnChanges() {
    this.shapes = iconRegistry[this.name] ?? [];
  }
}

export type IconName = keyof typeof iconRegistry;

/** Premium, hand-tuned stroke icons (24x24 viewBox) */
const iconRegistry = {
  home: [
    p('M3.6 11.8H20.4'),
    p('M4.6 11.8V8.4M19.4 11.8V8.4'),
    p('M4.6 8.4l7.4-4.6M19.4 8.4l-7.4-4.6'),
    p('M11 11.8v3.6'),
  ],
  search: [c(10.4, 10.6, 7.2), p('M13.6 11.8l3.8 4.2')],
  library: [
    p('M4.6 5.6H19.4M4.6 9.8H19.4M4.6 14H19.4M4.6 18.2H19.4'),
    p('M5.8 5.6v4.2M9.6 9.8v4.2M6.8 14v4.2M13.6 14v4.2M16.6 9.8v4.2M17.8 5.6v4.2'),
  ],
  bookmarks: [
    p('M9.6 4.4V16M15.6 4.4V16M9.6 4.4H15.6'),
    p('M11 15l1.6-2.4M15.6 15l-1.6-2.4'),
  ],
  history: [c(12, 12, 8.2), p('M12 12V6.4M12 12l4.6 0M9.4 12l-.6 0')],
  collections: [r(4, 5, 16, 14, 1.2), p('M5.6 9.4h12.8M5.6 9.4v6M18.4 9.4v6')],
  settings: [
    c(12, 12, 5.6),
    c(12, 12, 1.7),
    p('M12 6.4v10.4M6.4 12h11.2M12 6.4l3.5 3.5M12 6.4l-3.5 3.5M12 16.8l3.5-3.5M12 16.8l-3.5-3.5'),
  ],
  close: [p('M6.2 6.2l11.6 11.6M17.8 6.2l-11.6 11.6')],
  back: [p('M20.2 12H13M13 12l-2.4-3.4M13 12l-2.4 3.4')],
  add: [p('M7.6 12h8.8M12 7.6v8.8')],
  addCircle: [c(12, 12, 8.6), p('M9.2 12h5.6M12 9.2v5.6')],
  check: [p('M4.6 15l2.2 5.2M7.8 13l1.6 2.4M9.2 9.6l6.8-6.8')],
  delete: [
    p('M6.4 4.8h11.2M7.4 6.4h9.2'),
    p('M8 6.4v9.6M16 6.4v9.6M8 16h8'),
    p('M7 6.4l.8-1.5M17 6.4l-.8-1.5'),
    p('M9 6.4h6'),
  ],
  edit: [r(9.2, 4, 5.6, 13.6, 1.2), p('M9.7 17.6l2.3-3M15.3 17.6l-2.3-3')],
  moreVert: [c(12, 6, 1.6), c(12, 12, 1.6), c(12, 18, 1.6)],
  star: [p('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7.91 15.14 4 9.27z', 'currentColor', 0)],
  starBorder: [p('M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24z', undefined, 1.5)],
  arrowForward: [p('M3.6 12H10.6M10.6 12l2.5-3.5M10.6 12l2.5 3.5')],
  arrowBack: [p('M20.4 12H13.4M13.4 12l-2.5-3.5M13.4 12l-2.5 3.5')],
  cloudSync: [
    c(7.6, 13, 3.6),
    c(12, 13, 3.6),
    c(16.4, 13, 3.6),
    p('M12 10.2v-3M12 7.2l1.3-1.3M12 15.8v3'),
  ],
  error: [p('M7 5.8h10M7 5.8l5 11.4M17 5.8l-5 11.4M12 11.6v-3M12 15.9v1.1')],
  visibility: [e(12.2, 11.8, 5.8, 4.3), c(12.2, 12, 1.9)],
  source: [c(12, 12, 7.2), p('M5.4 12h13.2M12 5.4v13.2')],
  filter: [p('M8.4 5.2h7.2M9.6 7.8l1.8 4.8M16.2 7.8l-1.8 4.8M11.4 15l.4 2.4')],
  refresh: [c(12, 12, 6.4), p('M12 6.6l-1.6 2.8M12 9.4l3.1-1.6')],
  globe: [c(12, 12, 7.2), p('M5.4 12h13.2'), e(12, 12, 4.2, 7.2), e(12, 12, 7.2, 4.2)],
  book: [
    p('M12 6.6v10.4M12 6.6l-7.4 7.6M12 6.6l7.4 7.6M4.6 14.2h7.4M11.2 14.2h1.4'),
  ],
};
