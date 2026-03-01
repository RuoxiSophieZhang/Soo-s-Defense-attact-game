import React from 'react';
import { Heart, Shield, Zap, Trophy } from 'lucide-react';
import { GameStats } from '../types/game';

interface HUDProps {
  stats: GameStats;
}

const HUD: React.FC<HUDProps> = ({ stats }) => {
  return (
    <div className="fixed top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
      {/* Left: Health & Level */}
      <div className="flex flex-col gap-2">
        <div className="glass-panel px-4 py-2 flex items-center gap-4">
          <div className="flex gap-1">
            {[...Array(stats.maxHp)].map((_, i) => (
              <Heart
                key={`heart-${i}`}
                size={20}
                className={`transition-colors duration-300 ${
                  i < stats.hp ? 'fill-red-500 text-red-500' : 'text-white/20'
                }`}
              />
            ))}
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-sm font-bold tracking-widest uppercase">
            Level <span className="text-purple-300">{stats.level}</span>
          </div>
        </div>
        
        {/* Active Power-ups */}
        <div className="flex gap-2">
          {stats.shieldActive && (
            <div className="glass-panel px-3 py-1 flex items-center gap-2 animate-pulse">
              <Shield size={14} className="text-purple-300" />
              <span className="text-[10px] font-bold uppercase">Shield Active</span>
            </div>
          )}
          {stats.tripleShotActive && (
            <div className="glass-panel px-3 py-1 flex items-center gap-2">
              <Zap size={14} className="text-yellow-400" />
              <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 transition-all duration-100"
                  style={{ width: `${(stats.tripleShotTimer / 8000) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Score */}
      <div className="flex flex-col items-end gap-2">
        <div className="glass-panel px-6 py-2 flex flex-col items-end">
          <div className="text-[10px] uppercase tracking-widest text-white/50">Score</div>
          <div className="text-2xl font-mono font-bold text-pink-300">
            {stats.score.toLocaleString().padStart(6, '0')}
          </div>
        </div>
        
        <div className="glass-panel px-4 py-1 flex items-center gap-2">
          <Trophy size={14} className="text-yellow-500" />
          <span className="text-xs font-mono">{stats.enemiesKilled} Kills</span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
