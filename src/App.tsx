import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Shield, 
  Zap, 
  Info, 
  Gamepad2, 
  Skull,
  ChevronRight,
  X
} from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import { GameState, GameStats, Achievement } from './types/game';
import { soundService } from './services/soundService';
import { Volume2, VolumeX } from 'lucide-react';

const INITIAL_STATS: GameStats = {
  score: 0,
  level: 1,
  hp: 3,
  maxHp: 3,
  enemiesKilled: 0,
  distanceTraveled: 0,
  powerUpsCollected: 0,
  shieldActive: false,
  tripleShotActive: false,
  tripleShotTimer: 0
};

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', title: '第一滴血', description: '击毁第一架敌机', unlocked: false, icon: 'Skull' },
  { id: 'survivor', title: '生存者', description: '达到第5关', unlocked: false, icon: 'Shield' },
  { id: 'power_hungry', title: '能量狂人', description: '收集10个道具', unlocked: false, icon: 'Zap' },
  { id: 'ace_pilot', title: '王牌飞行员', description: '得分超过10000', unlocked: false, icon: 'Trophy' },
  { id: 'unstoppable', title: '势不可挡', description: '击毁100架敌机', unlocked: false, icon: 'Play' }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBriefing, setShowBriefing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const checkAchievements = useCallback(() => {
    setAchievements(prev => prev.map(ach => {
      if (ach.unlocked) return ach;
      
      let shouldUnlock = false;
      if (ach.id === 'first_blood' && stats.enemiesKilled >= 1) shouldUnlock = true;
      if (ach.id === 'survivor' && stats.level >= 5) shouldUnlock = true;
      if (ach.id === 'power_hungry' && stats.powerUpsCollected >= 10) shouldUnlock = true;
      if (ach.id === 'ace_pilot' && stats.score >= 10000) shouldUnlock = true;
      if (ach.id === 'unstoppable' && stats.enemiesKilled >= 100) shouldUnlock = true;

      if (shouldUnlock) {
        setUnlockedAchievement(ach);
        setTimeout(() => setUnlockedAchievement(null), 3000);
        return { ...ach, unlocked: true };
      }
      return ach;
    }));
  }, [stats]);

  useEffect(() => {
    checkAchievements();
  }, [stats.enemiesKilled, stats.level, stats.score, stats.powerUpsCollected, checkAchievements]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      soundService.playBGM();
    } else if (gameState === 'GAMEOVER') {
      soundService.playGameOver();
      soundService.stopBGM();
    } else if (gameState === 'START') {
      soundService.stopBGM();
    }
  }, [gameState]);

  useEffect(() => {
    soundService.setMute(isMuted);
  }, [isMuted]);

  const handleStart = () => {
    setStats(INITIAL_STATS);
    setGameState('PLAYING');
  };

  const handleLevelUp = (level: number) => {
    setStats(prev => ({ ...prev, level }));
    setShowLevelUp(true);
    setTimeout(() => setShowLevelUp(false), 2000);
  };

  const handleEnemyEscape = () => {
    setStats(prev => ({ ...prev, score: Math.max(0, prev.score - 50) }));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans bg-black">
      <div className="scanline" />
      
      <GameCanvas 
        gameState={gameState}
        setGameState={setGameState}
        stats={stats}
        setStats={setStats}
        onAchievementUnlock={(ach) => setUnlockedAchievement(ach)}
        onLevelUp={handleLevelUp}
        onEnemyEscape={handleEnemyEscape}
      />

      {gameState === 'PLAYING' && <HUD stats={stats} />}

      <AnimatePresence>
        {/* Start Screen */}
        {gameState === 'START' && (
          <motion.div 
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center"
            >
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-2 neon-text">
                SOO<span className="text-pink-300">星际先锋</span>
              </h1>
              <p className="text-white/60 tracking-[0.3em] uppercase text-sm mb-12">Interstellar Pioneer v1.0</p>
              
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={handleStart}
                  className="glass-button text-xl px-12 py-4 group hover:scale-105 transition-transform w-full md:w-auto"
                >
                  <Play className="group-hover:fill-white transition-colors" />
                  开始作战
                </button>
                <button 
                  onClick={() => setShowBriefing(true)}
                  className="glass-button text-xl px-12 py-4 group hover:scale-105 transition-transform w-full md:w-auto border-purple-400/30"
                >
                  <Info className="text-purple-300" />
                  任务简报
                </button>
              </div>
            </motion.div>

            {/* Mission Briefing Modal */}
            <AnimatePresence>
              {showBriefing && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                  <div className="glass-panel max-w-2xl w-full p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400" />
                    <button 
                      onClick={() => setShowBriefing(false)}
                      className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>

                    <h2 className="text-3xl font-black italic tracking-tighter mb-6 text-pink-300">任务简报：SOO星际先锋</h2>
                    
                    <div className="space-y-6 text-sm">
                      <section>
                        <h3 className="text-purple-300 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Gamepad2 size={16} /> 核心目标
                        </h3>
                        <p className="text-white/70 leading-relaxed">
                          作为 SOO 战队的先锋飞行员，你的任务是拦截并摧毁所有入侵的敌方单位。
                          <span className="text-pink-300 font-bold"> 击毁敌机获得积分</span>，但要小心：每有一架敌机逃脱，你的积分都会被扣除 50 分。
                        </p>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section>
                          <h3 className="text-purple-300 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Zap size={16} /> 战术道具
                          </h3>
                          <ul className="space-y-2 text-white/70">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-pink-300" />
                              <span className="font-bold text-pink-200">三向子弹：</span> 8秒内火力全开。
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-300" />
                              <span className="font-bold text-purple-200">能量护盾：</span> 抵御一次撞击伤害。
                            </li>
                          </ul>
                        </section>

                        <section>
                          <h3 className="text-purple-300 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Skull size={16} /> 敌机情报
                          </h3>
                          <ul className="space-y-2 text-white/70">
                            <li><span className="text-cyan-300">基础型：</span> 速度中等，一击即毁。</li>
                            <li><span className="text-yellow-300">快速型：</span> 极速俯冲，难以捕捉。</li>
                            <li><span className="text-pink-400">重型机：</span> 装甲厚重，需要多次射击。</li>
                          </ul>
                        </section>
                      </div>

                      <section className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-2 text-white/40">操作说明</h3>
                        <div className="flex flex-wrap gap-4 text-xs">
                          <div className="flex items-center gap-2"><span className="px-2 py-1 glass-panel">WASD / 方向键</span> 移动</div>
                          <div className="flex items-center gap-2"><span className="px-2 py-1 glass-panel">空格</span> 射击</div>
                          <div className="flex items-center gap-2"><span className="px-2 py-1 glass-panel">触摸滑动</span> 移动并射击</div>
                        </div>
                      </section>
                    </div>

                    <button 
                      onClick={() => {
                        setShowBriefing(false);
                        handleStart();
                      }}
                      className="glass-button w-full mt-8 py-4 bg-pink-500/20 hover:bg-pink-500/40 border-pink-500/50"
                    >
                      立即出击
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls Info */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl px-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 glass-panel flex items-center justify-center text-xs">WASD</div>
                <span className="text-[10px] uppercase text-white/40">移动战机</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 glass-panel flex items-center justify-center text-xs">SPACE</div>
                <span className="text-[10px] uppercase text-white/40">发射激光</span>
              </div>
              <div className="flex flex-col items-center gap-2 hidden md:flex">
                <div className="w-10 h-10 glass-panel flex items-center justify-center text-xs">P</div>
                <span className="text-[10px] uppercase text-white/40">暂停游戏</span>
              </div>
            </div>

            {/* Mute Toggle */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="mt-8 p-3 glass-panel hover:bg-white/10 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </motion.div>
        )}

        {/* Pause Screen */}
        {gameState === 'PAUSED' && (
          <motion.div 
            key="pause-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-md"
          >
            <div className="glass-panel p-12 flex flex-col items-center gap-6 min-w-[300px]">
              <h2 className="text-4xl font-bold tracking-widest italic mb-4">作战暂停</h2>
              <button onClick={() => setGameState('PLAYING')} className="glass-button w-full">
                <Play size={20} /> 继续战斗
              </button>
              <button onClick={() => setGameState('START')} className="glass-button w-full text-white/50 hover:text-white">
                <RotateCcw size={20} /> 退出任务
              </button>
            </div>
          </motion.div>
        )}

        {/* Game Over Screen */}
        {gameState === 'GAMEOVER' && (
          <motion.div 
            key="gameover-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-40 bg-black/80 backdrop-blur-xl"
          >
            <div className="glass-panel p-8 md:p-12 flex flex-col items-center max-w-md w-full mx-4">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                <Skull size={40} className="text-red-500" />
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter mb-2">任务失败</h2>
              <p className="text-white/40 text-sm mb-8 uppercase tracking-widest">Mission Terminated</p>
              
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="glass-panel p-4 text-center">
                  <div className="text-[10px] text-white/40 uppercase mb-1">最终得分</div>
                  <div className="text-2xl font-mono font-bold text-pink-300">{stats.score}</div>
                </div>
                <div className="glass-panel p-4 text-center">
                  <div className="text-[10px] text-white/40 uppercase mb-1">最高关卡</div>
                  <div className="text-2xl font-mono font-bold text-yellow-400">{stats.level}</div>
                </div>
              </div>

              <div className="w-full mb-8">
                <div className="text-[10px] text-white/40 uppercase mb-4 tracking-widest">获得成就</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {achievements.filter(a => a.unlocked).map(a => (
                    <div key={a.id} className="w-10 h-10 glass-panel flex items-center justify-center text-yellow-500" title={a.title}>
                      <Trophy size={18} />
                    </div>
                  ))}
                  {achievements.filter(a => a.unlocked).length === 0 && (
                    <span className="text-xs text-white/20 italic">暂无成就</span>
                  )}
                </div>
              </div>

              <button onClick={handleStart} className="glass-button w-full py-4 text-lg">
                <RotateCcw size={20} /> 重新出击
              </button>
            </div>
          </motion.div>
        )}

        {/* Achievement Popup */}
        {unlockedAchievement && (
          <motion.div 
            key={`achievement-${unlockedAchievement.id}`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed bottom-8 right-8 z-50 glass-panel p-4 flex items-center gap-4 border-yellow-500/50"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-500">
              <Trophy size={24} />
            </div>
            <div>
              <div className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest">成就解锁</div>
              <div className="text-sm font-bold">{unlockedAchievement.title}</div>
              <div className="text-[10px] text-white/40">{unlockedAchievement.description}</div>
            </div>
          </motion.div>
        )}

        {/* Level Up Notification */}
        {showLevelUp && (
          <motion.div 
            key="levelup-notification"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-center">
              <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter neon-text animate-pulse">
                LEVEL UP
              </h2>
              <p className="text-2xl text-pink-300 font-mono">进入第 {stats.level} 阶段</p>
            </div>
          </motion.div>
        )}

        {/* Sidebar / Info Panel */}
        {showSidebar && gameState === 'START' && (
          <motion.div 
            key="sidebar-panel"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed left-8 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-6 w-64"
          >
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4 text-purple-300">
                <Gamepad2 size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">操作指南</h3>
              </div>
              <ul className="space-y-3 text-xs text-white/60">
                <li className="flex justify-between"><span>移动</span> <span className="text-white">WASD / 方向键</span></li>
                <li className="flex justify-between"><span>射击</span> <span className="text-white">空格 / 触摸</span></li>
                <li className="flex justify-between"><span>暂停</span> <span className="text-white">P 键</span></li>
              </ul>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4 text-yellow-400">
                <Zap size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">战术道具</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 glass-panel flex items-center justify-center text-yellow-400 shrink-0"><Zap size={14} /></div>
                  <div>
                    <div className="text-[10px] font-bold uppercase">三向子弹</div>
                    <p className="text-[9px] text-white/40">大幅提升火力覆盖范围</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 glass-panel flex items-center justify-center text-purple-300 shrink-0"><Shield size={14} /></div>
                  <div>
                    <div className="text-[10px] font-bold uppercase">能量护盾</div>
                    <p className="text-[9px] text-white/40">抵御一次致命伤害</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Controls Hint */}
      {gameState === 'PLAYING' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 lg:hidden pointer-events-none opacity-20">
          <div className="text-[10px] uppercase tracking-[0.5em] text-white">滑动屏幕移动并射击</div>
        </div>
      )}
    </div>
  );
}
