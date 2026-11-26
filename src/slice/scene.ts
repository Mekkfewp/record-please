import type { PreviewStatus } from '../engine/previewPlayer';
import { CRATE_SIZE, ROUNDS, current, type GameState } from './dig.ts';
import type { Slice } from './index';
import type { Floor, Genre } from './types';

/**
 * What is on screen, as data. Every action a player can take belongs to a named object in the
 * scene, and every object has one state at a time. How the objects are drawn is not decided
 * here: a view reads this and draws it, and the same data gives a screen reader its words.
 */

export type ObjectId =
  | 'player' // the playback device on the counter
  | 'crate' // the player's crate of five
  | 'shelf' // where a passed record goes back
  | 'stack' // the pile the next record comes from
  | 'sound' // the volume knob
  | 'counter' // the door records laid out before a game
  | 'supply' // the box that brings other door records
  | 'receipt' // the playlist as text
  | 'camera' // the playlist as a picture
  | 'door'; // the way out, to a new game

export type ActionId = 'play' | 'keep' | 'pass' | 'swap' | 'next' | 'mute' | 'pick' | 'reshuffle' | 'copy' | 'save' | 'restart';

/** Which object carries which action. Changing a target is a change to this table only. */
export const BINDINGS: Record<ActionId, ObjectId> = {
  play: 'player',
  keep: 'crate',
  swap: 'crate',
  pass: 'shelf',
  next: 'stack',
  mute: 'sound',
  pick: 'counter',
  reshuffle: 'supply',
  copy: 'receipt',
  save: 'camera',
  restart: 'door',
};

export type ObjectState = 'idle' | 'loading' | 'playing' | 'stopped' | 'unavailable' | 'disabled';

export interface SceneObject {
  id: ObjectId;
  state: ObjectState;
  /** What a tap does right now; null when it does nothing. */
  action: ActionId | null;
  /** Words for a screen reader. Nothing in the scene shows them. */
  label: string;
}

export type Device = 'turntable' | 'walkman' | 'cd-player';
const DEVICE_NAME: Record<Device, string> = { turntable: '唱机', walkman: '随身听', 'cd-player': 'CD 机' };

/**
 * The device follows the release year. The US brackets are the ones already fixed.
 * Britain is later: cassette albums overtook LPs in 1985, and CD units overtook LPs in 1989.
 */
export function deviceFor(year: number, country = 'US'): Device {
  if (country === 'GB') {
    if (year <= 1984) return 'turntable';
    if (year <= 1988) return 'walkman';
    return 'cd-player';
  }
  if (year <= 1982) return 'turntable';
  if (year <= 1987) return 'walkman';
  return 'cd-player';
}

export type RecordFace = 'face-down' | 'face-up' | 'kept' | 'passed';

export interface CrateSlot {
  recordId: string | null;
  /** 'swappable' while a kept record waits for the player to give one up. */
  state: 'empty' | 'held' | 'swappable';
  /** A floor-3 record; it is marked in the crate and on the route. */
  deep: boolean;
}

export interface Scene {
  phase: GameState['phase'];
  floor: Floor;
  /** From the family down to the genre the desk stands in; empty before a game. */
  shelfMark: Genre[];
  device: Device | null;
  record: { id: string; face: RecordFace } | null;
  crate: CrateSlot[];
  round: number;
  objects: Record<ObjectId, SceneObject>;
}

const PLAYER_STATE: Record<PreviewStatus, ObjectState> = { idle: 'stopped', loading: 'loading', playing: 'playing', unavailable: 'unavailable' };
const PLAYER_WORDS: Record<PreviewStatus, string> = {
  idle: '已停，按下播放',
  loading: '载入中',
  playing: '播放中，按下停止',
  unavailable: '这张暂时放不了',
};

const off = (id: ObjectId, label: string): SceneObject => ({ id, state: 'disabled', action: null, label });
const on = (id: ObjectId, action: ActionId, label: string): SceneObject => ({ id, state: 'idle', action, label });

export function describe(state: GameState, slice: Slice, preview: PreviewStatus, muted: boolean): Scene {
  const step = current(state);
  const record = step ? slice.record(step.recordId) : null;
  const device = record ? deviceFor(record.year, record.country) : null;
  const desk = state.phase === 'desk';
  const listening = desk && state.step === 'listening';
  const swapping = desk && state.step === 'swap';
  const decided = desk && state.step === 'decided';
  const full = state.crate.length >= CRATE_SIZE;
  const last = state.steps.length >= ROUNDS;

  const crate: CrateSlot[] = Array.from({ length: CRATE_SIZE }, (_, i) => {
    const id = state.crate[i] ?? null;
    return {
      recordId: id,
      state: !id ? 'empty' : swapping ? 'swappable' : 'held',
      deep: id ? slice.floorOf(slice.record(id)) === 3 : false,
    };
  });

  const objects: Record<ObjectId, SceneObject> = {
    player:
      desk && device
        ? { id: 'player', state: PLAYER_STATE[preview], action: preview === 'unavailable' ? null : 'play', label: `${DEVICE_NAME[device]}：${PLAYER_WORDS[preview]}` }
        : off('player', '播放设备'),
    crate: listening
      ? on('crate', 'keep', full ? `唱片箱，已满 ${CRATE_SIZE} 张：收下这张，再换出一张` : `唱片箱，${state.crate.length} / ${CRATE_SIZE}：收下这张`)
      : swapping
        ? on('crate', 'swap', '唱片箱已满：选一张换出去')
        : off('crate', `唱片箱，${state.crate.length} / ${CRATE_SIZE}`),
    shelf: listening ? on('shelf', 'pass', '货架：把这张放回去') : swapping ? on('shelf', 'pass', '货架：不收了，把这张放回去') : off('shelf', '货架'),
    stack: decided ? on('stack', 'next', last ? '看这一局的歌单' : '下一张唱片') : off('stack', '待发的唱片'),
    sound: { id: 'sound', state: 'idle', action: 'mute', label: muted ? '声音：关，按下打开' : '声音：开，按下关闭' },
    counter: state.phase === 'start' ? on('counter', 'pick', '柜台上的三张唱片：挑一张开始') : off('counter', '柜台'),
    supply: state.phase === 'start' ? on('supply', 'reshuffle', '货箱：换三张别的') : off('supply', '货箱'),
    receipt: state.phase === 'result' ? on('receipt', 'copy', '小票：复制歌单') : off('receipt', '小票'),
    camera: state.phase === 'result' ? on('camera', 'save', '相机：存成图片') : off('camera', '相机'),
    door: state.phase === 'result' ? on('door', 'restart', '店门：再来一局') : off('door', '店门'),
  };

  return {
    phase: state.phase,
    floor: step?.floor ?? 0,
    shelfMark: state.genreId ? slice.path(state.genreId) : [],
    device,
    record: step ? { id: step.recordId, face: step.decision === 'keep' ? 'kept' : step.decision === 'pass' ? 'passed' : step.faceUp ? 'face-up' : 'face-down' } : null,
    crate,
    round: state.steps.length,
    objects,
  };
}
