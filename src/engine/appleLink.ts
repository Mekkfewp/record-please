import type { AppleMatch } from '../types/game';

/**
 * From a mainland China address, music.apple.com answers a link into any other country's store
 * with the China home page, so the song is lost. The same ids work under /cn/ when that store
 * carries the song (`apple.cn`, recorded by scripts/check-cn-storefront.mjs).
 *
 * The time zone is the only hint available without asking another service where the player is.
 */
const MAINLAND_ZONES = new Set([
  'Asia/Shanghai',
  'Asia/Urumqi',
  'Asia/Chongqing',
  'Asia/Chungking',
  'Asia/Harbin',
  'Asia/Kashgar',
  'PRC',
]);

export function inMainlandChina(timeZone: string): boolean {
  return MAINLAND_ZONES.has(timeZone);
}

export function currentTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
}

export interface AppleLink {
  url: string;
  /** False when the player is in mainland China and that store does not carry the song. */
  reachable: boolean;
}

export function appleMusicLink(apple: AppleMatch, timeZone: string): AppleLink {
  if (!inMainlandChina(timeZone)) return { url: apple.url, reachable: true };
  if (apple.cn) {
    return { url: `https://music.apple.com/cn/album/${apple.collectionId}?i=${apple.trackId}`, reachable: true };
  }
  return { url: apple.url, reachable: false };
}
