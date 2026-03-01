
export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export type EnemyType = 'BASIC' | 'FAST' | 'HEAVY';

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  scoreValue: number;
  color: string;
  lastShot?: number;
}

export interface Bullet extends Entity {
  damage: number;
  owner: 'PLAYER' | 'ENEMY';
  angle?: number;
}

export interface PowerUp extends Entity {
  type: 'TRIPLE_SHOT' | 'SHIELD';
  duration: number;
}

export interface Particle extends Point {
  id: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface GameStats {
  score: number;
  level: number;
  hp: number;
  maxHp: number;
  enemiesKilled: number;
  distanceTraveled: number;
  powerUpsCollected: number;
  shieldActive: boolean;
  tripleShotActive: boolean;
  tripleShotTimer: number;
}
