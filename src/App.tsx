import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  CARDS,
  LINEAGES,
  getInitialDeskQueue,
  pickLoreInterlude,
  pickNextSingle,
} from './data';
import { getCell } from './data/catalog';
import { BoothLeftColumn } from './components/BoothLeftColumn';
import { DossierDesk } from './components/DossierDesk';
import { EntryPermit } from './components/EntryPermit';
import { GenealogyBook } from './components/GenealogyBook';
import { LoreCardModal } from './components/LoreCardModal';
import { PlaylistPassport } from './components/PlaylistPassport';
import { soundDesk } from './engine/audioEngine';
import { previewPlayer } from './engine/previewPlayer';
import type { Card, LineageId, LoreItem, PlayerProfile } from './types/game';

const TARGET_ROUNDS = 9;

const EMPTY_LINEAGE_MAP = (): Record<LineageId, number> => ({
  jazz: 0,
  'punk-postpunk': 0,
  'shoegaze-indie': 0,
  'electronic-idm': 0,
  hiphop: 0,
  'artpop-citypop': 0,
  'folk-psych': 0,
  'heavy-industrial': 0,
});

export default function App() {
  const [phase, setPhase] = useState<'permit' | 'booth' | 'passport'>('permit');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [currentSingle, setCurrentSingle] = useState<Card>(CARDS[0]);
  const [reason, setReason] = useState('');
  const [stampState, setStampState] = useState<'idle' | 'collected' | 'passed'>('idle');

  const [round, setRound] = useState(1);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const [collectedSingles, setCollectedSingles] = useState<Card[]>([]);
  const [lineageCounts, setLineageCounts] = useState<Record<LineageId, number>>(EMPTY_LINEAGE_MAP);
  const [unlockedDepths, setUnlockedDepths] = useState<Record<LineageId, number>>(EMPTY_LINEAGE_MAP);
  const [steeredLineage, setSteeredLineage] = useState<LineageId | null>(null);

  const [rulebookOpen, setRulebookOpen] = useState(false);
  const [activeLore, setActiveLore] = useState<LoreItem | null>(null);
  const [seenLoreIds, setSeenLoreIds] = useState<Set<string>>(() => new Set());
  const [bookmarkedLore, setBookmarkedLore] = useState<LoreItem[]>([]);

  const [muted, setMuted] = useState(soundDesk.isMuted());
  const preview = useSyncExternalStore(previewPlayer.subscribe, previewPlayer.getState);

  useEffect(() => {
    return soundDesk.subscribe(() => {
      setMuted(soundDesk.isMuted());
      previewPlayer.setMuted(soundDesk.isMuted());
    });
  }, []);

  const handlePermitSubmit = (nextProfile: PlayerProfile) => {
    soundDesk.playStampClunk('approve');
    const init = getInitialDeskQueue(nextProfile);
    setProfile(nextProfile);
    setCurrentSingle(init.card);
    setReason(init.reason);
    setSeenIds(new Set([init.card.track.id]));
    setRound(1);
    setStampState('idle');
    setCollectedSingles([]);
    setBookmarkedLore([]);
    setSeenLoreIds(new Set());
    setLineageCounts(EMPTY_LINEAGE_MAP());
    const depths = EMPTY_LINEAGE_MAP();
    init.seededLineages.forEach((l) => {
      depths[l] = 1;
    });
    setUnlockedDepths(depths);
    setSteeredLineage(null);
    setPhase('booth');
  };

  const advanceDesk = (decision: 'collect' | 'pass') => {
    if (!profile) return;
    previewPlayer.stop();
    const nextRound = round + 1;

    // Trigger Cultural Lore Interlude on rounds 3, 6, 9
    if ((round === 2 || round === 5 || round === 8) && !activeLore) {
      const lore = pickLoreInterlude({
        card: currentSingle,
        fallbackLineage: activeLineage,
        region: profile.region,
        seenLoreIds,
      });
      if (lore) {
        setSeenLoreIds((prev) => new Set(prev).add(lore.id));
        setActiveLore(lore);
      }
    }

    if (nextRound > TARGET_ROUNDS && collectedSingles.length >= 3) {
      soundDesk.playPassportFanfare();
      setPhase('passport');
      return;
    }

    const next = pickNextSingle({
      profile,
      seenIds,
      round: nextRound,
      lastCard: currentSingle,
      lastDecision: decision,
      steeredLineage,
      lineageDepth: unlockedDepths,
    });

    soundDesk.playPaperSlide();
    setRound(nextRound);
    setCurrentSingle(next.card);
    setReason(next.reason);
    setSeenIds((prev) => new Set(prev).add(next.card.track.id));
    setSteeredLineage(null);
    setStampState('idle');
  };

  const handleStampCollect = () => {
    if (stampState !== 'idle') return;
    soundDesk.playStampClunk('approve');
    setStampState('collected');
    setCollectedSingles((prev) =>
      prev.some((x) => x.track.id === currentSingle.track.id) ? prev : [...prev, currentSingle]
    );
    const lin = currentSingle.track.lineage;
    if (!lin) return;
    setLineageCounts((prev) => ({ ...prev, [lin]: (prev[lin] ?? 0) + 1 }));
    setUnlockedDepths((prev) => ({
      ...prev,
      [lin]: Math.max(prev[lin] ?? 0, Math.min(3, currentSingle.track.tier + 1)),
    }));
  };

  const handleStampPass = () => {
    if (stampState !== 'idle') return;
    soundDesk.playStampClunk('pass');
    setStampState('passed');
    window.setTimeout(() => {
      advanceDesk('pass');
    }, 340);
  };

  const handleLoreDecision = (bookmark: boolean) => {
    if (activeLore && bookmark) {
      soundDesk.playStampClunk('bookmark');
      setBookmarkedLore((prev) => [...prev, activeLore]);
    } else {
      soundDesk.playRulebookFlip();
    }
    setActiveLore(null);
  };

  const previewStatus = preview.trackId === currentSingle.track.id ? preview.status : 'idle';

  const activeLineage: LineageId =
    currentSingle.track.lineage ??
    (profile ? getCell(profile.birthEra, profile.region).bridges[0] : 'shoegaze-indie');

  return (
    <div className="app-shell">
      <header className="top-brass-bar">
        <div className="brand-title">
          <span className="brand-emblem">BOOTH 07</span>
          <span>RECORD, PLEASE / 请出示唱片</span>
        </div>

        <div className="top-controls">
          {phase === 'booth' && (
            <>
              <button
                type="button"
                data-testid="top-lore-btn"
                className="pixel-btn"
                onClick={() => {
                  if (!profile) return;
                  const lore = pickLoreInterlude({
                    card: currentSingle,
                    fallbackLineage: activeLineage,
                    region: profile.region,
                    seenLoreIds,
                  });
                  if (lore) {
                    setSeenLoreIds((prev) => new Set(prev).add(lore.id));
                    setActiveLore(lore);
                  }
                }}
              >
                📚 延伸阅读 ({bookmarkedLore.length})
              </button>
              <button
                type="button"
                data-testid="top-rulebook-btn"
                className="pixel-btn"
                onClick={() => {
                  soundDesk.playRulebookFlip();
                  setRulebookOpen(true);
                }}
              >
                📖 谱系手册
              </button>
              <button
                type="button"
                data-testid="top-finish-btn"
                disabled={collectedSingles.length === 0}
                className="pixel-btn brass"
                onClick={() => {
                  previewPlayer.stop();
                  soundDesk.playPassportFanfare();
                  setPhase('passport');
                }}
              >
                🪪 生成歌单 ({collectedSingles.length})
              </button>
            </>
          )}
          <button
            type="button"
            data-testid="mute-toggle-btn"
            className="pixel-btn"
            onClick={() => soundDesk.toggleMute()}
          >
            {muted ? '🔇 监听静音' : '🔊 监听开启'}
          </button>
        </div>
      </header>

      {phase === 'permit' && <EntryPermit onSubmit={handlePermitSubmit} />}

      {phase === 'booth' && profile && (
        <main className="booth-layout">
          <BoothLeftColumn
            activeLineage={activeLineage}
            steeredLineage={steeredLineage}
            isPlaying={previewStatus === 'playing'}
            collectedSingles={collectedSingles}
            round={round}
            targetRounds={TARGET_ROUNDS}
            stampState={stampState}
            onStampCollect={handleStampCollect}
            onStampPass={handleStampPass}
            onNextAfterCollect={() => advanceDesk('collect')}
            onOpenRulebook={() => {
              soundDesk.playRulebookFlip();
              setRulebookOpen(true);
            }}
            onFinishPassport={() => {
              previewPlayer.stop();
              soundDesk.playPassportFanfare();
              setPhase('passport');
            }}
          />

          <DossierDesk
            card={currentSingle}
            reason={reason}
            stampState={stampState}
            previewStatus={previewStatus}
            onTogglePreview={() => previewPlayer.toggle(currentSingle.track.id, currentSingle.track.apple)}
            onNextAfterCollect={() => advanceDesk('collect')}
          />
        </main>
      )}

      {phase === 'passport' && profile && (
        <PlaylistPassport
          profile={profile}
          collected={collectedSingles}
          bookmarkedLore={bookmarkedLore}
          lineageCounts={lineageCounts}
          onKeepDigging={() => setPhase('booth')}
          onRestart={() => {
            previewPlayer.stop();
            setPhase('permit');
          }}
        />
      )}

      {rulebookOpen && (
        <GenealogyBook
          activeLineage={activeLineage}
          unlockedDepths={unlockedDepths}
          collectedCounts={lineageCounts}
          onSteer={(lin) => {
            setSteeredLineage(lin);
            setReason(`下一张将从 ${LINEAGES[lin].name} 里出。`);
          }}
          onClose={() => setRulebookOpen(false)}
        />
      )}

      {activeLore && (
        <LoreCardModal lore={activeLore} onDecision={handleLoreDecision} />
      )}
    </div>
  );
}
