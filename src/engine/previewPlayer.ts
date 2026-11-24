import type { AppleMatch } from '../types/game';

export type PreviewStatus = 'idle' | 'loading' | 'playing' | 'unavailable';

export interface PreviewState {
  trackId: string | null;
  status: PreviewStatus;
}

interface LookupResponse {
  results?: Array<{ trackId?: number; previewUrl?: string }>;
}

/**
 * Asks Apple for the current preview address of a track. Stored addresses can stop working,
 * the track id does not.
 */
async function lookupPreviewUrl(apple: AppleMatch): Promise<string | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${apple.trackId}&country=${apple.storefront}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as LookupResponse;
    const hit = data.results?.find((r) => r.trackId === apple.trackId);
    return hit?.previewUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Streams one 30-second preview at a time through a single audio element.
 * Nothing is downloaded or kept; a refreshed address is remembered only until the page closes.
 */
export class PreviewPlayer {
  private audio: HTMLAudioElement | null = null;
  private state: PreviewState = { trackId: null, status: 'idle' };
  private listeners = new Set<() => void>();
  private refreshed = new Map<string, string>();
  private muted = false;
  // Guards against a slow request finishing after the player has moved on.
  private ticket = 0;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getState = (): PreviewState => this.state;

  private set(next: PreviewState): void {
    if (next.trackId === this.state.trackId && next.status === this.state.status) return;
    this.state = next;
    this.listeners.forEach((fn) => fn());
  }

  private element(): HTMLAudioElement {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'none';
      this.audio.muted = this.muted;
      this.audio.addEventListener('ended', () => this.set({ trackId: null, status: 'idle' }));
    }
    return this.audio;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.audio) this.audio.muted = muted;
  }

  stop(): void {
    this.ticket += 1;
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }
    this.set({ trackId: null, status: 'idle' });
  }

  toggle(trackId: string, apple: AppleMatch | undefined): void {
    if (this.state.trackId === trackId && this.state.status !== 'unavailable') {
      this.stop();
      return;
    }
    void this.play(trackId, apple);
  }

  private async play(trackId: string, apple: AppleMatch | undefined): Promise<void> {
    this.stop();
    if (!apple) {
      this.set({ trackId, status: 'unavailable' });
      return;
    }
    const ticket = this.ticket;
    this.set({ trackId, status: 'loading' });

    const stored = this.refreshed.get(trackId) ?? apple.previewUrl;
    let outcome = await this.tryUrl(stored, ticket);
    if (outcome === 'failed') {
      const fresh = await lookupPreviewUrl(apple);
      if (ticket !== this.ticket) return;
      if (fresh && fresh !== stored) {
        this.refreshed.set(trackId, fresh);
        outcome = await this.tryUrl(fresh, ticket);
      }
    }
    if (ticket !== this.ticket) return;

    if (outcome === 'playing') {
      this.set({ trackId, status: 'playing' });
    } else if (outcome === 'blocked') {
      // The browser wants a fresh click before it will play; the next press works.
      this.set({ trackId: null, status: 'idle' });
    } else {
      this.set({ trackId, status: 'unavailable' });
    }
  }

  private async tryUrl(url: string, ticket: number): Promise<'playing' | 'failed' | 'blocked' | 'stale'> {
    const audio = this.element();
    audio.src = url;
    try {
      await audio.play();
      return ticket === this.ticket ? 'playing' : 'stale';
    } catch (err) {
      if (ticket !== this.ticket) return 'stale';
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError') return 'blocked';
      if (name === 'AbortError') return 'stale';
      return 'failed';
    }
  }
}

export const previewPlayer = new PreviewPlayer();
