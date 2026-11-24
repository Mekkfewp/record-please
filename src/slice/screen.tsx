import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import appleMusicBadge from '../assets/listen-on-apple-music-zh-cn.svg';
import raw from '../data/slice.json';
import { AppleCredit } from '../components/ListenLinks';
import { appleMusicLink, currentTimeZone } from '../engine/appleLink';
import { previewPlayer } from '../engine/previewPlayer';
import { buildSlice } from './index';
import { current, initialState, reduce, type Action, type GameState } from './dig';
import { describe, type CrateSlot, type RecordFace, type SceneObject } from './scene';
import type { DigRecord, RawSlice } from './types';
import './screen.css';

const slice = buildSlice(raw as unknown as RawSlice);
const FLOOR = ['地面', '地下一层', '地下二层', '地下三层'];
const TIE: Record<string, string> = { producer: '制作人', label: '厂牌', member: '成员', engineer: '录音', sample: '采样', cover: '翻唱' };

function art(url: string, px: number): string {
  return url.replace(/\d+x\d+bb/, `${px}x${px}bb`);
}

function because(state: GameState): string {
  const step = current(state);
  if (!step) return '';
  const record = slice.record(step.recordId);
  if (step.tie) {
    const other = slice.record(step.tie.withId);
    return `和${other.artist}《${other.title}》同一${TIE[step.tie.tie.kind]}：${step.tie.tie.name}`;
  }
  return `${slice.path(record.genre).map((genre) => genre.name).join(' / ')}，${record.year}`;
}

function keptText(state: GameState): string {
  return state.crate
    .map((id) => {
      const record = slice.record(id);
      return `${record.artist} - ${record.title} (${record.year})`;
    })
    .join('\n');
}

function Thing({
  object,
  testId,
  onPress,
  children,
}: {
  object: SceneObject;
  testId: string;
  onPress: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`thing thing-${object.id} is-${object.state}`}
      data-testid={testId}
      data-state={object.state}
      aria-label={object.label}
      disabled={object.action === null}
      onClick={onPress}
    >
      {children}
    </button>
  );
}

function Sleeve({ record, face }: { record: DigRecord; face: RecordFace }) {
  const down = face === 'face-down';
  return (
    <div className={`sleeve is-${face}`} data-testid="slice-record" data-face={face}>
      {down ? (
        <div className="sleeve-back" />
      ) : (
        <div className="sleeve-front">
          {record.apple?.artworkUrl ? (
            <img src={art(record.apple.artworkUrl, 400)} alt={`《${record.title}》封面`} />
          ) : (
            <div className="sleeve-empty" />
          )}
          <p className="sleeve-title">《{record.title}》</p>
          <p className="sleeve-artist">
            {record.artist}
            <span> · {record.year}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function saveRoute(state: GameState): void {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 120 + state.steps.length * 72;
  const pen = canvas.getContext('2d');
  if (!pen) return;
  pen.fillStyle = '#ece3cc';
  pen.fillRect(0, 0, canvas.width, canvas.height);
  pen.fillStyle = '#191613';
  pen.font = '28px sans-serif';
  pen.fillText('Record, Please', 40, 52);
  state.steps.forEach((step, index) => {
    const record = slice.record(step.recordId);
    const y = 110 + index * 72;
    if (index > 0) {
      pen.strokeStyle = '#191613';
      pen.lineWidth = 3;
      pen.beginPath();
      pen.moveTo(56, y - 56);
      pen.lineTo(56, y - 16);
      pen.stroke();
    }
    pen.beginPath();
    pen.arc(56, y, 12, 0, Math.PI * 2);
    if (step.decision === 'keep') {
      pen.fillStyle = '#191613';
      pen.fill();
    } else {
      pen.strokeStyle = '#191613';
      pen.lineWidth = 3;
      pen.stroke();
    }
    pen.fillStyle = '#191613';
    pen.font = '22px sans-serif';
    pen.fillText(`${record.artist}  ${record.title}`, 88, y - 4);
    pen.fillStyle = '#5c5345';
    pen.font = '18px sans-serif';
    pen.fillText(`${FLOOR[step.floor]}  ${slice.genre(record.genre).name}  ${record.year}`, 88, y + 24);
  });
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'record-please-route.png';
  link.click();
}

export function SliceApp() {
  const [state, setState] = useState(() => {
    const seed = Math.floor(Math.random() * 2 ** 32);
    return reduce(initialState, { type: 'open', seed }, slice);
  });
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState('');
  const preview = useSyncExternalStore(previewPlayer.subscribe, previewPlayer.getState);

  useEffect(() => {
    previewPlayer.setMuted(muted);
  }, [muted]);

  const step = current(state);
  const record = step ? slice.record(step.recordId) : null;
  const previewStatus = record && preview.trackId === record.id ? preview.status : 'idle';
  const scene = describe(state, slice, previewStatus, muted);

  const spoken = copied || (state.phase === 'start'
    ? '柜台上有三张唱片。'
    : state.phase === 'result'
      ? '这一局的路线。'
      : !step || !record
        ? ''
        : step.faceUp || step.decision
          ? `${FLOOR[step.floor]}。${record.artist}，《${record.title}》，${record.year}。`
          : `${FLOOR[step.floor]}。唱片背面朝上。`);

  const dispatch = (action: Action) => {
    setCopied('');
    const next = reduce(state, action, slice);
    const dealt = current(next);
    const same = dealt?.recordId === step?.recordId;
    if (next.phase !== 'desk' || !dealt) previewPlayer.stop();
    else if (!same) {
      const nextRecord = slice.record(dealt.recordId);
      if (muted) previewPlayer.stop();
      else previewPlayer.start(nextRecord.id, nextRecord.apple);
    }
    setState(next);
  };

  const press = (object: SceneObject, slot?: number) => {
    if (object.action === 'play' && record) previewPlayer.toggle(record.id, record.apple);
    else if (object.action === 'keep') dispatch({ type: 'keep' });
    else if (object.action === 'pass') dispatch({ type: 'pass' });
    else if (object.action === 'swap' && slot !== undefined) dispatch({ type: 'swap', slot });
    else if (object.action === 'next') dispatch({ type: 'next' });
    else if (object.action === 'mute') setMuted((value) => !value);
    else if (object.action === 'reshuffle') dispatch({ type: 'reshuffle' });
    else if (object.action === 'copy') {
      void navigator.clipboard.writeText(keptText(state)).then(
        () => setCopied('歌单已复制。'),
        () => setCopied('没能复制。'),
      );
    } else if (object.action === 'save') saveRoute(state);
    else if (object.action === 'restart') dispatch({ type: 'restart' });
  };

  return (
    <div className="slice" data-testid="slice-screen" data-floor={scene.floor} data-phase={scene.phase}>
      <p className="slice-live" aria-live="polite">
        {spoken}
      </p>
      <p className="shop-sign" aria-hidden="true">
        RECORD, PLEASE
      </p>

      {scene.phase === 'start' && (
        <main className="counter-top">
          <div className="doors">
            {state.doors.map((id) => {
              const door = slice.record(id);
              return (
                <button
                  key={id}
                  type="button"
                  className="door-record"
                  data-testid="slice-door"
                  aria-label={`《${door.title}》，${door.artist}，${door.year}`}
                  onClick={() => dispatch({ type: 'pick', recordId: id })}
                >
                  {door.apple?.artworkUrl && <img src={art(door.apple.artworkUrl, 300)} alt="" />}
                  <span>《{door.title}》</span>
                  <span>
                    {door.artist} · {door.year}
                  </span>
                </button>
              );
            })}
          </div>
          <Thing object={scene.objects.supply} testId="slice-supply" onPress={() => press(scene.objects.supply)}>
            <span className="supply-box" aria-hidden="true" />
          </Thing>
        </main>
      )}

      {scene.phase === 'desk' && record && scene.record && (
        <main className="desk">
          <p className="shelf-mark">{scene.shelfMark.map((genre) => genre.name).join(' / ')}</p>
          <div className="desk-row">
            <div className="player-side">
              <Thing object={scene.objects.player} testId="slice-player" onPress={() => press(scene.objects.player)}>
                <span className={`device device-${scene.device} is-${scene.objects.player.state}`} aria-hidden="true" />
              </Thing>
              {record.apple && (
                <a className="apple-badge" data-testid="apple-music-link" href={appleMusicLink(record.apple, currentTimeZone()).url} target="_blank" rel="noopener noreferrer">
                  <img src={appleMusicBadge} alt="在 Apple Music 上收听" />
                </a>
              )}
              <Thing object={scene.objects.sound} testId="slice-sound" onPress={() => press(scene.objects.sound)}>
                <span className={`knob ${muted ? 'is-off' : 'is-on'}`} aria-hidden="true" />
              </Thing>
            </div>
            <div className="desk-record">
              <Sleeve record={record} face={scene.record.face} />
              {scene.record.face !== 'face-down' && <p className="because">{because(state)}</p>}
              {scene.record.face !== 'face-down' && (
                <p className="search-links">
                  <a href={record.links.netease} target="_blank" rel="noopener noreferrer">
                    网易云搜索
                  </a>
                  <a href={record.links.qq} target="_blank" rel="noopener noreferrer">
                    QQ音乐搜索
                  </a>
                </p>
              )}
              <AppleCredit />
            </div>
            <Thing object={scene.objects.stack} testId="slice-stack" onPress={() => press(scene.objects.stack)}>
              <span className="pile" aria-hidden="true" />
            </Thing>
          </div>
          <div className="desk-choices">
            {scene.objects.crate.action === 'swap' ? (
              <div className="crate is-swap" data-testid="slice-crate" role="group" aria-label={scene.objects.crate.label}>
                {scene.crate.map((slot, index) => (
                  <Slot key={index} slot={slot} index={index} onPress={() => press(scene.objects.crate, index)} />
                ))}
              </div>
            ) : (
              <Thing object={scene.objects.crate} testId="slice-crate" onPress={() => press(scene.objects.crate)}>
                <span className="crate-body" aria-hidden="true">
                  {scene.crate.map((slot, index) => (
                    <Slot key={index} slot={slot} index={index} />
                  ))}
                </span>
              </Thing>
            )}
            <Thing object={scene.objects.shelf} testId="slice-shelf" onPress={() => press(scene.objects.shelf)}>
              <span className="shelf-body" aria-hidden="true" />
            </Thing>
          </div>
        </main>
      )}

      {scene.phase === 'result' && (
        <main className="route-sheet">
          <ol className="route" data-testid="slice-route">
            {state.steps.map((stop, index) => {
              const item = slice.record(stop.recordId);
              return (
                <li key={`${item.id}-${index}`} className={stop.decision === 'keep' ? 'kept' : 'passed'} data-floor={stop.floor}>
                  <span className="stop" aria-hidden="true" />
                  <span className="route-record">
                    {item.artist}《{item.title}》
                  </span>
                  <span className="route-place">
                    {FLOOR[stop.floor]} · {slice.genre(item.genre).name} · {item.year}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="route-tools">
            <Thing object={scene.objects.receipt} testId="slice-receipt" onPress={() => press(scene.objects.receipt)}>
              <span className="paper-slip" aria-hidden="true" />
            </Thing>
            <Thing object={scene.objects.camera} testId="slice-camera" onPress={() => press(scene.objects.camera)}>
              <span className="camera-body" aria-hidden="true" />
            </Thing>
            <Thing object={scene.objects.door} testId="slice-exit" onPress={() => press(scene.objects.door)}>
              <span className="shop-door" aria-hidden="true" />
            </Thing>
          </div>
        </main>
      )}
    </div>
  );
}

function Slot({ slot, index, onPress }: { slot: CrateSlot; index: number; onPress?: () => void }) {
  const held = slot.recordId ? slice.record(slot.recordId) : null;
  const body = held?.apple?.artworkUrl ? <img src={art(held.apple.artworkUrl, 80)} alt="" /> : <span className="slot-empty" />;
  if (!onPress) {
    return (
      <span className={`slot is-${slot.state} ${slot.deep ? 'is-deep' : ''}`} data-testid={`slice-slot-${index}`}>
        {body}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`slot is-${slot.state} ${slot.deep ? 'is-deep' : ''}`}
      data-testid={`slice-slot-${index}`}
      aria-label={held ? `换出《${held.title}》` : '空格'}
      disabled={!held}
      onClick={onPress}
    >
      {body}
    </button>
  );
}
