import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { AndroidProjectExplorer } from './components/AndroidProjectExplorer';
import { UpgradeDrawer } from './components/UpgradeDrawer';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { UnlockSpeedModal } from './components/UnlockSpeedModal';
import { GameConfig } from './GameConfig';

export default function App() {
  const [activeTab, setActiveTab] = useState<'PLAY' | 'ANDROID_PROJECT'>('PLAY');

  // 持久化資料 (預設對齊參考圖 155552 之 874 金幣與 7,711 最佳紀錄)
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('cosmic_coins_v2');
    return saved ? parseInt(saved, 10) : 874;
  });

  const [bestScore, setBestScore] = useState<number>(() => {
    const saved = localStorage.getItem('cosmic_best_score_v2');
    return saved ? parseInt(saved, 10) : 7711;
  });

  const [ballDamageLevel, setBallDamageLevel] = useState<number>(() => {
    const saved = localStorage.getItem('cosmic_ball_dmg_lvl');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [luckLevel, setLuckLevel] = useState<number>(() => {
    const saved = localStorage.getItem('cosmic_luck_lvl');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [is2xUnlocked, setIs2xUnlocked] = useState<boolean>(() => {
    const saved = localStorage.getItem('cosmic_2x_unlocked_v2');
    return saved ? saved === 'true' : true;
  });

  const [is5xUnlocked, setIs5xUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('cosmic_5x_unlocked') === 'true';
  });

  const [reviveTickets, setReviveTickets] = useState<number>(() => {
    const saved = localStorage.getItem('cosmic_revive_tickets');
    return saved ? parseInt(saved, 10) : 2;
  });

  const [targetFps, setTargetFps] = useState<number>(60);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [continuousShoot, setContinuousShoot] = useState<boolean>(true);
  const [showFps, setShowFps] = useState<boolean>(true);

  // 模態視窗
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPauseOpen, setIsPauseOpen] = useState<boolean>(false);
  const [unlockSpeedTarget, setUnlockSpeedTarget] = useState<{ speed: number; cost: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('cosmic_coins_v2', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('cosmic_best_score_v2', bestScore.toString());
  }, [bestScore]);

  useEffect(() => {
    localStorage.setItem('cosmic_ball_dmg_lvl', ballDamageLevel.toString());
  }, [ballDamageLevel]);

  useEffect(() => {
    localStorage.setItem('cosmic_luck_lvl', luckLevel.toString());
  }, [luckLevel]);

  useEffect(() => {
    localStorage.setItem('cosmic_2x_unlocked_v2', is2xUnlocked.toString());
  }, [is2xUnlocked]);

  useEffect(() => {
    localStorage.setItem('cosmic_5x_unlocked', is5xUnlocked.toString());
  }, [is5xUnlocked]);

  useEffect(() => {
    localStorage.setItem('cosmic_revive_tickets', reviveTickets.toString());
  }, [reviveTickets]);

  const handleUpgradeBallDamage = () => {
    const cost = Math.round(
      GameConfig.UPGRADE_BALL_DMG_BASE_COST * (1 + ballDamageLevel * GameConfig.UPGRADE_BALL_DMG_COST_FACTOR)
    );
    if (coins >= cost) {
      setCoins((c) => c - cost);
      setBallDamageLevel((l) => l + 1);
    }
  };

  const handleUpgradeLuck = () => {
    if (luckLevel >= GameConfig.LUCK_MAX_LEVEL) return;
    const cost = GameConfig.UPGRADE_LUCK_BASE_COST * (luckLevel + 1);
    if (coins >= cost) {
      setCoins((c) => c - cost);
      setLuckLevel((l) => l + 1);
    }
  };

  const handleConfirmUnlockSpeed = () => {
    if (!unlockSpeedTarget) return;
    const { speed, cost } = unlockSpeedTarget;
    if (coins >= cost) {
      setCoins((c) => c - cost);
      if (speed === 2) setIs2xUnlocked(true);
      if (speed === 5) setIs5xUnlocked(true);
    }
    setUnlockSpeedTarget(null);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#090812] text-slate-100 overflow-hidden font-sans">
      <main className="flex-1 relative overflow-hidden flex items-center justify-center">
        {activeTab === 'PLAY' ? (
          <GameCanvas
            coins={coins}
            bestScore={bestScore}
            ballDamageLevel={ballDamageLevel}
            luckLevel={luckLevel}
            is2xUnlocked={is2xUnlocked}
            is5xUnlocked={is5xUnlocked}
            reviveTickets={reviveTickets}
            targetFps={targetFps}
            soundEnabled={soundEnabled}
            continuousShoot={continuousShoot}
            showFps={showFps}
            onCoinsChange={setCoins}
            onBestScoreChange={setBestScore}
            onReviveTicketsChange={setReviveTickets}
            onRequestUnlockSpeed={(speed, cost) => setUnlockSpeedTarget({ speed, cost })}
            onOpenPause={() => setIsPauseOpen(true)}
            onOpenUpgrades={() => setIsUpgradeOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAndroidExplorer={() => setActiveTab('ANDROID_PROJECT')}
          />
        ) : (
          <AndroidProjectExplorer onBackToGame={() => setActiveTab('PLAY')} />
        )}
      </main>

      <UpgradeDrawer
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        coins={coins}
        ballDamageLevel={ballDamageLevel}
        luckLevel={luckLevel}
        onUpgradeBallDamage={handleUpgradeBallDamage}
        onUpgradeLuck={handleUpgradeLuck}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        targetFps={targetFps}
        onTargetFpsChange={setTargetFps}
        soundEnabled={soundEnabled}
        onSoundChange={setSoundEnabled}
        continuousShoot={continuousShoot}
        onContinuousShootChange={setContinuousShoot}
        showFps={showFps}
        onShowFpsChange={setShowFps}
      />

      <PauseModal
        isOpen={isPauseOpen}
        onClose={() => setIsPauseOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onRestart={() => {
          setIsPauseOpen(false);
          window.location.reload();
        }}
      />

      <UnlockSpeedModal
        isOpen={unlockSpeedTarget !== null}
        onClose={() => setUnlockSpeedTarget(null)}
        speed={unlockSpeedTarget?.speed ?? 2}
        cost={unlockSpeedTarget?.cost ?? 1000}
        currentCoins={coins}
        onConfirmUnlock={handleConfirmUnlockSpeed}
      />
    </div>
  );
}
