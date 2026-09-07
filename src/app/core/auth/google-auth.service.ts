import { Injectable, signal } from '@angular/core';
import { SyncEngineService } from '../sync/sync-engine.service';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private _authenticated = signal(false);
  readonly authenticated = this._authenticated.asReadonly();
  private _user = signal<{ name?: string; email?: string; picture?: string } | null>(null);
  readonly user = this._user.asReadonly();

  private tokenClient: any;
  private accessToken: string | null = null;

  constructor(private syncEngine: SyncEngineService) {
    this.loadScript();
  }

  private loadScript() {
    if (document.getElementById('gsi-script')) return;
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initClient();
    document.head.appendChild(script);
  }

  private initClient() {
    const clientId = localStorage.getItem('google_client_id') || '';
    if (!clientId || !(window as any).google) return;
    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      callback: (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          this.accessToken = tokenResponse.access_token;
          this.syncEngine.setToken(tokenResponse.access_token);
          this._authenticated.set(true);
          this.fetchUserInfo(tokenResponse.access_token);
        }
      },
    });
  }

  private async fetchUserInfo(token: string) {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const data = await res.json();
        this._user.set(data);
      }
    } catch {}
  }

  setClientId(clientId: string) {
    localStorage.setItem('google_client_id', clientId);
    this.initClient();
  }

  signIn() {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken();
    }
  }

  signOut() {
    if (this.accessToken && (window as any).google) {
      (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {});
    }
    this.accessToken = null;
    this._authenticated.set(false);
    this._user.set(null);
  }

  getToken(): string | null {
    return this.accessToken;
  }
}
