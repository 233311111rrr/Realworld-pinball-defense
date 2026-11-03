import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameConfig } from '../GameConfig';
import { webAudio } from '../audio/WebAudio';
import {
  MonsterEntity,
  BallEntity,
  LaserCannonEntity,
  MissileEntity,
  DamageTextEntity,
  ParticleEntity,
  MonsterKind,
  SkillCard,
  SkillType,
} from '../types';
import {
  loadArcadeSprites,
  LoadedArcadeSprites,
  GARGOYLE_SPRITE_URL,
  OCTOPUS_SPRITE_URL,
  CHEST_SPRITE_URL,
  FIGHTER_SPRITE_URL,
} from '../assets/arcadeSprites';

interface GameCanvasProps {
  coins: number;
  bestScore: number;
  ballDamageLevel: number;
  luckLevel: number;
  is2xUnlocked: boolean;
  is5xUnlocked: boolean;
  reviveTickets: number;
  targetFps: number;
  soundEnabled: boolean;
  continuousShoot: boolean;
  showFps: boolean;
  onCoinsChange: (newCoins: number) => void;
  onBestScoreChange: (newBest: number) => void;
  onReviveTicketsChange: (newTickets: number) => void;
  onRequestUnlockSpeed: (speed: number, cost: number) => void;
  onOpenPause: () => void;
  onOpenUpgrades: () => void;
  onOpenSettings: () => void;
  onOpenAndroidExplorer: () => void;
}

interface DiamondZone {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  coins,
  bestScore,
  ballDamageLevel,
  luckLevel,
  is2xUnlocked,
  is5xUnlocked,
  reviveTickets,
  soundEnabled,
  continuousShoot,
  showFps,
  onCoinsChange,
  onBestScoreChange,
  onReviveTicketsChange,
  onRequestUnlockSpeed,
  onOpenPause,
  onOpenUpgrades,
  onOpenSettings,
  onOpenAndroidExplorer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spritesRef = useRef<LoadedArcadeSprites | null>(null);

  const [showTitleMenu, setShowTitleMenu] = useState<boolean>(true);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [freezeUses, setFreezeUses] = useState<number>(GameConfig.ITEM_INITIAL_USES);
  const [bombUses, setBombUses] = useState<number>(GameConfig.ITEM_INITIAL_USES);
  const [doubleDmgUses, setDoubleDmgUses] = useState<number>(GameConfig.ITEM_INITIAL_USES);
  const [freezeTimer, setFreezeTimer] = useState<number>(0);
  const [doubleDmgTimer, setDoubleDmgTimer] = useState<number>(0);
  const [fpsDisplay, setFpsDisplay] = useState<number>(60);

  const [lotteryCards, setLotteryCards] = useState<SkillCard[] | null>(null);
  const [showReviveModal, setShowReviveModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);
  const [earnedCoinsFinal, setEarnedCoinsFinal] = useState<number>(0);
  const [survivedRowsCount, setSurvivedRowsCount] = useState<number>(0);
  const [revivesUsedCount, setRevivesUsedCount] = useState<number>(0);

  const skillsRef = useRef({
    extraFireRate: 0,
    laserCount: 1,
    skillDmgBonus: 0,
    ballDmgBonus: 0,
    hasMissile: true,
    missileLevel: 1,
    skillHaste: 0,
  });

  const entitiesRef = useRef({
    monsters: [] as MonsterEntity[],
    balls: [] as BallEntity[],
    laserCannons: [
      { slotIndex: 0, x: 540 - 330, y: GameConfig.SHIP_Y, cooldownTimer: 0, firingTimer: 0 },
      { slotIndex: 1, x: 540 - 190, y: GameConfig.SHIP_Y, cooldownTimer: 0, firingTimer: 0 },
      { slotIndex: 2, x: 540 + 190, y: GameConfig.SHIP_Y, cooldownTimer: 0, firingTimer: 0 },
      { slotIndex: 3, x: 540 + 330, y: GameConfig.SHIP_Y, cooldownTimer: 0, firingTimer: 0 },
    ] as LaserCannonEntity[],
    missiles: [] as MissileEntity[],
    damageTexts: [] as DamageTextEntity[],
    particles: [] as ParticleEntity[],
    diamondZones: [] as DiamondZone[],
    stars: Array.from({ length: 130 }, (_, idx) => ({
      x: Math.random() * GameConfig.LOGICAL_WIDTH,
      y: Math.random() * GameConfig.PLAYFIELD_HEIGHT,
      speed: Math.random() * 35 + 12,
      radius: Math.random() * 2.4 + 0.8,
      isSparkle: idx % 14 === 0,
      color: idx % 9 === 0 ? '#38BDF8' : idx % 13 === 0 ? '#F472B6' : '#FFFFFF',
    })),
    waveCount: 1,
    isCatchingUp: false,
    catchUpWaitingRow1Mid: false,
    pendingChests: 0,
    isPaused: false,
    isTouching: false,
    touchX: 540,
    touchY: 900,
    lastAimX: 0.18,
    lastAimY: -0.98,
    shootCooldownTimer: 0,
    invincibleTimer: 0,
    missileCooldownTimer: 0,
    missileLockingTimer: 0,
    isMissileLocking: false,
    lockedTargetIds: [] as number[],
    nextEntityId: 1,
  });

  useEffect(() => {
    spritesRef.current = loadArcadeSprites();
  }, []);

  useEffect(() => {
    webAudio.setMuted(!soundEnabled);
  }, [soundEnabled]);

  const formatHp = (hp: number): string => {
    if (hp >= 1_000_000) return (hp / 1_000_000).toFixed(1) + 'M';
    if (hp >= 10_000) return (hp / 1_000).toFixed(1) + 'K';
    if (hp >= 1_000) return (hp / 1_000).toFixed(2) + 'K';
    return Math.max(1, Math.floor(hp)).toString();
  };

  const getCoordinatesAtDistance = (dist: number): [number, number, number] => {
    const startY = GameConfig.SNAKE_START_Y;
    const rowSpacing = GameConfig.SNAKE_ROW_SPACING;
    const leftBound = GameConfig.SNAKE_LEFT_BOUND;
    const rightBound = GameConfig.SNAKE_RIGHT_BOUND;
    const rowLen = rightBound - leftBound;
    const turnLen = rowSpacing;

    let remaining = dist;
    let curY = startY;

    for (let r = 0; r < GameConfig.SNAKE_TOTAL_ROWS; r++) {
      const isEven = r % 2 === 0;
      const startX = isEven ? rightBound : leftBound;
      const endX = isEven ? leftBound : rightBound;

      if (remaining <= rowLen) {
        const ratio = Math.max(0, Math.min(1, remaining / rowLen));
        const x = startX + (endX - startX) * ratio;
        return [x, curY, r];
      }
      remaining -= rowLen;

      if (r < GameConfig.SNAKE_TOTAL_ROWS - 1) {
        if (remaining <= turnLen) {
          const ratio = Math.max(0, Math.min(1, remaining / turnLen));
          const y = curY + turnLen * ratio;
          return [endX, y, r];
        }
        remaining -= turnLen;
        curY += rowSpacing;
      }
    }
    return [rightBound, startY + (GameConfig.SNAKE_TOTAL_ROWS - 1) * rowSpacing, GameConfig.SNAKE_TOTAL_ROWS - 1];
  };

  // 從右上角 (SNAKE_RIGHT_BOUND, SNAKE_START_Y) 依序往左進場生成單排怪物
  const spawnMonsterRow = useCallback(() => {
    const e = entitiesRef.current;
    const baseHp =
      GameConfig.MONSTER_INITIAL_HP *
      Math.pow(1 + GameConfig.MONSTER_HP_ROW_GROWTH_RATE, e.waveCount - 1);
    const isBossWave = e.waveCount % GameConfig.BOSS_ROW_INTERVAL === 0;

    const startY = GameConfig.SNAKE_START_Y;
    const rightBound = GameConfig.SNAKE_RIGHT_BOUND;
    const spacing = GameConfig.MONSTER_SPACING;

    const activeMonsters = e.monsters.filter((m) => m.active);
    const hasActive = activeMonsters.length > 0;
    const minProgress = hasActive
      ? activeMonsters.reduce((min, m) => Math.min(min, m.pathProgress), Infinity)
      : 0;
    // 開局第一波第 1 隻怪從 pathProgress = 0 (右上角入口) 立即往左出發；後續波次緊接著隊尾排隊進場
    const leadProgress = hasActive ? Math.min(0, minProgress) - spacing : 0;

    for (let i = 0; i < GameConfig.MONSTERS_PER_ROW; i++) {
      const isBoss = isBossWave && i === Math.floor(GameConfig.MONSTERS_PER_ROW / 2);
      const isChest = !isBoss && Math.random() < GameConfig.CHEST_SPAWN_CHANCE;

      const hp = isBoss
        ? baseHp * GameConfig.BOSS_HP_MULTIPLIER
        : isChest
        ? baseHp * GameConfig.CHEST_HP_RATIO
        : baseHp;

      let kind: MonsterKind = 'CYCLOPS';
      if (isBoss) kind = 'BOSS';
      else if (isChest) kind = 'CHEST';
      else if (Math.random() < 0.22) kind = 'OCTOPUS';

      const progress = leadProgress - i * spacing;

      const m: MonsterEntity = {
        id: e.nextEntityId++,
        active: true,
        kind,
        x: rightBound,
        y: startY,
        radius: isBoss ? GameConfig.MONSTER_WIDTH * 0.78 : GameConfig.MONSTER_WIDTH * 0.46,
        currentHp: hp,
        maxHp: hp,
        rowIndex: 0,
        isChest,
        isBoss,
        pathProgress: progress,
        isTargetLocked: false,
      };
      e.monsters.push(m);
    }
    e.waveCount++;
    setSurvivedRowsCount(e.waveCount - 1);
  }, []);

  const resetGame = useCallback(() => {
    const e = entitiesRef.current;
    e.monsters = [];
    e.balls = [];
    e.missiles = [];
    e.damageTexts = [];
    e.particles = [];
    e.diamondZones = [];
    e.waveCount = 1;
    e.isCatchingUp = false;
    e.catchUpWaitingRow1Mid = false;
    e.pendingChests = 0;
    e.isPaused = false;
    e.shootCooldownTimer = 0;
    e.invincibleTimer = 0;
    e.missileCooldownTimer = 0;
    e.missileLockingTimer = 0;
    e.isMissileLocking = false;
    e.lockedTargetIds = [];

    skillsRef.current = {
      extraFireRate: 0,
      laserCount: 1,
      skillDmgBonus: 0,
      ballDmgBonus: 0,
      hasMissile: true,
      missileLevel: 1,
      skillHaste: 0,
    };

    setCurrentScore(0);
    setFreezeUses(GameConfig.ITEM_INITIAL_USES);
    setBombUses(GameConfig.ITEM_INITIAL_USES);
    setDoubleDmgUses(GameConfig.ITEM_INITIAL_USES);
    setFreezeTimer(0);
    setDoubleDmgTimer(0);
    setRevivesUsedCount(0);
    setShowGameOverModal(false);
    setShowReviveModal(false);
    setLotteryCards(null);

    // 開局僅從右上角生成第 1 排隊伍，依序往左進場，不再開局滿屏
    spawnMonsterRow();
  }, [spawnMonsterRow]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const spawnDamageText = (x: number, y: number, amount: number, color = '#FFFFFF') => {
    const e = entitiesRef.current;
    if (e.damageTexts.length < 65) {
      e.damageTexts.push({
        active: true,
        x: x + (Math.random() * 24 - 12),
        y: y + (Math.random() * 16 - 8),
        text: `-${Math.round(amount)}`,
        lifespan: 0,
        color,
      });
    }
  };

  const spawnParticles = (x: number, y: number, color: string) => {
    const e = entitiesRef.current;
    for (let i = 0; i < 8; i++) {
      if (e.particles.length < 120) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 240 + 70;
        e.particles.push({
          active: true,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 5 + 3,
          lifespan: 0,
          color,
        });
      }
    }
  };

  const getLuckProbs = useCallback(() => {
    const p1 = Math.min(0.9, Math.max(0.1, GameConfig.LUCK_BASE_PROBABILITIES[0] + luckLevel * GameConfig.LUCK_PROB_STEP_PER_LEVEL[0]));
    const p2 = Math.min(0.6, Math.max(0.05, GameConfig.LUCK_BASE_PROBABILITIES[1] + luckLevel * GameConfig.LUCK_PROB_STEP_PER_LEVEL[1]));
    const p3 = Math.max(0.01, 1.0 - p1 - p2);
    return [p1, p2, p3];
  }, [luckLevel]);

  const rollThreeCards = useCallback((): SkillCard[] => {
    const probs = getLuckProbs();
    const cards: SkillCard[] = [];
    const s = skillsRef.current;

    const rollStar = () => {
      const r = Math.random();
      if (r < probs[0]) return 1;
      if (r < probs[0] + probs[1]) return 2;
      return 3;
    };

    while (cards.length < 3) {
      const star = rollStar();
      const possibleTypes: SkillType[] = ['INCREASE_FIRE_RATE', 'SKILL_DAMAGE_BOOST', 'BALL_DAMAGE_BOOST', 'SKILL_HASTE'];
      if (star >= 2) possibleTypes.push('HOMING_MISSILE');
      if (star === 3 && s.laserCount < GameConfig.LASER_MAX_SLOTS) possibleTypes.push('LASER_CANNON');

      const type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
      if (cards.some((c) => c.type === type)) continue;

      let card: SkillCard;
      if (type === 'INCREASE_FIRE_RATE') {
        const add = GameConfig.SKILL_FIRE_RATE_TIERS[star - 1];
        const cur = 1 / GameConfig.BASE_FIRE_INTERVAL_SEC + s.extraFireRate;
        card = {
          type,
          star,
          title: '發球加速',
          description: `主動彈球射擊速率增加 +${add} 顆/秒`,
          currentValueStr: `目前: ${cur.toFixed(2)} 顆/秒`,
          nextValueStr: `升級後: ${(cur + add).toFixed(2)} 顆/秒`,
        };
      } else if (type === 'LASER_CANNON') {
        card = {
          type,
          star: 3,
          title: '高能電漿雷射砲',
          description: '在戰機兩翼安裝電漿雷射副砲，週期展開菱形電漿網與光束掃蕩敵軍',
          currentValueStr: `目前槽位: ${s.laserCount}/${GameConfig.LASER_MAX_SLOTS}`,
          nextValueStr: `升級後: ${s.laserCount + 1}/${GameConfig.LASER_MAX_SLOTS} 座`,
        };
      } else if (type === 'SKILL_DAMAGE_BOOST') {
        const add = GameConfig.SKILL_DAMAGE_BONUS_TIERS[star - 1];
        card = {
          type,
          star,
          title: '技能增強',
          description: `提升副武器（雷射與飛彈）傷害 +${Math.round(add * 100)}%`,
          currentValueStr: `加成: +${Math.round(s.skillDmgBonus * 100)}%`,
          nextValueStr: `升級後: +${Math.round((s.skillDmgBonus + add) * 100)}%`,
        };
      } else if (type === 'BALL_DAMAGE_BOOST') {
        const add = GameConfig.BALL_DAMAGE_BONUS_TIERS[star - 1];
        card = {
          type,
          star,
          title: '球傷害增強',
          description: `提升紅蓮彈球基礎碰撞傷害 +${Math.round(add * 100)}%`,
          currentValueStr: `加成: +${Math.round(s.ballDmgBonus * 100)}%`,
          nextValueStr: `升級後: +${Math.round((s.ballDmgBonus + add) * 100)}%`,
        };
      } else if (type === 'HOMING_MISSILE') {
        const curDmg = (GameConfig.MISSILE_INITIAL_DAMAGE + s.missileLevel * 150) * (1 + s.skillDmgBonus);
        card = {
          type,
          star: 2,
          title: s.hasMissile ? '飛彈強化' : '導引飛彈系統',
          description: '鎖定前排 3 隻敵人顯示雙弧準星 ( )，延遲 0.7 秒發射追蹤飛彈',
          currentValueStr: s.hasMissile ? `傷害: ${Math.round(curDmg)}` : '未裝備',
          nextValueStr: s.hasMissile ? `傷害: ${Math.round(curDmg + 150 * (1 + s.skillDmgBonus))}` : '初始傷害: 500',
        };
      } else {
        const haste = GameConfig.SKILL_HASTE_TIERS[star - 1];
        card = {
          type,
          star,
          title: '技能加速',
          description: `縮短雷射與飛彈技能冷卻，加速比率 +${haste}x`,
          currentValueStr: `冷卻倍速: ${(1 + s.skillHaste).toFixed(1)}x`,
          nextValueStr: `升級後: ${(1 + s.skillHaste + haste).toFixed(1)}x`,
        };
      }
      cards.push(card);
    }
    return cards;
  }, [getLuckProbs]);

  const applySkillCard = (card: SkillCard) => {
    const s = skillsRef.current;
    if (card.type === 'INCREASE_FIRE_RATE') {
      s.extraFireRate += GameConfig.SKILL_FIRE_RATE_TIERS[card.star - 1];
    } else if (card.type === 'LASER_CANNON') {
      if (s.laserCount < GameConfig.LASER_MAX_SLOTS) s.laserCount++;
    } else if (card.type === 'SKILL_DAMAGE_BOOST') {
      s.skillDmgBonus += GameConfig.SKILL_DAMAGE_BONUS_TIERS[card.star - 1];
    } else if (card.type === 'BALL_DAMAGE_BOOST') {
      s.ballDmgBonus += GameConfig.BALL_DAMAGE_BONUS_TIERS[card.star - 1];
    } else if (card.type === 'HOMING_MISSILE') {
      if (!s.hasMissile) s.hasMissile = true;
      else s.missileLevel++;
    } else if (card.type === 'SKILL_HASTE') {
      s.skillHaste += GameConfig.SKILL_HASTE_TIERS[card.star - 1];
    }
  };

  useEffect(() => {
    if (currentScore > bestScore) {
      onBestScoreChange(currentScore);
    }
  }, [currentScore, bestScore, onBestScoreChange]);

  const onMonsterDefeated = (m: MonsterEntity) => {
    spawnParticles(m.x, m.y, m.isChest ? '#FBBF24' : '#FB7185');

    if (m.isChest) {
      webAudio.playChestOpen();
      setCurrentScore((prev) => prev + GameConfig.SCORE_CHEST_BONUS);
      entitiesRef.current.pendingChests++;
    } else if (m.isBoss) {
      webAudio.playExplode();
      setCurrentScore((prev) => {
        const bonus = Math.floor(m.maxHp * GameConfig.SCORE_MONSTER_KILL_HP_RATIO) + GameConfig.SCORE_BOSS_BONUS;
        return prev + bonus;
      });
      onReviveTicketsChange(reviveTickets + 1);
    } else {
      webAudio.playExplode();
      setCurrentScore((prev) => {
        const killScore = Math.max(10, Math.floor(m.maxHp * 0.005));
        return prev + killScore;
      });
    }
  };

  const clampBallAngle = (ball: BallEntity) => {
    let angle = Math.atan2(ball.vy, ball.vx);
    const minRad = (GameConfig.BALL_MIN_HORIZONTAL_ANGLE_DEG * Math.PI) / 180;
    if (Math.abs(angle) < minRad) {
      angle = angle >= 0 ? minRad : -minRad;
    }
    const pi = Math.PI;
    if (Math.abs(angle - pi) < minRad) {
      angle = pi - minRad;
    } else if (Math.abs(angle + pi) < minRad) {
      angle = -pi + minRad;
    }
    ball.vx = Math.cos(angle) * GameConfig.BALL_SPEED;
    ball.vy = Math.sin(angle) * GameConfig.BALL_SPEED;
  };

  const fixedUpdate = (dt: number) => {
    const e = entitiesRef.current;
    const s = skillsRef.current;

    if (e.invincibleTimer > 0) e.invincibleTimer -= dt;

    const shipCenterY = GameConfig.SHIP_Y;
    const muzzleY = shipCenterY - 55;

    const effectiveFireRate = 1 / GameConfig.BASE_FIRE_INTERVAL_SEC + s.extraFireRate;
    const fireInterval = 1 / effectiveFireRate;
    e.shootCooldownTimer += dt;

    const shouldShoot = e.isTouching || (continuousShoot && (e.lastAimX !== 0 || e.lastAimY !== 0));

    if (shouldShoot && e.shootCooldownTimer >= fireInterval) {
      e.shootCooldownTimer = 0;
      const targetX = e.isTouching ? e.touchX : 540 + e.lastAimX * 200;
      const targetY = e.isTouching ? e.touchY : shipCenterY + e.lastAimY * 200;

      let dirX = targetX - 540;
      let dirY = targetY - shipCenterY;
      if (dirY >= -40) dirY = -40;

      const len = Math.sqrt(dirX * dirX + dirY * dirY);
      if (len > 0.001) {
        e.lastAimX = dirX / len;
        e.lastAimY = dirY / len;
      }

      let ballToUse: BallEntity | undefined = e.balls.find((b) => !b.active);
      if (!ballToUse && e.balls.length >= GameConfig.BALL_MAX_COUNT) {
        e.balls.sort((a, b) => a.spawnTimestamp - b.spawnTimestamp);
        ballToUse = e.balls[0];
      } else if (!ballToUse) {
        ballToUse = {
          active: true,
          x: 540,
          y: muzzleY,
          vx: 0,
          vy: 0,
          damage: GameConfig.BASE_BALL_DAMAGE,
          lifespan: 0,
          bounceCount: 0,
          spawnTimestamp: Date.now(),
        };
        e.balls.push(ballToUse);
      }

      const dmgMult = doubleDmgTimer > 0 ? 2 : 1;
      const baseDmg = GameConfig.BASE_BALL_DAMAGE + ballDamageLevel * 25;
      const ballDmg = baseDmg * (1 + s.ballDmgBonus) * dmgMult;

      ballToUse.active = true;
      ballToUse.x = 540;
      ballToUse.y = muzzleY;
      ballToUse.vx = (dirX / len) * GameConfig.BALL_SPEED;
      ballToUse.vy = (dirY / len) * GameConfig.BALL_SPEED;
      ballToUse.damage = ballDmg;
      ballToUse.lifespan = 0;
      ballToUse.bounceCount = 0;
      ballToUse.spawnTimestamp = Date.now();
      clampBallAngle(ballToUse);

      webAudio.playShoot();
    }

    for (const b of e.balls) {
      if (!b.active) continue;
      b.lifespan += dt;
      if (b.lifespan >= GameConfig.BALL_MAX_LIFESPAN_SEC || b.bounceCount >= GameConfig.BALL_MAX_BOUNCES) {
        b.active = false;
        continue;
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x - GameConfig.BALL_RADIUS <= 0) {
        b.x = GameConfig.BALL_RADIUS;
        b.vx = -b.vx;
        b.bounceCount++;
        clampBallAngle(b);
      } else if (b.x + GameConfig.BALL_RADIUS >= GameConfig.LOGICAL_WIDTH) {
        b.x = GameConfig.LOGICAL_WIDTH - GameConfig.BALL_RADIUS;
        b.vx = -b.vx;
        b.bounceCount++;
        clampBallAngle(b);
      }
      // 獨立戰場頂部反彈牆 (緊貼頂部 HUD 下緣，完全不遮擋)
      if (b.y - GameConfig.BALL_RADIUS <= GameConfig.PLAYFIELD_TOP_WALL) {
        b.y = GameConfig.PLAYFIELD_TOP_WALL + GameConfig.BALL_RADIUS;
        b.vy = -b.vy;
        b.bounceCount++;
        clampBallAngle(b);
      }
      // 碰到或越過戰場底部邊界 (飛機所在線) 立即消失回收
      if (b.y + GameConfig.BALL_RADIUS >= GameConfig.BOTTOM_BOUNDARY_Y) {
        b.active = false;
      }
    }

    for (const b of e.balls) {
      if (!b.active) continue;
      for (const m of e.monsters) {
        if (!m.active || m.pathProgress < 0) continue;

        const dx = b.x - m.x;
        const dy = b.y - m.y;
        const distSq = dx * dx + dy * dy;
        const combinedR = GameConfig.BALL_RADIUS + m.radius;

        if (distSq <= combinedR * combinedR) {
          const dist = Math.sqrt(distSq);
          const nx = dist > 0.001 ? dx / dist : 0;
          const ny = dist > 0.001 ? dy / dist : -1;

          m.currentHp -= b.damage;
          spawnDamageText(m.x, m.y, b.damage, '#CBD5E1');
          webAudio.playHit();

          if (m.currentHp <= 0) {
            m.active = false;
            onMonsterDefeated(m);
          }

          if (GameConfig.BOUNCE_ON_MONSTER) {
            const dot = b.vx * nx + b.vy * ny;
            b.vx = b.vx - 2 * dot * nx;
            b.vy = b.vy - 2 * dot * ny;
            clampBallAngle(b);
            b.bounceCount++;
          } else {
            b.active = false;
          }
          break;
        }
      }
    }

    if (freezeTimer <= 0) {
      // 包含第 1 排場上與正在從右上角進入第 1 排的怪物，確保開局以固定正常速度從右上往左推進
      const row0AndEnteringCount = e.monsters.filter(
        (m) => m.active && (m.rowIndex === 0 || m.pathProgress < 0)
      ).length;
      const halfCapacity = GameConfig.MONSTERS_PER_ROW * GameConfig.CATCH_UP_THRESHOLD_RATIO;

      if (row0AndEnteringCount <= halfCapacity && !e.isCatchingUp && !e.catchUpWaitingRow1Mid) {
        e.isCatchingUp = true;
        e.catchUpWaitingRow1Mid = true;
      }

      if (e.catchUpWaitingRow1Mid) {
        const rowLen = GameConfig.SNAKE_RIGHT_BOUND - GameConfig.SNAKE_LEFT_BOUND;
        const midDist = rowLen + GameConfig.SNAKE_ROW_SPACING + rowLen * 0.5;
        const reached = e.monsters.some((m) => m.active && m.pathProgress >= midDist);
        if (reached) {
          e.isCatchingUp = false;
          e.catchUpWaitingRow1Mid = false;
        }
      }

      const speed = e.isCatchingUp
        ? GameConfig.MONSTER_BASE_SPEED * GameConfig.CATCH_UP_SPEED_MULTIPLIER
        : GameConfig.MONSTER_BASE_SPEED;

      const rowLen = GameConfig.SNAKE_RIGHT_BOUND - GameConfig.SNAKE_LEFT_BOUND;
      const totalPathLen =
        GameConfig.SNAKE_TOTAL_ROWS * rowLen +
        (GameConfig.SNAKE_TOTAL_ROWS - 1) * GameConfig.SNAKE_ROW_SPACING;

      for (const m of e.monsters) {
        if (!m.active) continue;
        m.pathProgress += speed * dt;

        if (m.pathProgress >= 0) {
          const [nx, ny, row] = getCoordinatesAtDistance(m.pathProgress);
          m.x = nx;
          m.y = ny;
          m.rowIndex = row;

          if (m.pathProgress >= totalPathLen) {
            if (e.invincibleTimer <= 0) {
              if (revivesUsedCount < GameConfig.REVIVE_MAX_TIMES) {
                e.isPaused = true;
                setShowReviveModal(true);
              } else {
                e.isPaused = true;
                triggerGameOver();
              }
              return;
            }
          }
        }
      }

      // 當目前正在進場的一排怪物尾端已進入右上角起點 (minProgress >= 12) 或場上全清時，才銜接生成下一排
      const activeMonsters = e.monsters.filter((m) => m.active);
      const minProgress =
        activeMonsters.length > 0
          ? activeMonsters.reduce((min, m) => Math.min(min, m.pathProgress), Infinity)
          : Infinity;
      const maxFieldMonsters = GameConfig.MONSTERS_PER_ROW * GameConfig.SNAKE_TOTAL_ROWS;

      if (
        activeMonsters.length === 0 ||
        (minProgress >= 12 && activeMonsters.length < maxFieldMonsters)
      ) {
        spawnMonsterRow();
      }
    }

    // 雷射砲（直線貫穿打擊該線上所有敵人 + 菱形電漿視覺）
    const laserDmgMult = doubleDmgTimer > 0 ? 2 : 1;
    const laserDmg = GameConfig.LASER_INITIAL_DAMAGE * (1 + s.skillDmgBonus) * laserDmgMult;
    const laserCooldown = 1 / (GameConfig.LASER_FIRE_RATE * (1 + s.skillHaste));

    for (let i = 0; i < s.laserCount; i++) {
      const cannon = e.laserCannons[i];
      if (cannon.firingTimer > 0) cannon.firingTimer -= dt;

      cannon.cooldownTimer += dt;
      if (cannon.cooldownTimer >= laserCooldown) {
        cannon.cooldownTimer = 0;
        cannon.firingTimer = 0.28;
        webAudio.playLaser();

        // 1. 貫穿直線傷害：擊中該雷射砲直線路徑上所有怪物
        for (const m of e.monsters) {
          if (m.active && m.pathProgress >= 0 && Math.abs(m.x - cannon.x) <= m.radius + 26) {
            m.currentHp -= laserDmg;
            spawnDamageText(m.x, m.y - 12, laserDmg, '#7DD3FC');
            if (m.currentHp <= 0) {
              m.active = false;
              onMonsterDefeated(m);
            }
          }
        }

        // 2. 若場上有密集怪群，同步展開菱形電漿力場視覺
        const visibleMonsters = e.monsters.filter((m) => m.active && m.pathProgress >= 0);
        if (visibleMonsters.length > 0) {
          const lineTarget =
            visibleMonsters.find((m) => Math.abs(m.x - cannon.x) <= m.radius + 50) ||
            visibleMonsters[Math.floor(Math.random() * visibleMonsters.length)];
          e.diamondZones.push({
            x: lineTarget.x,
            y: lineTarget.y,
            radius: 135,
            life: 0,
            maxLife: 0.75,
          });
        }
      }
    }

    for (const dz of e.diamondZones) {
      dz.life += dt;
    }
    e.diamondZones = e.diamondZones.filter((dz) => dz.life < dz.maxLife);

    if (s.hasMissile) {
      e.missileCooldownTimer += dt;
      const missileCooldown = GameConfig.MISSILE_COOLDOWN_SEC / (1 + s.skillHaste);

      if (!e.isMissileLocking && e.missileCooldownTimer >= missileCooldown - GameConfig.MISSILE_LOCK_DELAY_SEC) {
        e.isMissileLocking = true;
        e.missileLockingTimer = 0;
        e.lockedTargetIds = [];

        const targets = e.monsters
          .filter((m) => m.active && m.pathProgress >= 0)
          .sort((a, b) => b.pathProgress - a.pathProgress)
          .slice(0, GameConfig.MISSILE_LOCK_COUNT);

        targets.forEach((m) => {
          m.isTargetLocked = true;
          e.lockedTargetIds.push(m.id);
        });
      }

      if (e.isMissileLocking) {
        e.missileLockingTimer += dt;
        if (e.missileLockingTimer >= GameConfig.MISSILE_LOCK_DELAY_SEC) {
          e.isMissileLocking = false;
          e.missileCooldownTimer = 0;

          const mDmgMult = doubleDmgTimer > 0 ? 2 : 1;
          const missileDmg =
            (GameConfig.MISSILE_INITIAL_DAMAGE + (s.missileLevel - 1) * 150) *
            (1 + s.skillDmgBonus) *
            mDmgMult;

          e.lockedTargetIds.forEach((targetId, idx) => {
            const m = e.monsters.find((item) => item.id === targetId);
            if (m && m.active) {
              e.missiles.push({
                active: true,
                x: 540 + (idx - 1) * 45,
                y: GameConfig.SHIP_Y - 40,
                vx: (idx - 1) * 180,
                vy: -1150,
                targetId: m.id,
                damage: missileDmg,
              });
            }
          });
        }
      }

      for (const missile of e.missiles) {
        if (!missile.active) continue;
        const tgt = e.monsters.find((m) => m.id === missile.targetId);
        if (!tgt || !tgt.active) {
          missile.y += missile.vy * dt;
          if (missile.y < 0) missile.active = false;
          continue;
        }

        const dx = tgt.x - missile.x;
        const dy = tgt.y - missile.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= tgt.radius + 22) {
          tgt.isTargetLocked = false;
          tgt.currentHp -= missile.damage;
          spawnDamageText(tgt.x, tgt.y, missile.damage, '#F8FAFC');
          webAudio.playExplode();
          if (tgt.currentHp <= 0) {
            tgt.active = false;
            onMonsterDefeated(tgt);
          }
          missile.active = false;
          continue;
        }

        const angle = Math.atan2(dy, dx);
        const steer = 9.0 * dt;
        const spd = 1350;
        missile.vx += (Math.cos(angle) * spd - missile.vx) * steer;
        missile.vy += (Math.sin(angle) * spd - missile.vy) * steer;
        missile.x += missile.vx * dt;
        missile.y += missile.vy * dt;
      }
    }

    for (const txt of e.damageTexts) {
      if (!txt.active) continue;
      txt.lifespan += dt;
      txt.y -= 75 * dt;
      if (txt.lifespan >= 0.75) txt.active = false;
    }
    for (const p of e.particles) {
      if (!p.active) continue;
      p.lifespan += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.lifespan >= 0.5) p.active = false;
    }

    if (e.pendingChests > 0 && !lotteryCards && !showReviveModal && !showGameOverModal && !showTitleMenu) {
      e.pendingChests--;
      e.isPaused = true;
      setLotteryCards(rollThreeCards());
    }
  };

  const triggerGameOver = () => {
    const earned = Math.floor(currentScore / GameConfig.COIN_SCORE_DIVISOR) + survivedRowsCount * GameConfig.COIN_ROW_SURVIVAL_BONUS;
    setEarnedCoinsFinal(earned);
    onCoinsChange(coins + earned);
    setShowGameOverModal(true);
  };

  const renderCanvas = useCallback((ctx: CanvasRenderingContext2D, animTime: number) => {
    const e = entitiesRef.current;
    const s = skillsRef.current;
    const sprites = spritesRef.current;
    const playH = GameConfig.PLAYFIELD_HEIGHT;
    const shipCenterY = GameConfig.SHIP_Y;
    const muzzleY = shipCenterY - 55;

    ctx.clearRect(0, 0, GameConfig.LOGICAL_WIDTH, playH);

    // 1. 紫藍星雲深空背景 (獨立戰場全尺寸 1080 x 1820)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, playH);
    bgGrad.addColorStop(0, '#1D1836');
    bgGrad.addColorStop(0.48, '#2A2248');
    bgGrad.addColorStop(1, '#1B1630');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, GameConfig.LOGICAL_WIDTH, playH);

    const nebulaGrad = ctx.createRadialGradient(540, 660, 60, 540, 660, 650);
    nebulaGrad.addColorStop(0, 'rgba(180, 110, 140, 0.24)');
    nebulaGrad.addColorStop(0.5, 'rgba(110, 75, 145, 0.14)');
    nebulaGrad.addColorStop(1, 'rgba(30, 24, 54, 0)');
    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, GameConfig.LOGICAL_WIDTH, playH);

    // 2. 繁星與四角星芒閃爍
    e.stars.forEach((star, i) => {
      const alpha = 0.35 + 0.55 * Math.sin(animTime * 2.5 + i);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = alpha;
      if (star.isSparkle) {
        const r = star.radius * 2.4;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y - r);
        ctx.lineTo(star.x + r * 0.3, star.y - r * 0.3);
        ctx.lineTo(star.x + r, star.y);
        ctx.lineTo(star.x + r * 0.3, star.y + r * 0.3);
        ctx.lineTo(star.x, star.y + r);
        ctx.lineTo(star.x - r * 0.3, star.y + r * 0.3);
        ctx.lineTo(star.x - r, star.y);
        ctx.lineTo(star.x - r * 0.3, star.y - r * 0.3);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1.0;

    // 2.5 繪製緊湊 10 排蛇形行軍軌道預覽線、右上角進場口與右下角終點警示標記
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    let trackY = GameConfig.SNAKE_START_Y;
    for (let r = 0; r < GameConfig.SNAKE_TOTAL_ROWS; r++) {
      const fromX = r % 2 === 0 ? GameConfig.SNAKE_RIGHT_BOUND : GameConfig.SNAKE_LEFT_BOUND;
      const toX = r % 2 === 0 ? GameConfig.SNAKE_LEFT_BOUND : GameConfig.SNAKE_RIGHT_BOUND;
      if (r === 0) ctx.moveTo(fromX, trackY);
      ctx.lineTo(toX, trackY);
      if (r < GameConfig.SNAKE_TOTAL_ROWS - 1) {
        trackY += GameConfig.SNAKE_ROW_SPACING;
        ctx.lineTo(toX, trackY);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 右上角進場傳送門標示 (第 1 排起點: 從右往左)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(GameConfig.SNAKE_RIGHT_BOUND, GameConfig.SNAKE_START_Y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 右下角終點警戒標記 (第 10 排終點: 最右下角)
    const endY = GameConfig.SNAKE_START_Y + (GameConfig.SNAKE_TOTAL_ROWS - 1) * GameConfig.SNAKE_ROW_SPACING;
    ctx.fillStyle = 'rgba(244, 63, 94, 0.24)';
    ctx.strokeStyle = 'rgba(251, 113, 133, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(GameConfig.SNAKE_RIGHT_BOUND, endY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = '900 18px system-ui, sans-serif';
    ctx.fillStyle = '#FDA4AF';
    ctx.textAlign = 'center';
    ctx.fillText('終點', GameConfig.SNAKE_RIGHT_BOUND, endY + 6);
    ctx.restore();

    // 3. 兩段式瞄準反射預覽線 (手指按住時顯示，只預測第一次碰牆反彈)
    if (e.isTouching) {
      let dirX = e.touchX - 540;
      let dirY = e.touchY - shipCenterY;
      if (dirY >= -40) dirY = -40;
      const len = Math.sqrt(dirX * dirX + dirY * dirY);
      if (len > 0.001) {
        let nx = dirX / len;
        let ny = dirY / len;

        ctx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
        ctx.lineWidth = 5;
        ctx.setLineDash([16, 12]);
        ctx.beginPath();
        ctx.moveTo(540, muzzleY);

        const curX = 540;
        const curY = muzzleY;
        let minT = 2200;
        let normX = 0;
        let normY = 0;

        if (nx < -0.0001) {
          const t = (GameConfig.BALL_RADIUS - curX) / nx;
          if (t > 0 && t < minT) {
            minT = t;
            normX = 1;
            normY = 0;
          }
        }
        if (nx > 0.0001) {
          const t = (GameConfig.LOGICAL_WIDTH - GameConfig.BALL_RADIUS - curX) / nx;
          if (t > 0 && t < minT) {
            minT = t;
            normX = -1;
            normY = 0;
          }
        }
        if (ny < -0.0001) {
          const t = (GameConfig.PLAYFIELD_TOP_WALL + GameConfig.BALL_RADIUS - curY) / ny;
          if (t > 0 && t < minT) {
            minT = t;
            normX = 0;
            normY = 1;
          }
        }

        const hitX1 = curX + nx * minT;
        const hitY1 = curY + ny * minT;
        ctx.lineTo(hitX1, hitY1);

        if (normX !== 0 || normY !== 0) {
          const dot = nx * normX + ny * normY;
          nx = nx - 2 * dot * normX;
          ny = ny - 2 * dot * normY;
          let minT2 = 1100;
          if (nx < -0.0001) {
            const t = (GameConfig.BALL_RADIUS - hitX1) / nx;
            if (t > 0 && t < minT2) minT2 = t;
          }
          if (nx > 0.0001) {
            const t = (GameConfig.LOGICAL_WIDTH - GameConfig.BALL_RADIUS - hitX1) / nx;
            if (t > 0 && t < minT2) minT2 = t;
          }
          if (ny < -0.0001) {
            const t = (GameConfig.PLAYFIELD_TOP_WALL + GameConfig.BALL_RADIUS - hitY1) / ny;
            if (t > 0 && t < minT2) minT2 = t;
          }
          ctx.lineTo(hitX1 + nx * minT2, hitY1 + ny * minT2);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 4. 繪製貫穿直線雷射光束與藍色菱形電漿力場
    for (let i = 0; i < s.laserCount; i++) {
      const cannon = e.laserCannons[i];
      if (cannon.firingTimer > 0) {
        const beamAlpha = Math.min(1, cannon.firingTimer / 0.28);
        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${(beamAlpha * 0.45).toFixed(2)})`;
        ctx.lineWidth = 28;
        ctx.beginPath();
        ctx.moveTo(cannon.x, shipCenterY - 25);
        ctx.lineTo(cannon.x, 0);
        ctx.stroke();

        ctx.strokeStyle = `rgba(224, 242, 254, ${beamAlpha.toFixed(2)})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cannon.x, shipCenterY - 25);
        ctx.lineTo(cannon.x, 0);
        ctx.stroke();
        ctx.restore();
      }
    }

    for (const dz of e.diamondZones) {
      const alpha = Math.max(0, Math.sin((dz.life / dz.maxLife) * Math.PI));
      ctx.save();
      ctx.translate(dz.x, dz.y);

      const fillGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, dz.radius);
      fillGrad.addColorStop(0, `rgba(125, 211, 252, ${(alpha * 0.35).toFixed(2)})`);
      fillGrad.addColorStop(0.7, `rgba(59, 130, 246, ${(alpha * 0.22).toFixed(2)})`);
      fillGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');

      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.moveTo(0, -dz.radius);
      ctx.lineTo(dz.radius, 0);
      ctx.lineTo(0, dz.radius);
      ctx.lineTo(-dz.radius, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(96, 165, 250, ${(alpha * 0.9).toFixed(2)})`;
      ctx.lineWidth = 9;
      ctx.stroke();

      ctx.strokeStyle = `rgba(224, 242, 254, ${(alpha * 0.95).toFixed(2)})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    }

    // 5. 繪製所有怪物與紫金寶箱 (2D 街機卡通精靈圖 + 頭頂厚黑描邊血量)
    for (const m of e.monsters) {
      if (!m.active || m.pathProgress < 0) continue;

      if (m.isTargetLocked) {
        ctx.save();
        const lockR = m.radius * 1.48;
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.32)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(m.x, m.y, lockR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(m.x, m.y, lockR, (130 * Math.PI) / 180, (230 * Math.PI) / 180);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(m.x, m.y, lockR, (-50 * Math.PI) / 180, (50 * Math.PI) / 180);
        ctx.stroke();
        ctx.restore();
      }

      const bobY = Math.sin(animTime * 5.5 + m.id * 0.7) * 2.5;
      const drawSize = m.isBoss ? m.radius * 2.3 : m.isChest ? m.radius * 2.25 : m.radius * 2.2;

      ctx.save();
      ctx.translate(m.x, m.y + bobY);

      const spriteImg =
        m.kind === 'CHEST'
          ? sprites?.chest
          : m.kind === 'BOSS'
          ? sprites?.boss
          : m.kind === 'OCTOPUS'
          ? sprites?.octopus
          : sprites?.gargoyle;

      if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
        ctx.drawImage(spriteImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else {
        ctx.fillStyle = m.isChest ? '#9333EA' : m.kind === 'OCTOPUS' ? '#FF8BD6' : '#9E8863';
        ctx.strokeStyle = '#18120E';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // 緊貼怪物額頭的厚黑描邊血量文字 (K/M 縮寫)
      ctx.save();
      ctx.font = m.isBoss
        ? '900 26px "Arial Black", system-ui, -apple-system, sans-serif'
        : '900 22px "Arial Black", system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      const hpY = m.y - m.radius * 0.42;
      const hpStr = formatHp(m.currentHp);

      ctx.strokeStyle = '#09090D';
      ctx.lineWidth = 6;
      ctx.strokeText(hpStr, m.x, hpY);

      ctx.fillStyle = m.isChest ? '#FFE838' : '#FFFFFF';
      ctx.fillText(hpStr, m.x, hpY);
      ctx.restore();
    }

    // 6. 繪製底部左右 4 個固定雷射砲槽位与已裝備的副砲 (完全在戰場底部內，絕不被底部道具欄遮擋)
    for (let i = 0; i < GameConfig.LASER_MAX_SLOTS; i++) {
      const cannon = e.laserCannons[i];
      const equipped = i < s.laserCount;
      ctx.save();
      // 底座插槽環
      ctx.fillStyle = equipped ? 'rgba(30, 58, 138, 0.65)' : 'rgba(15, 23, 42, 0.55)';
      ctx.strokeStyle = equipped ? '#38BDF8' : '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cannon.x, shipCenterY + 6, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (equipped) {
        const turretImg = i % 2 === 0 ? sprites?.turretRadar : sprites?.turretCannon;
        if (turretImg && turretImg.complete) {
          ctx.drawImage(turretImg, cannon.x - 42, shipCenterY - 36, 84, 84);
        }
      } else {
        ctx.fillStyle = '#64748B';
        ctx.font = '700 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('雷射槽', cannon.x, shipCenterY + 10);
      }
      ctx.restore();
    }

    // 7. 繪製追蹤飛彈
    for (const missile of e.missiles) {
      if (!missile.active) continue;
      ctx.save();
      const angle = Math.atan2(missile.vy, missile.vx);
      ctx.translate(missile.x, missile.y);
      ctx.rotate(angle);

      const trailGrad = ctx.createLinearGradient(-55, 0, 0, 0);
      trailGrad.addColorStop(0, 'rgba(249, 115, 22, 0)');
      trailGrad.addColorStop(0.6, 'rgba(251, 146, 60, 0.75)');
      trailGrad.addColorStop(1, 'rgba(254, 240, 138, 1)');
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(4, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 8. 繪製紅蓮高光彈球
    for (const b of e.balls) {
      if (!b.active) continue;
      ctx.save();
      ctx.fillStyle = '#18090C';
      ctx.beginPath();
      ctx.arc(b.x, b.y, GameConfig.BALL_RADIUS + 2.5, 0, Math.PI * 2);
      ctx.fill();

      const ballGrad = ctx.createRadialGradient(
        b.x - 4,
        b.y - 4,
        2,
        b.x,
        b.y,
        GameConfig.BALL_RADIUS
      );
      ballGrad.addColorStop(0, '#FF6B6B');
      ballGrad.addColorStop(0.55, '#EF233C');
      ballGrad.addColorStop(1, '#9B0F22');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, GameConfig.BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(b.x - 5, b.y - 5, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. 繪製玩家藍白雙聯裝噴射火箭戰機 (完整位於戰場底部中央，絕不被底部道具欄遮擋)
    if (sprites?.fighter && sprites.fighter.complete) {
      ctx.save();
      const pulse = Math.sin(animTime * 14) * 2;
      ctx.drawImage(sprites.fighter, 540 - 72, shipCenterY - 78 + pulse, 144, 152);
      if (e.invincibleTimer > 0) {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(540, shipCenterY, 80, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 10. 爆炸粒子與浮動傷害數字
    for (const p of e.particles) {
      if (!p.active) continue;
      const alpha = Math.max(0, 1 - p.lifespan / 0.5);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    for (const txt of e.damageTexts) {
      if (!txt.active) continue;
      const alpha = Math.max(0, (1 - txt.lifespan / 0.75) * 0.88);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '900 38px "Arial Black", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.lineWidth = 5;
      ctx.strokeText(txt.text, txt.x, txt.y);
      ctx.fillStyle = txt.color;
      ctx.fillText(txt.text, txt.x, txt.y);
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let animClock = 0;
    let frameCounter = 0;
    let fpsTimestamp = performance.now();

    const loop = (currentTime: number) => {
      let elapsed = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      if (elapsed > 0.25) elapsed = 0.25;

      const e = entitiesRef.current;

      if (!e.isPaused && !showTitleMenu) {
        const scaledElapsed = elapsed * speedMultiplier;
        animClock += scaledElapsed;

        e.stars.forEach((star) => {
          star.y += star.speed * scaledElapsed;
          if (star.y > GameConfig.PLAYFIELD_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * GameConfig.LOGICAL_WIDTH;
          }
        });

        if (freezeTimer > 0) {
          setFreezeTimer((t) => Math.max(0, t - scaledElapsed));
        }
        if (doubleDmgTimer > 0) {
          setDoubleDmgTimer((t) => Math.max(0, t - scaledElapsed));
        }

        const fixedDt = GameConfig.FIXED_DELTA_TIME;
        let acc = scaledElapsed;
        while (acc >= fixedDt) {
          fixedUpdate(fixedDt);
          acc -= fixedDt;
        }
      } else {
        animClock += elapsed;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) renderCanvas(ctx, animClock);
      }

      frameCounter++;
      if (currentTime - fpsTimestamp >= 1000) {
        setFpsDisplay(frameCounter);
        frameCounter = 0;
        fpsTimestamp = currentTime;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [fixedUpdate, renderCanvas, speedMultiplier, freezeTimer, doubleDmgTimer, showTitleMenu]);

  const handlePointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (showTitleMenu) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const virtX = ((ev.clientX - rect.left) / rect.width) * GameConfig.LOGICAL_WIDTH;
    const virtY = ((ev.clientY - rect.top) / rect.height) * GameConfig.PLAYFIELD_HEIGHT;

    entitiesRef.current.isTouching = true;
    entitiesRef.current.touchX = virtX;
    entitiesRef.current.touchY = virtY;
  };

  const handlePointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !entitiesRef.current.isTouching) return;
    const rect = canvas.getBoundingClientRect();
    const virtX = ((ev.clientX - rect.left) / rect.width) * GameConfig.LOGICAL_WIDTH;
    const virtY = ((ev.clientY - rect.top) / rect.height) * GameConfig.PLAYFIELD_HEIGHT;

    entitiesRef.current.touchX = virtX;
    entitiesRef.current.touchY = virtY;
  };

  const handlePointerUp = () => {
    entitiesRef.current.isTouching = false;
  };

  const handleUseFreeze = () => {
    if (freezeUses > 0 && freezeTimer <= 0) {
      setFreezeUses((u) => u - 1);
      setFreezeTimer(GameConfig.ITEM_FREEZE_DURATION_SEC);
      webAudio.vibrate(50);
    }
  };

  const handleUseBomb = () => {
    if (bombUses > 0) {
      setBombUses((u) => u - 1);
      webAudio.playExplode();
      const mult = doubleDmgTimer > 0 ? 2 : 1;
      const dmg = GameConfig.ITEM_BOMB_DAMAGE * mult;
      entitiesRef.current.monsters.forEach((m) => {
        if (m.active && m.pathProgress >= 0) {
          m.currentHp -= dmg;
          spawnDamageText(m.x, m.y, dmg, '#FEF08A');
          if (m.currentHp <= 0) {
            m.active = false;
            onMonsterDefeated(m);
          }
        }
      });
    }
  };

  const handleUseDoubleDmg = () => {
    if (doubleDmgUses > 0 && doubleDmgTimer <= 0) {
      setDoubleDmgUses((u) => u - 1);
      setDoubleDmgTimer(GameConfig.ITEM_DOUBLE_DAMAGE_DURATION_SEC);
      webAudio.vibrate(50);
    }
  };

  const handleSelectSpeed = (speed: number) => {
    if (speed === 1) setSpeedMultiplier(1);
    else if (speed === 2) {
      if (is2xUnlocked) setSpeedMultiplier(2);
      else onRequestUnlockSpeed(2, GameConfig.UNLOCK_2X_COST);
    } else if (speed === 5) {
      if (is5xUnlocked) setSpeedMultiplier(5);
      else onRequestUnlockSpeed(5, GameConfig.UNLOCK_5X_COST);
    }
  };

  const handleRevive = (useTicket: boolean) => {
    if (useTicket) {
      if (reviveTickets > 0) {
        onReviveTicketsChange(reviveTickets - 1);
        performReviveSuccess();
      }
    } else {
      if (coins >= GameConfig.REVIVE_COST_COINS) {
        onCoinsChange(coins - GameConfig.REVIVE_COST_COINS);
        performReviveSuccess();
      }
    }
  };

  const performReviveSuccess = () => {
    setRevivesUsedCount((c) => c + 1);
    entitiesRef.current.invincibleTimer = GameConfig.REVIVE_INVINCIBLE_DURATION_SEC;
    const targetMinRow = Math.max(0, GameConfig.SNAKE_TOTAL_ROWS - GameConfig.REVIVE_CLEARED_ROWS);
    entitiesRef.current.monsters.forEach((m) => {
      if (m.active && m.rowIndex >= targetMinRow) m.active = false;
    });
    setShowReviveModal(false);
    entitiesRef.current.isPaused = false;
    webAudio.vibrate(80);
  };

  const s = skillsRef.current;
  const currentBallDmg = Math.round((GameConfig.BASE_BALL_DAMAGE + ballDamageLevel * 25) * (1 + s.ballDmgBonus));
  const currentBallBonus = Math.round(s.ballDmgBonus * 100);
  const currentSkillDmg = Math.round(GameConfig.LASER_INITIAL_DAMAGE * (1 + s.skillDmgBonus));
  const currentSkillBonus = Math.round(s.skillDmgBonus * 100);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#090812] overflow-hidden select-none">
      {/* 直式 9:19.5 原生街機視窗容器：上下為獨立不重疊之 HUD 與道具列，中間為完整 1080x1820 戰場 */}
      <div className="relative h-full w-auto max-w-full aspect-[9/19.5] flex flex-col justify-between bg-[#1D1836] shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden border-x border-[#35354B]">
        {/* 1. 頂部灰紫金屬 HUD (獨立於戰場上方，絕不遮擋第 1 排怪物) */}
        <div className="relative z-20 bg-[#313142] border-b-[3px] border-[#1A1A26] px-2.5 pt-1.5 pb-1 shadow-md shrink-0">
          <div className="flex items-center justify-between gap-1.5">
            {/* 左側：浮雕戰機金幣 + 深色內凹數字框 */}
            <div className="relative flex items-center pl-3.5">
              {/* 金幣浮雕徽章 */}
              <div className="absolute left-0 z-10 w-8 h-8 rounded-full bg-gradient-to-b from-[#FFE047] via-[#F59E0B] to-[#B45309] border-2 border-[#18120B] shadow-md flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border border-[#FEF08A]/70 bg-[#D97706] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#FEF08A] stroke-[#78350F] stroke-[1.5]">
                    <path d="M12 2L8 12L3 15L3 17L8 16L10 21L14 21L16 16L21 17L21 15L16 12Z" />
                  </svg>
                </div>
              </div>
              {/* 深色內凹長方槽 */}
              <div className="bg-[#1C1D26] border-t-2 border-l-2 border-[#111218] border-b border-r border-[#45475A] pl-6 pr-3 py-0.5 min-w-[84px] text-center shadow-inner">
                <span className="font-black text-white text-base tracking-wide font-sans">
                  {coins.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 中央：深色「得分」小字 + 厚黑描邊巨大白字分數 */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-[11px] font-black text-[#12131A] tracking-widest leading-none mb-0.5">
                得分
              </span>
              <span
                className="text-[24px] font-black text-white leading-none tracking-tight"
                style={{
                  WebkitTextStroke: '4.5px #09090E',
                  paintOrder: 'stroke fill',
                }}
              >
                {currentScore.toLocaleString()}
              </span>
            </div>

            {/* 右側：黃金皇冠「最佳」內凹框 + 立體圓形金屬暫停鈕 */}
            <div className="flex items-center gap-1.5">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 -mb-1 z-10">
                  <svg viewBox="0 0 28 22" className="w-4 h-3.5 drop-shadow">
                    <path
                      d="M3 18L1 6L8 11L14 3L20 11L27 6L25 18Z"
                      fill="#FACC15"
                      stroke="#18120B"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className="text-[11px] font-black text-[#FACC15] tracking-wider"
                    style={{
                      WebkitTextStroke: '2.5px #18120B',
                      paintOrder: 'stroke fill',
                    }}
                  >
                    最佳
                  </span>
                </div>
                <div className="bg-[#1C1D26] border-t-2 border-l-2 border-[#111218] border-b border-r border-[#45475A] px-2.5 py-0.5 min-w-[82px] text-center shadow-inner">
                  <span className="font-black text-white text-sm tracking-wide">
                    {Math.max(bestScore, currentScore).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 圓形銀藍金屬暫停鈕 (||) */}
              <button
                onClick={onOpenPause}
                aria-label="暫停"
                className="w-9 h-9 rounded-full bg-gradient-to-b from-[#9BA4C2] to-[#5E6787] border-2 border-[#171822] shadow-[0_2px_0_#171822] active:translate-y-0.5 flex items-center justify-center cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#7B85A6] to-[#949EC0] border border-[#B8C2E0] flex items-center justify-center gap-0.5">
                  <div className="w-1 h-3.5 bg-white border border-[#1E2233] rounded-[1px]" />
                  <div className="w-1 h-3.5 bg-white border border-[#1E2233] rounded-[1px]" />
                </div>
              </button>
            </div>
          </div>

          {/* 規格要求之 HUD 傷害資訊緊湊次行：球傷害 (+%) 與 技能傷害 (+%) */}
          <div className="flex items-center justify-between text-[11px] font-extrabold px-1 pt-1 mt-1 border-t border-[#232433] text-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-[#FFE838] drop-shadow">
                球 {currentBallDmg} (+{currentBallBonus}%)
              </span>
              <span className="text-[#7DD3FC] drop-shadow">
                技能 {currentSkillDmg} (+{currentSkillBonus}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {showFps && (
                <span className="text-[10px] font-mono text-emerald-300 bg-[#1C1D26] px-1.5 py-0.5 rounded border border-[#3E4057]">
                  {fpsDisplay} FPS
                </span>
              )}
              <button
                onClick={() => setShowTitleMenu(true)}
                className="px-2 py-0.5 text-[10px] font-black bg-[#1C1D26] hover:bg-[#282A38] text-amber-300 border border-[#494C66] rounded cursor-pointer"
              >
                主選單
              </button>
              <button
                onClick={onOpenAndroidExplorer}
                className="px-2 py-0.5 text-[10px] font-black bg-[#1E3A8A] hover:bg-[#2563EB] text-white border border-[#60A5FA] rounded cursor-pointer"
              >
                APK 原始碼
              </button>
            </div>
          </div>
        </div>

        {/* 2. 中間主戰場 Canvas (專屬 1080x1820 戰場邏輯座標，不使用 object-cover 裁切，零遮擋) */}
        <div className="relative flex-1 w-full overflow-hidden">
          <canvas
            ref={canvasRef}
            width={GameConfig.LOGICAL_WIDTH}
            height={GameConfig.PLAYFIELD_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block cursor-crosshair touch-none"
          />
        </div>

        {/* 3. 底部灰紫金屬控制座與內凹道具匣 (獨立於戰場下方，絕不遮擋戰機與雷射槽) */}
        <div className="relative z-20 bg-[#313142] border-t-[3px] border-[#1A1A26] px-3.5 py-2 flex items-center justify-between shrink-0">
          {/* 左側：雙層立體圓形倍速按鈕 (>> x1 / x2 / x5) */}
          <button
            onClick={() => {
              const nextSpeed = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 5 : 1;
              handleSelectSpeed(nextSpeed);
            }}
            className="relative w-14 h-14 rounded-full bg-gradient-to-b from-[#8F9BB3] to-[#4E576B] border-[3px] border-[#171922] shadow-[0_3px_0_#171922] active:translate-y-0.5 flex items-center justify-center cursor-pointer"
          >
            <div className="w-11 h-11 -mt-0.5 rounded-full bg-gradient-to-b from-[#9AA6BE] to-[#68738A] border-2 border-[#333A4A] flex items-center justify-center shadow-inner">
              <span className="text-xs font-black text-white tracking-tighter drop-shadow">
                ▶▶ x{speedMultiplier}
              </span>
            </div>
          </button>

          {/* 中右：深色內凹金屬槽 + 3 張立體銀邊方形道具卡 */}
          <div className="bg-[#1B1C26] border-2 border-[#4B4E63] shadow-inner px-2.5 py-1 flex items-center gap-2.5">
            {/* 道具 1: 寒冰晶花 (x3) */}
            <button
              onClick={handleUseFreeze}
              disabled={freezeUses <= 0 || freezeTimer > 0}
              className={`relative w-[58px] h-[60px] bg-gradient-to-b from-[#8A95A8] to-[#596273] border-[2.5px] border-[#14161F] shadow-[inset_0_2px_0_#C8D2E3] flex flex-col items-center justify-between pt-1 pb-0.5 active:scale-95 cursor-pointer ${
                freezeUses <= 0 ? 'opacity-50' : ''
              }`}
            >
              <svg viewBox="0 0 64 64" className="w-8 h-8 drop-shadow">
                <g stroke="#101828" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M32 6V58M6 32H58M13 13L51 51M51 13L13 51" stroke="#67E8F9" strokeWidth="6" />
                  <path d="M32 6V58M6 32H58M13 13L51 51M51 13L13 51" stroke="#101828" strokeWidth="2" />
                  <circle cx="32" cy="32" r="7" fill="#CFFAFE" stroke="#101828" strokeWidth="3" />
                </g>
              </svg>
              <span
                className="text-xs font-black text-white leading-none"
                style={{ WebkitTextStroke: '3px #090A0F', paintOrder: 'stroke fill' }}
              >
                {freezeTimer > 0 ? `${freezeTimer.toFixed(0)}s` : `x${freezeUses}`}
              </span>
            </button>

            {/* 道具 2: 紅色捆綁炸藥桶 (x3) */}
            <button
              onClick={handleUseBomb}
              disabled={bombUses <= 0}
              className={`relative w-[58px] h-[60px] bg-gradient-to-b from-[#8A95A8] to-[#596273] border-[2.5px] border-[#14161F] shadow-[inset_0_2px_0_#C8D2E3] flex flex-col items-center justify-between pt-1 pb-0.5 active:scale-95 cursor-pointer ${
                bombUses <= 0 ? 'opacity-50' : ''
              }`}
            >
              <svg viewBox="0 0 64 64" className="w-8 h-8 drop-shadow">
                <g stroke="#141115" strokeWidth="3.5" strokeLinejoin="round">
                  {/* 引線與火花 */}
                  <path d="M32 18 Q36 8 44 10" fill="none" stroke="#D97706" strokeWidth="3.5" />
                  <circle cx="45" cy="10" r="5" fill="#FEF08A" stroke="#EA580C" strokeWidth="2" />
                  {/* 三管紅色炸藥 */}
                  <rect x="14" y="20" width="12" height="30" rx="3" fill="#EF4444" />
                  <rect x="26" y="18" width="12" height="32" rx="3" fill="#DC2626" />
                  <rect x="38" y="20" width="12" height="30" rx="3" fill="#EF4444" />
                  {/* 黑色捆綁帶 */}
                  <rect x="12" y="27" width="40" height="5" fill="#1F2937" />
                  <rect x="12" y="39" width="40" height="5" fill="#1F2937" />
                </g>
              </svg>
              <span
                className="text-xs font-black text-white leading-none"
                style={{ WebkitTextStroke: '3px #090A0F', paintOrder: 'stroke fill' }}
              >
                x{bombUses}
              </span>
            </button>

            {/* 道具 3: x2 DAMAGE 爆裂徽章 (x3) */}
            <button
              onClick={handleUseDoubleDmg}
              disabled={doubleDmgUses <= 0 || doubleDmgTimer > 0}
              className={`relative w-[58px] h-[60px] bg-gradient-to-b from-[#8A95A8] to-[#596273] border-[2.5px] border-[#14161F] shadow-[inset_0_2px_0_#C8D2E3] flex flex-col items-center justify-between pt-1 pb-0.5 active:scale-95 cursor-pointer ${
                doubleDmgUses <= 0 ? 'opacity-50' : ''
              }`}
            >
              <svg viewBox="0 0 72 60" className="w-9 h-8 drop-shadow">
                <polygon
                  points="36,2 45,14 62,8 54,24 68,34 52,42 56,56 38,48 22,56 24,42 6,34 20,24 12,8 28,14"
                  fill="#F97316"
                  stroke="#18110B"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <text
                  x="36"
                  y="33"
                  textAnchor="middle"
                  fill="#FEF08A"
                  stroke="#18110B"
                  strokeWidth="4"
                  paintOrder="stroke"
                  fontWeight="900"
                  fontSize="20"
                >
                  x2
                </text>
                <text
                  x="36"
                  y="47"
                  textAnchor="middle"
                  fill="#FDE047"
                  stroke="#18110B"
                  strokeWidth="3"
                  paintOrder="stroke"
                  fontWeight="900"
                  fontSize="10"
                >
                  DAMAGE
                </text>
              </svg>
              <span
                className="text-xs font-black text-white leading-none"
                style={{ WebkitTextStroke: '3px #090A0F', paintOrder: 'stroke fill' }}
              >
                {doubleDmgTimer > 0 ? `${doubleDmgTimer.toFixed(0)}s` : `x${doubleDmgUses}`}
              </span>
            </button>
          </div>

          <div className="w-4" />
        </div>

        {/* 4. 2D 街機卡通主選單 (啟動時顯示，也可直接一鍵開戰) */}
        {showTitleMenu && (
          <div className="absolute inset-0 z-40 bg-[#16122B]/90 backdrop-blur-[2px] flex flex-col items-center justify-between p-5 text-center">
            {/* 頂部金幣與最佳成績列 */}
            <div className="w-full flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2 bg-[#1C1D26] border-2 border-[#111218] px-3 py-1 rounded-lg">
                <span className="text-amber-400 font-black text-sm">🪙 {coins.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#1C1D26] border-2 border-[#111218] px-3 py-1 rounded-lg">
                <span className="text-yellow-300 font-black text-sm">👑 最佳 {Math.max(bestScore, currentScore).toLocaleString()}</span>
              </div>
            </div>

            {/* 中央街機大標題與 2D 卡通角色群像 */}
            <div className="flex flex-col items-center my-auto">
              <div className="inline-block px-3 py-1 rounded-full bg-[#313142] border-2 border-[#14141D] text-[#FFE838] text-xs font-black tracking-widest mb-2 shadow">
                ANDROID KOTLIN SURFACEVIEW 街機防衛
              </div>
              <h1
                className="text-4xl font-black text-white tracking-wider leading-tight"
                style={{
                  WebkitTextStroke: '7px #120E24',
                  paintOrder: 'stroke fill',
                  textShadow: '0 5px 0 #120E24',
                }}
              >
                太空彈球防衛戰
              </h1>
              <p
                className="text-base font-black text-[#FFE838] tracking-widest mt-1"
                style={{
                  WebkitTextStroke: '4px #120E24',
                  paintOrder: 'stroke fill',
                }}
              >
                BRICK OUT : SPACE DEFENSE
              </p>

              {/* 2D 卡通精靈展示台 */}
              <div className="relative my-6 px-6 py-5 rounded-2xl bg-[#251E42]/90 border-[3px] border-[#120E24] shadow-[0_6px_0_#120E24] flex items-center justify-center gap-4">
                <img src={GARGOYLE_SPRITE_URL} alt="石像鬼" className="w-16 h-16 drop-shadow-md animate-bounce" />
                <img src={CHEST_SPRITE_URL} alt="紫金寶箱" className="w-16 h-16 drop-shadow-md" />
                <img src={FIGHTER_SPRITE_URL} alt="雙聯裝火箭戰機" className="w-20 h-20 drop-shadow-lg -mt-2" />
                <img src={OCTOPUS_SPRITE_URL} alt="粉紅章魚" className="w-16 h-16 drop-shadow-md animate-bounce" />
              </div>

              {/* 立體街機大按鈕群 */}
              <div className="w-full max-w-[320px] flex flex-col gap-3">
                <button
                  onClick={() => setShowTitleMenu(false)}
                  className="w-full py-3.5 bg-gradient-to-b from-[#FFE047] via-[#FACC15] to-[#EAB308] hover:brightness-105 active:translate-y-0.5 border-[3px] border-[#18120B] rounded-xl shadow-[0_5px_0_#18120B] text-xl font-black text-white tracking-wider cursor-pointer"
                  style={{ WebkitTextStroke: '4px #18120B', paintOrder: 'stroke fill' }}
                >
                  ▶ 立即開始戰鬥
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onOpenUpgrades}
                    className="py-2.5 bg-gradient-to-b from-[#60A5FA] to-[#2563EB] hover:brightness-105 active:translate-y-0.5 border-[3px] border-[#111827] rounded-xl shadow-[0_4px_0_#111827] text-sm font-black text-white cursor-pointer"
                    style={{ WebkitTextStroke: '3px #111827', paintOrder: 'stroke fill' }}
                  >
                    ⭐ 永久戰力強化
                  </button>
                  <button
                    onClick={onOpenSettings}
                    className="py-2.5 bg-gradient-to-b from-[#94A3B8] to-[#475569] hover:brightness-105 active:translate-y-0.5 border-[3px] border-[#111827] rounded-xl shadow-[0_4px_0_#111827] text-sm font-black text-white cursor-pointer"
                    style={{ WebkitTextStroke: '3px #111827', paintOrder: 'stroke fill' }}
                  >
                    ⚙️ 系統與幀率
                  </button>
                </div>

                <button
                  onClick={onOpenAndroidExplorer}
                  className="w-full py-2.5 bg-[#313142] hover:bg-[#3E3E54] active:translate-y-0.5 border-[3px] border-[#14141F] rounded-xl shadow-[0_4px_0_#14141F] text-xs font-black text-[#7DD3FC] tracking-wide cursor-pointer"
                >
                  📦 檢視 Android 原生工程 & GitHub Actions 修復
                </button>
              </div>
            </div>

            <div className="text-[11px] font-bold text-slate-400">
              復活券持有：{reviveTickets} 張 · 支援 30~185Hz 物理與渲染分離
            </div>
          </div>
        )}

        {/* 寶箱技能三選一抽卡彈窗 (街機金屬邊框風格) */}
        {lotteryCards && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
            <div className="bg-[#313142] border-[3px] border-[#14141F] rounded-2xl p-4 w-full shadow-[0_8px_0_#14141F] text-center">
              <h3
                className="text-xl font-black text-[#FFE838] mb-1"
                style={{ WebkitTextStroke: '4px #14141F', paintOrder: 'stroke fill' }}
              >
                ✨ 擊破皇家紫金寶箱！
              </h3>
              <p className="text-xs font-bold text-slate-200 mb-3">選擇一項戰術武裝強化你的雙聯裝火箭</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {lotteryCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1C1D26] border-2 border-[#4B4E63] p-2.5 rounded-xl flex flex-col text-left justify-between"
                  >
                    <div>
                      <span className="text-[#FFE838] text-sm font-black">{'★'.repeat(card.star)}</span>
                      <div className="text-white font-black text-xs mt-1">{card.title}</div>
                      <p className="text-slate-300 text-[10px] mt-1 leading-snug">{card.description}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#2E3040]">
                      <div className="text-[10px] text-slate-400">{card.currentValueStr}</div>
                      <div className="text-[10px] text-emerald-400 font-bold">{card.nextValueStr}</div>
                      <button
                        onClick={() => {
                          applySkillCard(card);
                          setLotteryCards(null);
                          entitiesRef.current.isPaused = false;
                        }}
                        className="mt-2 w-full py-1.5 text-xs font-black bg-gradient-to-b from-[#FFE047] to-[#EAB308] text-[#18120B] border-2 border-[#18120B] rounded-lg cursor-pointer"
                      >
                        選取
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={coins < GameConfig.LOTTERY_ALL_COST}
                  onClick={() => {
                    if (coins >= GameConfig.LOTTERY_ALL_COST) {
                      onCoinsChange(coins - GameConfig.LOTTERY_ALL_COST);
                      lotteryCards.forEach(applySkillCard);
                      setLotteryCards(null);
                      entitiesRef.current.isPaused = false;
                    }
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black border-2 border-[#14141F] ${
                    coins >= GameConfig.LOTTERY_ALL_COST
                      ? 'bg-[#22C55E] text-white cursor-pointer'
                      : 'bg-[#1C1D26] text-slate-500 cursor-not-allowed'
                  }`}
                >
                  全選領取 (200 金幣)
                </button>
                <button
                  disabled={coins < GameConfig.LOTTERY_REROLL_COST}
                  onClick={() => {
                    if (coins >= GameConfig.LOTTERY_REROLL_COST) {
                      onCoinsChange(coins - GameConfig.LOTTERY_REROLL_COST);
                      setLotteryCards(rollThreeCards());
                    }
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black border-2 border-[#14141F] ${
                    coins >= GameConfig.LOTTERY_REROLL_COST
                      ? 'bg-[#3B82F6] text-white cursor-pointer'
                      : 'bg-[#1C1D26] text-slate-500 cursor-not-allowed'
                  }`}
                >
                  重抽 (50 金幣)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 復活彈窗 */}
        {showReviveModal && (
          <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-[#313142] border-[3px] border-[#14141F] rounded-2xl p-5 w-full text-center shadow-[0_8px_0_#14141F]">
              <h3 className="text-xl font-black text-rose-400 mb-2">⚠️ 防線告急！是否復活？</h3>
              <p className="text-xs text-slate-200 leading-relaxed mb-4">
                怪物已抵達右下角終點！復活將立即消除最靠近終點的 2 排怪物並賦予 3 秒無敵。<br />
                剩餘復活次數: {GameConfig.REVIVE_MAX_TIMES - revivesUsedCount} 次
              </p>

              <div className="flex flex-col gap-2.5 mb-4">
                {reviveTickets > 0 && (
                  <button
                    onClick={() => handleRevive(true)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs border-2 border-[#14141F] cursor-pointer"
                  >
                    使用復活券復活 (剩餘 {reviveTickets} 張)
                  </button>
                )}
                <button
                  disabled={coins < GameConfig.REVIVE_COST_COINS}
                  onClick={() => handleRevive(false)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black border-2 border-[#14141F] ${
                    coins >= GameConfig.REVIVE_COST_COINS
                      ? 'bg-amber-400 text-slate-950 cursor-pointer'
                      : 'bg-[#1C1D26] text-slate-500 cursor-not-allowed'
                  }`}
                >
                  花費 300 金幣復活 (持有 {coins})
                </button>
              </div>

              <button
                onClick={() => {
                  setShowReviveModal(false);
                  triggerGameOver();
                }}
                className="text-xs font-bold text-slate-300 underline cursor-pointer"
              >
                放棄防守，進入戰役結算
              </button>
            </div>
          </div>
        )}

        {/* 結算彈窗 */}
        {showGameOverModal && (
          <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#313142] border-[3px] border-[#14141F] rounded-2xl p-5 w-full text-center shadow-[0_8px_0_#14141F]">
              <h3
                className="text-2xl font-black text-[#FFE838] mb-1"
                style={{ WebkitTextStroke: '4px #14141F', paintOrder: 'stroke fill' }}
              >
                🏆 戰役結算
              </h3>
              <p className="text-xs text-slate-300 mb-4">星際防線任務完成</p>

              <div className="bg-[#1C1D26] border-2 border-[#4B4E63] rounded-xl p-4 mb-5 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">本局得分:</span>
                  <span className="text-white font-black">{currentScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">歷史最佳:</span>
                  <span className="text-amber-400 font-black">{Math.max(bestScore, currentScore).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">推進波數:</span>
                  <span className="text-sky-400 font-black">{survivedRowsCount} 波</span>
                </div>
                <div className="flex justify-between border-t border-[#2E3040] pt-2">
                  <span className="text-slate-200 font-bold">獲得金幣獎勵:</span>
                  <span className="text-[#FFE838] font-black">+{earnedCoinsFinal} 金幣</span>
                </div>
              </div>

              <button
                onClick={resetGame}
                className="w-full py-3 bg-gradient-to-b from-[#FFE047] to-[#EAB308] text-[#18120B] font-black rounded-xl text-sm border-[3px] border-[#18120B] shadow-[0_4px_0_#18120B] cursor-pointer"
              >
                再來一局
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
