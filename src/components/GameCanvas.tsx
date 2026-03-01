import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Enemy, Bullet, PowerUp, Particle, GameStats, EnemyType, Achievement } from '../types/game';
import { soundService } from '../services/soundService';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onAchievementUnlock: (achievement: Achievement) => void;
  onLevelUp: (level: number) => void;
  onEnemyEscape: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setGameState,
  stats,
  setStats,
  onAchievementUnlock,
  onLevelUp,
  onEnemyEscape
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Game Entities
  const playerRef = useRef({ x: 0, y: 0, width: 40, height: 40, speed: 5, invulnerable: 0 });
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<{ x: number, y: number, size: number, speed: number }[]>([]);
  
  // Input State
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const touchRef = useRef<{ x: number, y: number } | null>(null);

  // Assets
  const assetsRef = useRef<{ [key: string]: HTMLImageElement }>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // Preload Assets
  useEffect(() => {
    const assetPaths: { [key: string]: string } = {
      player: '/assets/player.png',
      enemy_basic: '/assets/enemy_basic.png',
      enemy_fast: '/assets/enemy_fast.png',
      enemy_heavy: '/assets/enemy_heavy.png',
      powerup_triple: '/assets/powerup_triple.png',
      powerup_shield: '/assets/powerup_shield.png',
    };

    let loadedCount = 0;
    const totalAssets = Object.keys(assetPaths).length;

    Object.entries(assetPaths).forEach(([key, path]) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        assetsRef.current[key] = img;
        loadedCount++;
        if (loadedCount === totalAssets) setAssetsLoaded(true);
      };
      img.onerror = () => {
        // Fallback handled in draw function
        loadedCount++;
        if (loadedCount === totalAssets) setAssetsLoaded(true);
      };
    });
  }, []);

  // Initialize Stars
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 0.5
      });
    }
    starsRef.current = stars;
  }, []);

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyP' && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
        setGameState(gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (gameState !== 'PLAYING') return;
      const touch = e.touches[0];
      touchRef.current = { x: touch.clientX, y: touch.clientY };
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (gameState !== 'PLAYING') return;
      const touch = e.touches[0];
      touchRef.current = { x: touch.clientX, y: touch.clientY };
    };
    const handleTouchEnd = () => {
      touchRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, setGameState]);

  // Reset Game
  useEffect(() => {
    if (gameState === 'START') {
      playerRef.current = {
        x: window.innerWidth / 2,
        y: window.innerHeight - 100,
        width: 40,
        height: 40,
        speed: 8, // Increased base speed
        invulnerable: 0
      };
      enemiesRef.current = [];
      bulletsRef.current = [];
      powerUpsRef.current = [];
      particlesRef.current = [];
    }
  }, [gameState]);

  const createExplosion = (x: number, y: number, color: string, count: number = 15) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random().toString(36).substr(2, 9),
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  const spawnEnemy = useCallback(() => {
    const width = window.innerWidth;
    const typeRoll = Math.random();
    let type: EnemyType = 'BASIC';
    let hp = 1;
    let speed = 2 + stats.level * 0.2;
    let color = '#00f2ff';
    let scoreValue = 100;

    if (typeRoll > 0.85) {
      type = 'HEAVY';
      hp = 3 + Math.floor(stats.level / 2);
      speed = 1 + stats.level * 0.1;
      color = '#ff85a2'; // Macaron Pink
      scoreValue = 300;
    } else if (typeRoll > 0.65) {
      type = 'FAST';
      hp = 1;
      speed = 4 + stats.level * 0.3;
      color = '#ffd1dc'; // Soft Pink
      scoreValue = 200;
    }

    enemiesRef.current.push({
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * (width - 40) + 20,
      y: -50,
      width: type === 'HEAVY' ? 50 : 35,
      height: type === 'HEAVY' ? 50 : 35,
      speed,
      type,
      hp,
      maxHp: hp,
      color,
      scoreValue
    });
  }, [stats.level]);

  const spawnPowerUp = (x: number, y: number) => {
    if (Math.random() > 0.15) return; // 15% chance
    const type = Math.random() > 0.5 ? 'TRIPLE_SHOT' : 'SHIELD';
    powerUpsRef.current.push({
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      width: 30,
      height: 30,
      speed: 2,
      type,
      duration: 5000
    });
  };

  const update = (deltaTime: number) => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Player Movement
    const p = playerRef.current;
    const moveStep = p.speed * (deltaTime / 16.67); // Normalize to 60fps

    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) p.x -= moveStep;
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) p.x += moveStep;
    if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) p.y -= moveStep;
    if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) p.y += moveStep;

    if (touchRef.current) {
      const dx = touchRef.current.x - p.x;
      const dy = touchRef.current.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        // Dynamic speed based on distance for snappier touch response
        const touchSpeed = Math.min(dist, moveStep * 2.5);
        p.x += (dx / dist) * touchSpeed;
        p.y += (dy / dist) * touchSpeed;
      }
    }

    // Boundary Check
    p.x = Math.max(p.width / 2, Math.min(canvas.width - p.width / 2, p.x));
    p.y = Math.max(p.height / 2, Math.min(canvas.height - p.height / 2, p.y));

    // Invulnerability
    if (p.invulnerable > 0) p.invulnerable -= deltaTime;

    // Shooting
    const now = Date.now();
    const lastShot = (bulletsRef.current.filter(b => b.owner === 'PLAYER').pop() as any)?.timestamp || 0;
    if ((keysRef.current['Space'] || touchRef.current) && now - lastShot > 200) {
      soundService.playShoot();
      const bulletSpeed = 10;
      if (stats.tripleShotActive) {
        bulletsRef.current.push({ id: Math.random().toString(), x: p.x, y: p.y - 20, width: 4, height: 15, speed: bulletSpeed, damage: 1, owner: 'PLAYER', angle: -0.2 } as any);
        bulletsRef.current.push({ id: Math.random().toString(), x: p.x, y: p.y - 20, width: 4, height: 15, speed: bulletSpeed, damage: 1, owner: 'PLAYER', angle: 0 } as any);
        bulletsRef.current.push({ id: Math.random().toString(), x: p.x, y: p.y - 20, width: 4, height: 15, speed: bulletSpeed, damage: 1, owner: 'PLAYER', angle: 0.2 } as any);
      } else {
        bulletsRef.current.push({ id: Math.random().toString(), x: p.x, y: p.y - 20, width: 4, height: 15, speed: bulletSpeed, damage: 1, owner: 'PLAYER', timestamp: now } as any);
      }
    }

    // Power-up Timers
    if (stats.tripleShotActive) {
      setStats(prev => {
        const newTimer = prev.tripleShotTimer - deltaTime;
        if (newTimer <= 0) return { ...prev, tripleShotActive: false, tripleShotTimer: 0 };
        return { ...prev, tripleShotTimer: newTimer };
      });
    }

    // Update Stars
    starsRef.current.forEach(star => {
      star.y += star.speed;
      if (star.y > canvas.height) star.y = 0;
    });

    // Update Bullets
    bulletsRef.current = bulletsRef.current.filter(b => {
      const angle = b.angle || 0;
      b.x += Math.sin(angle) * b.speed;
      b.y -= Math.cos(angle) * (b.owner === 'PLAYER' ? b.speed : -b.speed);
      return b.y > -50 && b.y < canvas.height + 50;
    });

    // Update Enemies
    if (Math.random() < 0.02 + stats.level * 0.005) spawnEnemy();
    
    enemiesRef.current = enemiesRef.current.filter(e => {
      e.y += e.speed;
      
      // Collision with Player
      const dist = Math.sqrt((e.x - p.x)**2 + (e.y - p.y)**2);
      if (dist < (e.width + p.width) / 2.5 && p.invulnerable <= 0) {
        if (stats.shieldActive) {
          setStats(prev => ({ ...prev, shieldActive: false }));
          p.invulnerable = 1000;
          soundService.playExplosion();
          createExplosion(e.x, e.y, e.color);
          return false;
        } else {
          setStats(prev => ({ ...prev, hp: prev.hp - 1 }));
          p.invulnerable = 2000;
          soundService.playExplosion();
          createExplosion(p.x, p.y, '#ffffff', 30);
          if (stats.hp <= 1) setGameState('GAMEOVER');
        }
      }

      // Escape Check
      if (e.y > canvas.height + 50) {
        onEnemyEscape();
        return false;
      }
      return true;
    });

    // Bullet-Enemy Collision
    bulletsRef.current = bulletsRef.current.filter(b => {
      if (b.owner === 'ENEMY') return true;
      let hit = false;
      enemiesRef.current = enemiesRef.current.filter(e => {
        const dist = Math.sqrt((b.x - e.x)**2 + (b.y - e.y)**2);
        if (dist < (e.width + b.width) / 1.5) {
          e.hp -= b.damage;
          hit = true;
          if (e.hp <= 0) {
            soundService.playExplosion();
            createExplosion(e.x, e.y, e.color);
            spawnPowerUp(e.x, e.y);
            setStats(prev => {
              const newScore = prev.score + e.scoreValue;
              const newKills = prev.enemiesKilled + 1;
              
              // Level Up logic
              if (newKills % 10 === 0) {
                onLevelUp(prev.level + 1);
              }

              return { ...prev, score: newScore, enemiesKilled: newKills };
            });
            return false;
          }
          return true;
        }
        return true;
      });
      return !hit;
    });

    // Update Power-ups
    powerUpsRef.current = powerUpsRef.current.filter(pu => {
      pu.y += pu.speed;
      const dist = Math.sqrt((pu.x - p.x)**2 + (pu.y - p.y)**2);
      if (dist < (pu.width + p.width) / 2) {
        soundService.playPowerUp();
        if (pu.type === 'TRIPLE_SHOT') {
          setStats(prev => ({ ...prev, tripleShotActive: true, tripleShotTimer: 8000, powerUpsCollected: prev.powerUpsCollected + 1 }));
        } else {
          setStats(prev => ({ ...prev, shieldActive: true, powerUpsCollected: prev.powerUpsCollected + 1 }));
        }
        return false;
      }
      return pu.y < canvas.height + 50;
    });

    // Update Particles
    particlesRef.current = particlesRef.current.filter(part => {
      part.x += part.vx;
      part.y += part.vy;
      part.life -= 0.02;
      return part.life > 0;
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Stars
    ctx.fillStyle = '#ffffff';
    starsRef.current.forEach(star => {
      ctx.globalAlpha = Math.random() * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Power-ups
    powerUpsRef.current.forEach(pu => {
      const assetKey = pu.type === 'TRIPLE_SHOT' ? 'powerup_triple' : 'powerup_shield';
      const img = assetsRef.current[assetKey];

      ctx.save();
      ctx.translate(pu.x, pu.y);
      ctx.rotate(Date.now() / 500);

      if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, -pu.width/2, -pu.height/2, pu.width, pu.height);
      } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = pu.type === 'TRIPLE_SHOT' ? '#ffb7ce' : '#e0b0ff';
        ctx.fillStyle = pu.type === 'TRIPLE_SHOT' ? '#ffb7ce' : '#e0b0ff';
        ctx.fillRect(-pu.width/2, -pu.height/2, pu.width, pu.height);
      }
      ctx.restore();
    });

    // Draw Bullets
    bulletsRef.current.forEach(b => {
      ctx.fillStyle = b.owner === 'PLAYER' ? '#e0b0ff' : '#ff85a2';
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.width, b.height, b.angle || 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Enemies
    enemiesRef.current.forEach(e => {
      const assetKey = `enemy_${e.type.toLowerCase()}`;
      const img = assetsRef.current[assetKey];

      ctx.save();
      ctx.translate(e.x, e.y);

      if (img && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, -e.width/2, -e.height/2, e.width, e.height);
      } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        
        // Enemy Shape based on type
        ctx.beginPath();
        if (e.type === 'HEAVY') {
          ctx.moveTo(0, 25);
          ctx.lineTo(-25, -25);
          ctx.lineTo(25, -25);
        } else if (e.type === 'FAST') {
          ctx.moveTo(0, 20);
          ctx.lineTo(-15, -15);
          ctx.lineTo(0, -5);
          ctx.lineTo(15, -15);
        } else {
          ctx.moveTo(0, 20);
          ctx.lineTo(-20, -10);
          ctx.lineTo(20, -10);
        }
        ctx.closePath();
        ctx.fill();
      }

      // HP Bar for Heavy
      if (e.type === 'HEAVY' && e.hp < e.maxHp) {
        ctx.fillStyle = '#333';
        ctx.fillRect(-20, -35, 40, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-20, -35, 40 * (e.hp / e.maxHp), 5);
      }
      ctx.restore();
    });

    // Draw Player
    const p = playerRef.current;
    if (p.invulnerable % 200 < 100) {
      ctx.save();
      ctx.translate(p.x, p.y);
      
      // Shield
      if (stats.shieldActive) {
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.strokeStyle = '#e0b0ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#e0b0ff';
        ctx.stroke();
      }

      // Ship Body
      const playerImg = assetsRef.current['player'];
      if (playerImg && playerImg.complete && playerImg.naturalWidth !== 0) {
        ctx.drawImage(playerImg, -p.width/2, -p.height/2, p.width, p.height);
      } else {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#e0b0ff';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(-20, 15);
        ctx.lineTo(0, 5);
        ctx.lineTo(20, 15);
        ctx.closePath();
        ctx.fill();

        // Engine Glow
        ctx.fillStyle = '#e0b0ff';
        ctx.beginPath();
        ctx.arc(0, 10, 5 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  };

  const loop = (time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    update(deltaTime);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx);
    }

    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, stats.level]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
};

export default GameCanvas;
