import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Swords, Pickaxe, Wheat, Package, 
  MessageCircle, Compass, Search, UserPlus, Map, 
  Keyboard, Briefcase, Moon, Utensils, Settings, ChevronDown, ChevronRight
} from 'lucide-react';
import { BotState, BotConfig, BotPluginsConfig, PvpSettings } from '../types';
import { useTheme } from '../context/ThemeContext';
import { NinimoIcon } from './NinimoIcon';

interface BotPluginSidebarProps {
  bot: BotState;
  onUpdateConfig: (updates: Partial<BotConfig>) => Promise<void>;
}

export const BotPluginSidebar: React.FC<BotPluginSidebarProps> = ({ bot, onUpdateConfig }) => {
  const { theme, isDark, isColourUI } = useTheme();
  const plugins = bot.config.plugins || {} as BotPluginsConfig;
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);

  const handleToggle = (key: keyof BotPluginsConfig, checked: boolean) => {
    onUpdateConfig({ plugins: { ...plugins, [key]: checked } });
  };

  const categories = [
    {
      id: 'combat',
      title: 'Combat & Survival',
      color: 'text-rose-400',
      plugins: [
        { id: 'pvpMode', title: 'PvP Mode', description: 'Attack hostile players/mobs.', icon: Swords, badge: 'PRO', iconColor: 'text-rose-400' },
        { id: 'guarding', title: 'Guarding', description: 'Counterattack enemies.', icon: Shield, badge: 'PRO', iconColor: 'text-red-400' },
        { id: 'autoEat', title: 'Auto Eat', description: 'Maintain hunger levels.', icon: Utensils, iconColor: 'text-orange-400' },
        { id: 'autoSleep', title: 'Auto Sleep', description: 'Wake up at dawn.', icon: Moon, badge: 'PRO', iconColor: 'text-indigo-400' },
      ]
    },
    {
      id: 'utility',
      title: 'Utility & Tools',
      color: 'text-amber-400',
      plugins: [
        { id: 'autoMining', title: 'Auto Mining', description: 'Mine specific blocks.', icon: Pickaxe, badge: 'PRO', iconColor: 'text-amber-400' },
        { id: 'farmer', title: 'Farmer', description: 'Harvest mature crops.', icon: Wheat, iconColor: 'text-emerald-400' },
        { id: 'collectDrops', title: 'Collect Drops', description: 'Pick up dropped items.', icon: Package, iconColor: 'text-teal-400' },
        { id: 'chatAi', title: 'AI Chat', description: 'Respond to mentions.', icon: MessageCircle, badge: 'PRO', iconColor: 'text-cyan-400' },
      ]
    },
    {
      id: 'movement',
      title: 'Movement & Navigation',
      color: 'text-cyan-400',
      plugins: [
        { id: 'pathfinding', title: 'Pathfinding', description: 'Dynamic obstacle avoidance.', icon: Map, badge: 'DEV', iconColor: 'text-blue-400' },
        { id: 'followPlayer', title: 'Follow Player', description: 'Follow target avoiding walls.', icon: UserPlus, badge: 'DEV', iconColor: 'text-sky-400' },
        { id: 'compassNavigation', title: 'Compass', description: 'Step navigate in 3D.', icon: Compass, iconColor: 'text-teal-300' },
        { id: 'locate', title: 'Locate', description: 'Find entities/blocks.', icon: Search, iconColor: 'text-violet-400' },
      ]
    },
    {
      id: 'control',
      title: 'Control & Inventory',
      color: 'text-purple-400',
      plugins: [
        { id: 'inventorySync', title: 'Sync Inventory', description: 'Real-time UI Hotbar.', icon: Briefcase, iconColor: 'text-purple-400' },
        { id: 'inventoryControl', title: 'Inventory Control', description: 'Manage drops/equip.', icon: Package, iconColor: 'text-fuchsia-400' },
        { id: 'keyboardCapture', title: 'Keyboard Capture', description: 'WASD browser control.', icon: Keyboard, iconColor: 'text-pink-400' },
      ]
    }
  ];

  const PluginSettings = ({ id }: { id: string }) => {
    // Placeholder settings forms based on the plugin
    switch (id) {
      case 'autoEat':
        return (
          <div className="space-y-3 p-3 pt-0">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                isColourUI ? 'text-amber-300' : 'text-zinc-500'
              }`}>Min Hunger (0-20)</label>
              <input type="range" min="0" max="20" defaultValue="14" className={`w-full ${isColourUI ? 'accent-amber-400' : isDark ? 'accent-zinc-300' : 'accent-zinc-900'}`} />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500" />
              <span className={isColourUI ? 'text-slate-200' : ''}>Prioritize Golden Food</span>
            </label>
          </div>
        );
      case 'followPlayer':
        return (
          <div className="space-y-3 p-3 pt-0">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                isColourUI ? 'text-sky-300' : 'text-zinc-500'
              }`}>Player Nickname</label>
              <input type="text" placeholder="e.g. Dream" className={`w-full text-xs px-2 py-1.5 rounded-lg border ${
                isColourUI ? 'bg-[#060a16] border-slate-800 text-white' : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'
              }`} />
            </div>
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                isColourUI ? 'text-sky-300' : 'text-zinc-500'
              }`}>Min Distance (blocks)</label>
              <input type="number" defaultValue="3" className={`w-full text-xs px-2 py-1.5 rounded-lg border ${
                isColourUI ? 'bg-[#060a16] border-slate-800 text-white' : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'
              }`} />
            </div>
          </div>
        );
      case 'pvpMode':
        const settings = plugins.pvpSettings || { detectionRange: 10, weapon: 'sword', targetPriority: 'closest', attackIntervalMs: 600 };
        const updateSettings = (updates: Partial<PvpSettings>) => {
          onUpdateConfig({ plugins: { ...plugins, pvpSettings: { ...settings, ...updates } } });
        };
        return (
          <div className="space-y-3 p-3 pt-0">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                isColourUI ? 'text-rose-300' : 'text-zinc-500'
              }`}>Detection Range (blocks)</label>
              <input type="number" value={settings.detectionRange} onChange={e => updateSettings({ detectionRange: parseInt(e.target.value) })} className={`w-full text-xs px-2 py-1.5 rounded-lg border ${
                isColourUI ? 'bg-[#060a16] border-slate-800 text-white' : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'
              }`} />
            </div>
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                isColourUI ? 'text-rose-300' : 'text-zinc-500'
              }`}>Weapon</label>
              <select value={settings.weapon} onChange={e => updateSettings({ weapon: e.target.value as any })} className={`w-full text-xs px-2 py-1.5 rounded-lg border ${
                isColourUI ? 'bg-[#060a16] border-slate-800 text-white' : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'
              }`}>
                <option value="sword">Sword</option>
                <option value="axe">Axe</option>
                <option value="bow">Bow</option>
              </select>
            </div>
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                isColourUI ? 'text-rose-300' : 'text-zinc-500'
              }`}>Target Priority</label>
              <select value={settings.targetPriority} onChange={e => updateSettings({ targetPriority: e.target.value as any })} className={`w-full text-xs px-2 py-1.5 rounded-lg border ${
                isColourUI ? 'bg-[#060a16] border-slate-800 text-white' : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'
              }`}>
                <option value="closest">Closest</option>
                <option value="lowestHealth">Lowest Health</option>
                <option value="highestHealth">Highest Health</option>
              </select>
            </div>
          </div>
        );
      case 'autoMining':
        return (
          <div className="space-y-3 p-3 pt-0">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                isColourUI ? 'text-amber-300' : 'text-zinc-500'
              }`}>Blocks to mine (comma-separated)</label>
              <input type="text" defaultValue="diamond_ore,iron_ore" className={`w-full text-xs px-2 py-1.5 rounded-lg border ${
                isColourUI ? 'bg-[#060a16] border-slate-800 text-white' : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'
              }`} />
            </div>
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                isColourUI ? 'text-amber-300' : 'text-zinc-500'
              }`}>Max Depth</label>
              <input type="number" defaultValue="64" className={`w-full text-xs px-2 py-1.5 rounded-lg border ${
                isColourUI ? 'bg-[#060a16] border-slate-800 text-white' : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'
              }`} />
            </div>
          </div>
        );
      case 'chatAi':
        return (
          <div className="space-y-3 p-3 pt-0">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${
                isColourUI ? 'text-cyan-300' : 'text-zinc-500'
              }`}>Response Delay (s)</label>
              <input type="number" defaultValue="2" className={`w-full text-xs px-2 py-1.5 rounded-lg border ${
                isColourUI ? 'bg-[#060a16] border-slate-800 text-white' : isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'
              }`} />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" defaultChecked className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500" />
              <span className={isColourUI ? 'text-slate-200' : ''}>Answer only in whispers</span>
            </label>
          </div>
        );
      default:
        return <div className={`p-3 pt-0 text-xs italic ${isColourUI ? 'text-slate-500' : 'text-zinc-500'}`}>No configurable settings.</div>;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <NinimoIcon size="sm" />
        <div className="space-y-0.5">
          <h2 className={`text-base font-black tracking-tight leading-tight ${isColourUI ? 'text-white' : ''}`}>Bot Modules</h2>
          <p className={`text-[11px] leading-tight ${isColourUI ? 'text-slate-400' : isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Configure behaviors & background plugins
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {categories.map((category) => (
          <div key={category.id} className="space-y-2">
            <h3 className={`text-[10px] font-black uppercase tracking-wider ${
              isColourUI ? category.color : isDark ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              {category.title}
            </h3>
            
            <div className="space-y-2">
              {category.plugins.map((plugin) => {
                const isEnabled = Boolean(plugins[plugin.id as keyof BotPluginsConfig]);
                const isExpanded = expandedPlugin === plugin.id;

                return (
                  <div key={plugin.id} className={`border rounded-xl transition-colors ${
                    isColourUI
                      ? isEnabled
                        ? 'bg-[#0a1128] border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                        : 'bg-[#070b19] border-slate-800/80 hover:border-slate-700'
                      : isDark ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-white border-zinc-200'
                  }`}>
                    <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedPlugin(isExpanded ? null : plugin.id)}>
                      <div className="flex items-center gap-3">
                        <plugin.icon className={`w-4 h-4 ${
                          isColourUI
                            ? isEnabled ? plugin.iconColor : 'text-slate-500'
                            : isEnabled ? (isDark ? 'text-zinc-100' : 'text-zinc-900') : isDark ? 'text-zinc-600' : 'text-zinc-400'
                        }`} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${isColourUI ? 'text-slate-100' : ''}`}>{plugin.title}</span>
                            {plugin.badge === 'PRO' && (
                              <span className={`text-[8px] font-black px-1 rounded ${
                                isColourUI ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-amber-500/20 text-amber-500'
                              }`}>PRO</span>
                            )}
                            {plugin.badge === 'DEV' && (
                              <span className={`text-[8px] font-black px-1 rounded ${
                                isColourUI ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30' : isDark ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-zinc-200 text-zinc-800 border border-zinc-300'
                              }`}>DEV</span>
                            )}
                          </div>
                          <div className={`text-[10px] ${isColourUI ? 'text-slate-400' : isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{plugin.description}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handleToggle(plugin.id as keyof BotPluginsConfig, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className={`w-7 h-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all ${
                            isColourUI
                              ? 'bg-slate-800 peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-indigo-500 after:border-slate-900 peer-checked:shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                              : isDark
                              ? 'bg-zinc-800 peer-checked:bg-zinc-100 peer-checked:after:bg-zinc-950 after:border-zinc-700'
                              : 'bg-zinc-300 peer-checked:bg-zinc-900 after:border-zinc-400'
                          }`} />
                        </label>
                        <button 
                          onClick={() => setExpandedPlugin(isExpanded ? null : plugin.id)}
                          className={`p-1 rounded-md transition-colors ${
                            isColourUI
                              ? 'hover:bg-indigo-500/20 text-slate-400 hover:text-cyan-300'
                              : isDark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-zinc-100 text-zinc-400'
                          }`}
                        >
                          <Settings className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className={`overflow-hidden border-t border-dashed ${
                            isColourUI ? 'border-slate-800 bg-[#060a16]' : 'border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          <PluginSettings id={plugin.id} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
