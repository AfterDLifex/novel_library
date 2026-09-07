import { Injectable, signal, computed } from '@angular/core';
import { GoogleAuthService } from './google-auth.service';

/**
 * Service that tracks the current authentication state.
 * Works in conjunction with GoogleAuthService but provides
 * a clean, stable API for components to consume.
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  readonly authenticated = computed(() => this.auth.authenticated());
  readonly user = computed(() => this.auth.user());
  readonly token = computed(() => this.auth.getToken());

  constructor(private auth: GoogleAuthService) {}

  signIn(): void {
    this.auth.signIn();
  }

  signOut(): void {
    this.auth.signOut();
  }

  setClientId(clientId: string): void {
    this.auth.setClientId(clientId);
  }

  /**
   * The user's profile name, or empty string if not authenticated.
   */
  readonly displayName = computed(() => this.auth.user()?.name ?? '');

  /**
   * The user's email address, or empty string if not authenticated.
   */
  readonly email = computed(() => this.auth.user()?.email ?? '');

  /**
   * The user's profile picture URL, or null if not authenticated.
   */
  readonly pictureUrl = computed(() => this.auth.user()?.picture ?? null);
}
