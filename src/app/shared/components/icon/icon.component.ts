import { Component, Input, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  `,
  ],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent implements OnChanges {
  @Input() name!: IconName;
  @Input() size = 24;

  protected viewBox = '0 0 24 24';
  protected shapes: Prim[] = [];

  ngOnChanges() {
    this.shapes = iconRegistry[this.name] ?? [];
  }
}

export type IconName = keyof typeof iconRegistry;

const iconRegistry = {
  home: [
    p('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'),
    p('M9 22V12h6v10'),
  ],
  search: [
    c(11, 11, 7),
    p('M21 21l-4.35-4.35'),
  ],
  library: [
    p('M4 19.5A2.5 2.5 0 0 1 6.5 17H20'),
    p('M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'),
  ],
  bookmarks: [
    p('M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'),
  ],
  history: [
    c(12, 12, 9),
    l(12, 7, 12, 12),
    l(12, 12, 16, 14),
  ],
  collections: [
    r(3, 3, 18, 18, 3),
    l(3, 9, 21, 9),
    l(9, 21, 9, 9),
  ],
  settings: [
    c(12, 12, 3),
    p('M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'),
  ],
  close: [l(18, 6, 6, 18), l(6, 6, 18, 18)],
  back: [p('M19 12H5M12 19l-7-7 7-7')],
  add: [l(12, 5, 12, 19), l(5, 12, 19, 12)],
  addCircle: [c(12, 12, 9), l(12, 8, 12, 16), l(8, 12, 16, 12)],
  check: [p('M20 6L9 17l-5-5')],
  delete: [
    p('M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'),
  ],
  edit: [
    p('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'),
    p('M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'),
  ],
  moreVert: [c(12, 5, 1.5), c(12, 12, 1.5), c(12, 19, 1.5)],
  star: [p('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7.91 15.14 4 9.27z', 'currentColor', 0)],
  starBorder: [p('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7.91 15.14 4 9.27z')],
  arrowForward: [p('M5 12h14M12 5l7 7-7 7')],
  arrowBack: [p('M19 12H5M12 19l-7-7 7-7')],
  cloudSync: [
    p('M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'),
  ],
  error: [c(12, 12, 9), l(12, 8, 12, 12), l(12, 16, 12.01, 16)],
  visibility: [
    p('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'),
    c(12, 12, 3),
  ],
  filter: [p('M22 3H2l8 9.46V19l4 2v-8.54L22 3z')],
  sort: [l(11, 5, 21, 5), l(11, 12, 18, 12), l(11, 19, 15, 19), l(3, 17, 3, 5), p('M7 9L3 5 1 9')],
  gridView: [r(3, 3, 7, 7, 1), r(14, 3, 7, 7, 1), r(14, 14, 7, 7, 1), r(3, 14, 7, 7, 1)],
  listView: [l(8, 6, 21, 6), l(8, 12, 21, 12), l(8, 18, 21, 18), l(3, 6, 3.01, 6), l(3, 12, 3.01, 12), l(3, 18, 3.01, 18)],
  download: [p('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'), p('M7 10l5 5 5-5'), l(12, 15, 12, 3)],
  share: [c(18, 5, 3), c(6, 12, 3), c(18, 19, 3), l(8.59, 13.51, 15.42, 17.49), l(15.41, 6.51, 8.59, 10.49)],
  stats: [l(18, 20, 18, 10), l(12, 20, 12, 4), l(6, 20, 6, 14)],
  bookOpen: [p('M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'), p('M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z')],
  textFormat: [p('M4 7V4h16v3'), l(12, 4, 12, 20)],
  fontIncrease: [p('M4 19L10 5l6 14'), l(6, 14, 14, 14), l(18, 9, 23, 9), l(20.5, 6.5, 20.5, 11.5)],
  fontDecrease: [p('M4 19L10 5l6 14'), l(6, 14, 14, 14), l(18, 9, 23, 9)],
  moon: [p('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z')],
  sun: [c(12, 12, 5), l(12, 1, 12, 3), l(12, 21, 12, 23), l(4.22, 4.22, 5.64, 5.64), l(18.36, 18.36, 19.78, 19.78), l(1, 12, 3, 12), l(21, 12, 23, 12), l(4.22, 19.78, 5.64, 18.36), l(18.36, 5.64, 19.78, 4.22)],
  chevronDown: [p('M6 9l6 6 6-6')],
  chevronUp: [p('M18 15l-6-6-6 6')],
  refresh: [p('M23 4v6h-6'), p('M1 20v-6h6'), p('M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15')],
  source: [c(12, 12, 7.2), p('M5.4 12h13.2M12 5.4v13.2')],
  globe: [c(12, 12, 9), l(2, 12, 22, 12), e(12, 12, 5, 9)],
  book: [p('M4 19.5A2.5 2.5 0 0 1 6.5 17H20'), p('M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z')],
  bookmarkAdd: [p('M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'), l(12, 7, 12, 13), l(9, 10, 15, 10)],
  openInNew: [p('M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'), p('M15 3h6v6'), l(10, 14, 21, 3)],
  chat: [p('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z')],
  person: [c(12, 8, 4), p('M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2')],
};
