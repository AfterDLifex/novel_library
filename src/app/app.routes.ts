import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/pages/search-page/search-page.component').then((m) => m.SearchPageComponent),
  },
  {
    path: 'library',
    loadComponent: () => import('./features/library/components/library-page/library-page.component').then((m) => m.LibraryPageComponent),
  },
  {
    path: 'novel/:id',
    loadComponent: () => import('./features/novel/novel-details/novel-details.component').then((m) => m.NovelDetailsComponent),
  },
  {
    path: 'reader/:novelId/:chapterId',
    loadComponent: () => import('./features/reader/reader.component').then((m) => m.ReaderComponent),
  },
  {
    path: 'bookmarks',
    loadComponent: () => import('./features/bookmarks/bookmarks-page.component').then((m) => m.BookmarksPageComponent),
  },
  {
    path: 'history',
    loadComponent: () => import('./features/history/history-page.component').then((m) => m.HistoryPageComponent),
  },
  {
    path: 'collections',
    loadComponent: () => import('./features/collections/collections-page.component').then((m) => m.CollectionsPageComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings-page.component').then((m) => m.SettingsPageComponent),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];