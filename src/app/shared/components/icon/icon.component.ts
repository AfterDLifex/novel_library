import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: `
    <svg [attr.viewBox]="viewBox" [attr.width]="size" [attr.height]="size" fill="currentColor" aria-hidden="true">
      <path [attr.d]="path" />
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  @Input() name!: IconName;
  @Input() size = 24;

  protected viewBox = '0 0 24 24';
  protected path = '';

  protected readonly iconData = iconRegistry;

  ngOnChanges() {
    const data = this.iconData[this.name as IconName];
    if (data) {
      this.viewBox = data.viewBox;
      this.path = data.path;
    }
  }
}

export type IconName = keyof typeof iconRegistry;

const iconRegistry = {
  home: { viewBox: '0 0 24 24', path: 'M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3z' },
  search: { viewBox: '0 0 24 24', path: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.16 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.66 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.62 14 5 11.38 5 8.5S7.62 3 10.5 3 16 5.62 16 8.5 13.38 14 10.5 14z' },
  library: { viewBox: '0 0 24 24', path: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm17-3H6v14h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13h-1V8H7v11h14z' },
  bookmarks: { viewBox: '0 0 24 24', path: 'M19 19V5l-7 4-7-4v14l7 4 7-4z' },
  history: { viewBox: '0 0 24 24', path: 'M13 3a9 9 0 0 7-9 9H3c0 5.52 4.48 10 10 10 5.52 0 10-4.48 10-10v-1h-1zm-1 8l4.5-2.5L16 13l-4 2.25V11z' },
  collections: { viewBox: '0 0 24 24', path: 'M4 6h16v2H4zm0 4h16v10H4zm0 12h16v2H4z' },
  settings: { viewBox: '0 0 24 24', path: 'M12 8a4 4 0 100 8 4 4 0 000-8zM19.4 13A7.5 7.5 0 0019.4 11h-2.53A5.99 5.99 0 0015 7.73l1.76-2.44 1.35.52a6 6 0 010 10.44l-1.76-2.44A5.99 5.99 0 0014.87 16h2.53zm-14.8 0a6 6 0 010-10.44l1.76 2.44A5.99 5.99 0 009.03 11h-2.53a7.5 7.5 0 000 2z' },
  close: { viewBox: '0 0 24 24', path: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' },
  back: { viewBox: '0 0 24 24', path: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z' },
  add: { viewBox: '0 0 24 24', path: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z' },
  addCircle: { viewBox: '0 0 24 24', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-5.5h-2V12H11v1.5H9V12H7v-2h2V8.5h2V12h2z' },
  check: { viewBox: '0 0 24 24', path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 20.59 7.83 19 6.24z' },
  delete: { viewBox: '0 0 24 24', path: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1H9.5l-1 1H5v2h14V4z' },
  edit: { viewBox: '0 0 24 24', path: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.74-2.74l9.19-9.19 1.86 1.86-9.19 9.19H4.5v-1.85l-.26-.26zm3.45-1.25l5.18-5.18 1.41 1.41-5.18 5.18H9.74v-1.41l-.25-.25z' },
  moreVert: { viewBox: '0 0 24 24', path: 'M12 8a4 4 0 100 8 4 4 0 000-8zm0-2a6 6 0 110 12A6 6 0 0112 6zm0 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z' },
  star: { viewBox: '0 0 24 24', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7.91 15.14 4 9.27z' },
  starBorder: { viewBox: '0 0 24 24', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7.91 15.14 4 9.27z' },
  arrowForward: { viewBox: '0 0 24 24', path: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z' },
  arrowBack: { viewBox: '0 0 24 24', path: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z' },
  cloudSync: { viewBox: '0 0 24 24', path: 'M12 4.5C9.16 4.5 6.83 6.16 5.8 8.5 3.15 8.94 1 11.25 1 14c0 3.31 2.69 6 6 6h1V9.5h5.5c1.39 0 2.5-1.11 2.5-2.5S18.89 4.5 17 4.5c-.62 0-1.2.14-1.74.41l-.76.41V7h-1.5V4.5H12z' },
  error: { viewBox: '0 0 24 24', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
  visibility: { viewBox: '0 0 24 24', path: 'M12 4.5C7 4.5 2.73 7.75 2 12.5c.73 4.75 5 8 10 8s9.27-3.25 10-8c-.73-4.75-5-8-10-8zm0 13.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z' },
};
