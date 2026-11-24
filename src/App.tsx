import { useEffect, useState } from 'react';
import {
  ALBUMS_BY_ID,
  ALL_SINGLES,
  ARTISTS_BY_ID,
  LINEAGES,
  getInitialDeskQueue,
  pickLoreInterlude,
  pickNextSingle,
} from './data';
import { BoothLeftColumn } from './components/BoothLeftColumn';
import { DossierDesk } from './components/DossierDesk';
import { EntryPermit } from './components/EntryPermit';
import { GenealogyBook } from './components/GenealogyBook';
import { LoreCardModal } from './components/LoreCardModal';
import { PlaylistPassport } from './components/PlaylistPassport';
import { soundDesk } from './engine/audioEngine';
import type {
  CulturalLoreItem,
  LineageId,
  PlayerProfile,
  SingleTrack,
} from './types/game';

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
  const [currentSingle, setCurrentSingle] = useState<SingleTrack>(ALL_SINGLES[0]);
  const [anchorBadge, setAnchorBadge] = useState('入境首站');
  const [pivotBanner, setPivotBanner] = useState<string | null>(null);
  const [stampState, setStampState] = useState<'idle' | 'collected' | 'passed'>('idle');

  const [round, setRound] = useState(1);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const [collectedSingles, setCollectedSingles] = useState<SingleTrack[]>([]);
  const [lineageCounts, setLineageCounts] = useState<Record<LineageId, number>>(EMPTY_LINEAGE_MAP);
  const [unlockedDepths, setUnlockedDepths] = useState<Record<LineageId, number>>(EMPTY_LINEAGE_MAP);
  const [steeredLineage, setSteeredLineage] = useState<LineageId | null>(null);

  const [rulebookOpen, setRulebookOpen] = useState(false);
  const [activeLore, setActiveLore] = useState<CulturalLoreItem | null>(null);
  const [seenLoreIds, setSeenLoreIds] = useState<Set<string>>(() => new Set());
  const [bookmarkedLore, setBookmarkedLore] = useState<CulturalLoreItem[]>([]);

  const [muted, setMuted] = useState(soundDesk.isMuted());
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  useEffect(() => {
    return soundDesk.subscribe(() => {
      setMuted(soundDesk.isMuted());
      setPlayingTrackId(soundDesk.getPlayingTrackId());
    });
  }, []);

  const handlePermitSubmit = (nextProfile: PlayerProfile) => {
    soundDesk.playStampClunk('approve');
    const init = getInitialDeskQueue(nextProfile);
    setProfile(nextProfile);
    setCurrentSingle(init.firstSingle);
    setAnchorBadge(init.anchorBadge);
    setPivotBanner(`入境档案核准：${init.clerkNote}`);
    setSeenIds(new Set([init.firstSingle.id]));
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
    soundDesk.stopGroove();
    const nextRound = round + 1;

    // Trigger Cultural Lore Interlude on rounds 3, 6, 9
    if ((round === 2 || round === 5 || round === 8) && !activeLore) {
      const lore = pickLoreInterlude({
        activeLineage: steeredLineage ?? currentSingle.lineage,
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
      lastSingle: currentSingle,
      lastDecision: decision,
      steeredLineage,
      lineageDepth: unlockedDepths,
    });

    soundDesk.playPaperSlide();
    setRound(nextRound);
    setCurrentSingle(next.single);
    setAnchorBadge(next.anchorBadge);
    setPivotBanner(next.pivotReason ?? null);
    setSeenIds((prev) => new Set(prev).add(next.single.id));
    setSteeredLineage(null);
    setStampState('idle');
  };

  const handleStampCollect = () => {
    if (stampState !== 'idle') return;
    soundDesk.playStampClunk('approve');
    setStampState('collected');
    setCollectedSingles((prev) =>
      prev.some((x) => x.id === currentSingle.id) ? prev : [...prev, currentSingle]
    );
    setLineageCounts((prev) => ({
      ...prev,
      [currentSingle.lineage]: (prev[currentSingle.lineage] ?? 0) + 1,
    }));
    setUnlockedDepths((prev) => ({
      ...prev,
      [currentSingle.lineage]: Math.max(
        prev[currentSingle.lineage] ?? 0,
        Math.min(3, currentSingle.tier + 1)
      ),
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

  const artist =
    ARTISTS_BY_ID.get(currentSingle.artistId) ??
    Array.from(ARTISTS_BY_ID.values())[0];
  const album =
    ALBUMS_BY_ID.get(currentSingle.albumId) ??
    Array.from(ALBUMS_BY_ID.values())[0];

  return (
    <div className="app-shell">
      <header className="top-brass-bar">
        <div className="brand-title">
          <span className="brand-emblem">RYM · BOOTH 07</span>
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
                    activeLineage: currentSingle.lineage,
                    region: profile.region,
                    seenLoreIds,
                  });
                  if (lore) {
                    setSeenLoreIds((prev) => new Set(prev).add(lore.id));
                    setActiveLore(lore);
                  }
                }}
              >
                📚 调阅文化档案 ({bookmarkedLore.length})
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
                📖 RYM 谱系手册
              </button>
              <button
                type="button"
                data-testid="top-finish-btn"
                disabled={collectedSingles.length === 0}
                className="pixel-btn brass"
                onClick={() => {
                  soundDesk.stopGroove();
                  soundDesk.playPassportFanfare();
                  setPhase('passport');
                }}
              >
                🪪 生成歌单与音乐家身份 ({collectedSingles.length})
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
            activeLineage={currentSingle.lineage}
            steeredLineage={steeredLineage}
            isPlaying={playingTrackId === currentSingle.id}
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
              soundDesk.stopGroove();
              soundDesk.playPassportFanfare();
              setPhase('passport');
            }}
          />

          <DossierDesk
            single={currentSingle}
            artist={artist}
            album={album}
            anchorBadge={anchorBadge}
            pivotBanner={pivotBanner}
            stampState={stampState}
            isPlayingGroove={playingTrackId === currentSingle.id}
            onToggleGroove={() =>
              soundDesk.toggleGroove(currentSingle.id, currentSingle.groove)
            }
            onNextAfterCollect={() => advanceDesk('collect')}
          />
        </main>
      )}

      {phase === 'passport' && profile && (
        <PlaylistPassport
          profile={profile}
          collectedSingles={
            collectedSingles.length > 0 ? collectedSingles : [currentSingle]
          }
          bookmarkedLore={bookmarkedLore}
          lineageCounts={lineageCounts}
          onKeepDigging={() => setPhase('booth')}
          onRestart={() => {
            soundDesk.stopGroove();
            setPhase('permit');
          }}
        />
      )}

      {rulebookOpen && (
        <GenealogyBook
          activeLineage={currentSingle.lineage}
          unlockedDepths={unlockedDepths}
          collectedCounts={lineageCounts}
          onSteer={(lin) => {
            setSteeredLineage(lin);
            setPivotBanner(`已预约下一张调档：【${LINEAGES[lin].nameCN}】`);
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
