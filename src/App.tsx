import { useEffect, useReducer, useState, useSyncExternalStore } from 'react';
import { Booth } from './components/Booth';
import { Result } from './components/Result';
import { StartScreen } from './components/StartScreen';
import { catalog } from './data/catalog';
import { ROUNDS, initialState, reduce, type Action, type GameState } from './engine/game';
import { previewPlayer } from './engine/previewPlayer';
import { stampSound } from './engine/stampSound';

const play = (state: GameState, action: Action) => reduce(state, action, catalog);

export default function App() {
  const [state, dispatch] = useReducer(play, initialState);
  const [muted, setMuted] = useState(false);
  const preview = useSyncExternalStore(previewPlayer.subscribe, previewPlayer.getState);

  useEffect(() => {
    stampSound.setMuted(muted);
    previewPlayer.setMuted(muted);
  }, [muted]);

  // A preview belongs to the card on the desk; it stops when that card leaves.
  useEffect(() => {
    return () => previewPlayer.stop();
  }, [state.cardId, state.phase]);

  const card = state.cardId ? catalog.card(state.cardId) : null;

  return (
    <div className="app">
      <header className="bar">
        <span className="brand">RECORD, PLEASE</span>
        {state.phase === 'booth' && (
          <span className="counter" data-testid="round-counter">
            {state.round} / {ROUNDS}
          </span>
        )}
        <button
          type="button"
          className="btn small"
          data-testid="mute-toggle-btn"
          aria-pressed={muted}
          onClick={() => setMuted((m) => !m)}
        >
          {muted ? '声音：关' : '声音：开'}
        </button>
      </header>

      {state.phase === 'start' && (
        <StartScreen
          onStart={(profile) => {
            stampSound.play('collect');
            dispatch({ type: 'start', profile, seed: Math.floor(Math.random() * 2 ** 32) });
          }}
        />
      )}

      {state.phase === 'booth' && card && (
        <Booth
          state={state}
          previewStatus={preview.trackId === card.track.id ? preview.status : 'idle'}
          onTogglePreview={() => previewPlayer.toggle(card.track.id, card.track.apple)}
          onCollect={() => {
            stampSound.play('collect');
            dispatch({ type: 'collect' });
          }}
          onSkip={() => {
            stampSound.play('skip');
            dispatch({ type: 'skip' });
          }}
          onNext={() => dispatch({ type: 'next' })}
        />
      )}

      {state.phase === 'result' && <Result state={state} onRestart={() => dispatch({ type: 'restart' })} />}
    </div>
  );
}
