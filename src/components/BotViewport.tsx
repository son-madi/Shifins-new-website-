import React, { useState } from 'react';
import { BotState } from '../types';
import { useTheme } from '../context/ThemeContext';
import { MonitorPlay, Keyboard as KeyboardIcon, Crosshair, Box, Layers, Play } from 'lucide-react';
import { ChatConsole } from './ChatConsole';
import { HeartsAndHunger } from './HeartsAndHunger';
import { PlayersWidget } from './PlayersWidget';

interface BotViewportProps {
  bot: BotState;
  onSendChat: (msg: string) => Promise<boolean>;
  onClearChat: () => Promise<void>;
}

export const BotViewport: React.FC<BotViewportProps> = ({ bot, onSendChat, onClearChat }) => {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'viewport' | 'inventory'>('viewport');
  const [keyboardCapture, setKeyboardCapture] = useState(false);

  const isOnline = bot.status === 'online';

  return (
    <div className="flex flex-col h-full relative">
      {/* Viewport Top Bar */}
      <div className={`flex flex-wrap items-center gap-2 p-2 shrink-0 border-b ${
        isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200'
      }`}>
        <div className={`flex items-center rounded-lg p-1 ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
          <button 
            onClick={() => setActiveTab('viewport')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'viewport' 
                ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') 
                : (isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700')
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5" /> <span className="hidden sm:inline">3D Viewport</span>
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'inventory' 
                ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') 
                : (isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700')
            }`}
          >
            <Box className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Inventory</span>
          </button>
        </div>

        <div className="flex-1"></div>

        {activeTab === 'viewport' && isOnline && (
          <button
            onClick={() => setKeyboardCapture(!keyboardCapture)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${
              keyboardCapture
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <KeyboardIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{keyboardCapture ? 'Capture: ON (ESC to exit)' : 'Keyboard Capture Mode'}</span>
            <span className="sm:hidden">{keyboardCapture ? 'ON' : 'Capture'}</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex">
        
        {/* Left Side: 3D View or Inventory */}
        <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden">
          {activeTab === 'viewport' ? (
            isOnline ? (
              <iframe 
                src={`/viewer/${bot.id}/`} 
                title="Minecraft 3D Viewport"
                className={`w-full h-full border-0 ${keyboardCapture ? 'pointer-events-auto' : 'pointer-events-none'}`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <MonitorPlay className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-sm font-medium">Viewport Offline</p>
                <p className="text-xs text-zinc-600">Start the bot to view the 3D world stream.</p>
              </div>
            )
          ) : (
            <div className={`w-full h-full p-6 flex flex-col items-center justify-center ${isDark ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
               <div className={`p-8 rounded-3xl border border-dashed flex flex-col items-center gap-4 ${
                 isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-300 bg-white'
               }`}>
                  <Layers className={`w-8 h-8 ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Inventory Synchronization</p>
                    <p className={`text-xs mt-1 max-w-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      Turn on the "Sync Inventory" plugin in the sidebar to view real-time hotbar and backpack contents here.
                    </p>
                  </div>
               </div>
            </div>
          )}

          {/* Telemetry HUD Overlay (when viewport is active and online) */}
          {activeTab === 'viewport' && isOnline && (
            <div className="absolute top-4 left-4 z-10 w-48 sm:w-64 transform scale-90 sm:scale-100 origin-top-left">
              <HeartsAndHunger 
                health={bot.health} 
                maxHealth={bot.maxHealth} 
                food={bot.food} 
                saturation={bot.saturation} 
              />
            </div>
          )}
          
          {/* Coordinates Overlay */}
          {activeTab === 'viewport' && isOnline && (
            <div className="absolute top-4 right-4 z-10 transform scale-90 sm:scale-100 origin-top-right">
              <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-[10px] flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1 text-red-400"><span className="opacity-60">X:</span> {bot.position?.x?.toFixed(1) || 0}</div>
                <div className="flex items-center gap-1 text-green-400"><span className="opacity-60">Y:</span> {bot.position?.y?.toFixed(1) || 0}</div>
                <div className="flex items-center gap-1 text-blue-400"><span className="opacity-60">Z:</span> {bot.position?.z?.toFixed(1) || 0}</div>
              </div>
            </div>
          )}
          
          {/* Keyboard capture overlay hint */}
          {activeTab === 'viewport' && isOnline && !keyboardCapture && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
               <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-[10px] font-bold flex items-center gap-2">
                 <Crosshair className="w-3.5 h-3.5" /> Click 'Keyboard Capture Mode' to interact with the 3D view
               </div>
            </div>
          )}
        </div>

        {/* Right Side: Chat & Players Widget */}
        <div className={`w-80 shrink-0 border-l flex flex-col hidden lg:flex ${
          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="p-3 shrink-0">
             <PlayersWidget 
                players={bot.playersNearby} 
                botUsername={bot.config.username}
             />
          </div>
          <div className="flex-1 relative min-h-0 border-t border-zinc-200 dark:border-zinc-800">
             <ChatConsole 
                chatHistory={bot.chatHistory}
                onSendChat={onSendChat}
                onClearChat={onClearChat}
                botUsername={bot.config.username}
                isOnline={isOnline}
                botStatus={bot.status}
                embedded={true}
             />
          </div>
        </div>
      </div>
    </div>
  );
};
