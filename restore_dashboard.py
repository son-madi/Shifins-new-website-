import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Define the start and end of what to replace
start_marker = r"\{\/\* Unified 5-Button Control Dock removed since we now use BotWorkspace \*\/\}[\s\S]*?(?=\{\/\* Bot Config Modal \*\/\}|\<\/main\>)"

replacement = """{/* Unified 5-Button Control Dock: HUD & Chat, Anti-AFK, Server Join, Nether Calc, Settings */}
            <div className={`border rounded-2xl p-1.5 shadow-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 transition-colors ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              {/* Left: View Switching Tabs with smooth Spring Indicator */}
              <div className="flex items-center gap-1 w-full sm:w-auto flex-1 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`hidden lg:flex items-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-colors relative z-10 cursor-pointer whitespace-nowrap ${
                    activeTab === 'all'
                      ? isDark ? 'text-white' : 'text-zinc-950'
                      : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Overview</span>
                  {activeTab === 'all' && (
                    <motion.div
                      layoutId="bot-view-tab-pill"
                      className={`absolute inset-0 rounded-xl -z-10 shadow-sm border ${
                        isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-300'
                      }`}
                      transition={{ type: 'spring', bounce: 0.22, duration: 0.35 }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('hud_chat')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-colors relative z-10 cursor-pointer whitespace-nowrap ${
                    activeTab === 'hud_chat'
                      ? isDark ? 'text-white' : 'text-zinc-950'
                      : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>HUD & Chat</span>
                  {activeTab === 'hud_chat' && (
                    <motion.div
                      layoutId="bot-view-tab-pill"
                      className={`absolute inset-0 rounded-xl -z-10 shadow-sm border ${
                        isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-100 border-zinc-300'
                      }`}
                      transition={{ type: 'spring', bounce: 0.22, duration: 0.35 }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('anti_afk')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-colors relative z-10 cursor-pointer whitespace-nowrap ${
                    activeTab === 'anti_afk'
                      ? isDark ? 'text-white' : 'text-zinc-950'
                      : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Anti-AFK</span>
                  {activeTab === 'anti_afk' && (
                    <motion.div
                      layoutId="bot-view-tab-pill"
                      className={`absolute inset-0 rounded-xl -z-10 shadow-sm border ${
                        isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-100 border-zinc-300'
                      }`}
                      transition={{ type: 'spring', bounce: 0.22, duration: 0.35 }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-colors relative z-10 cursor-pointer whitespace-nowrap ${
                    activeTab === 'settings'
                      ? isDark ? 'text-white' : 'text-zinc-950'
                      : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Server className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Server Join</span>
                  {activeTab === 'settings' && (
                    <motion.div
                      layoutId="bot-view-tab-pill"
                      className={`absolute inset-0 rounded-xl -z-10 shadow-sm border ${
                        isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-100 border-zinc-300'
                      }`}
                      transition={{ type: 'spring', bounce: 0.22, duration: 0.35 }}
                    />
                  )}
                </button>
              </div>

              {/* Subtle separator on sm: */}
              <div className={`hidden sm:block w-px h-6 shrink-0 mx-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

              {/* Right: The 2 Action Buttons */}
              <div className={`flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end pt-1 sm:pt-0 border-t sm:border-t-0 ${
                isDark ? 'border-zinc-800' : 'border-zinc-200'
              }`}>
                <motion.button
                  id="btn-nether-calc-control"
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsNetherCalcOpen(true)}
                  className={`flex-1 sm:flex-initial py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                  }`}
                  title="Nether Portal Link Calculator"
                >
                  <Compass className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="hidden sm:inline">Nether Calc</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsWorkspaceOpen(true)}
                  className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-black/40'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
                  }`}
                  title="Open 3D Workspace"
                >
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>3D Workspace</span>
                </motion.button>
              </div>
            </div>

            {/* Active Bot Main Dashboard View */}
            {activeBot ? (
              <div className="space-y-6">
                {/* Top Bot HUD */}
                <BotHud
                  bot={activeBot}
                  onStart={handleStartBot}
                  onStop={handleStopBot}
                  onRestart={handleRestartBot}
                  onEdit={(b) => {
                    setEditingBot(b);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeleteBot}
                  onToggleAntiAfk={handleToggleAntiAfk}
                  onOpenNetherCalc={() => setIsNetherCalcOpen(true)}
                  isAdmin={Boolean(currentUser?.isAdmin)}
                />

                {/* Animated Views based on activeTab */}
                <AnimatePresence mode="wait">
                  {activeTab === 'all' && (
                    <motion.div
                      key="view-all"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                    >
                      {/* Left Column: Live Chat & Nearby Players (7 cols) */}
                      <div className="lg:col-span-7 space-y-6">
                        <ChatConsole
                          chatHistory={activeBot.chatHistory}
                          botUsername={activeBot.config.username}
                          isOnline={activeBot.status === 'online'}
                          botStatus={activeBot.status}
                          quickCommands={botDefaults.quickCommands}
                          onSendMessage={handleSendMessage}
                          onClearChat={handleClearChat}
                          onOpenQuickMessagesSettings={() => setIsDefaultsOpen(true)}
                        />

                        <PlayersWidget
                          players={activeBot.playersNearby}
                          botUsername={activeBot.config.username}
                        />
                      </div>

                      {/* Right Column: Anti-AFK & Server Configuration (5 cols) */}
                      <div className="lg:col-span-5 space-y-6">
                        <AntiAfkCard
                          config={activeBot.config.antiAfk}
                          isOnline={activeBot.status === 'online'}
                          botId={activeBot.id}
                          onUpdateConfig={(updated) => handleSaveBotConfig({ antiAfk: updated })}
                          onTriggerTestMove={handleTriggerTestMove}
                        />

                        <ConnectionSettingsCard
                          config={activeBot.config}
                          isOnline={activeBot.status === 'online'}
                          onSaveConfig={handleSaveBotConfig}
                        />

                        <BotPluginsCard
                          config={activeBot.config}
                          isOnline={activeBot.status === 'online'}
                          botId={activeBot.id}
                          onUpdateConfig={async (updated) => {
                            const newPlugins = { ...activeBot.config.plugins, ...updated };
                            await handleSaveBotConfig({ plugins: newPlugins as any });
                          }}
                        />

                        <div className={`border rounded-2xl p-4 text-xs space-y-2 transition-colors ${
                          isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
                        }`}>
                          <div className="flex items-center gap-2 font-bold">
                            <Info className="w-4 h-4 text-zinc-400" />
                            <span>Ninimo 24/7 Private Hosting</span>
                          </div>
                          <p className={`leading-relaxed text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            Ninimo runs your Mineflayer bot continuously in the background. The auto-reconnect engine automatically detects kicks, restarts, or timeouts and rejoins with your configured on-join login command. All changes are saved to your account.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'hud_chat' && (
                    <motion.div
                      key="view-hud-chat"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="space-y-6"
                    >
                      <ChatConsole
                        chatHistory={activeBot.chatHistory}
                        botUsername={activeBot.config.username}
                        isOnline={activeBot.status === 'online'}
                        botStatus={activeBot.status}
                        quickCommands={botDefaults.quickCommands}
                        onSendMessage={handleSendMessage}
                        onClearChat={handleClearChat}
                        onOpenQuickMessagesSettings={() => setIsDefaultsOpen(true)}
                      />

                      <PlayersWidget
                        players={activeBot.playersNearby}
                        botUsername={activeBot.config.username}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'anti_afk' && (
                    <motion.div
                      key="view-anti-afk"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="space-y-6 max-w-3xl mx-auto"
                    >
                      <AntiAfkCard
                        config={activeBot.config.antiAfk}
                        isOnline={activeBot.status === 'online'}
                        botId={activeBot.id}
                        onUpdateConfig={(updated) => handleSaveBotConfig({ antiAfk: updated })}
                        onTriggerTestMove={handleTriggerTestMove}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'settings' && (
                    <motion.div
                      key="view-server-join"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="space-y-6 max-w-3xl mx-auto"
                    >
                      <ConnectionSettingsCard
                        config={activeBot.config}
                        isOnline={activeBot.status === 'online'}
                        onSaveConfig={handleSaveBotConfig}
                      />

                      <div className={`border rounded-2xl p-4 text-xs space-y-2 transition-colors ${
                        isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
                      }`}>
                        <div className="flex items-center gap-2 font-bold">
                          <Info className="w-4 h-4 text-zinc-400" />
                          <span>Ninimo 24/7 Private Hosting</span>
                        </div>
                        <p className={`leading-relaxed text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          Ninimo runs your Mineflayer bot continuously in the background. The auto-reconnect engine automatically detects kicks, restarts, or timeouts and rejoins with your configured on-join login command. All changes are saved to your account.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className={`border rounded-3xl p-12 text-center space-y-4 shadow-xl mt-8 transition-colors ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-zinc-200/50'
              }`}>
                <Server className="w-12 h-12 text-zinc-500 mx-auto" />
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>No Bot Profiles in Your Account</h3>
                <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Create your first 24/7 Minecraft bot to connect to cracked or premium servers with anti-AFK movement and live chat.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  onClick={() => setIsModalOpen(true)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-black/40'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-300'
                  }`}
                >
                  Add First Bot
                </motion.button>
              </div>
            )}
"""

new_content = re.sub(start_marker, replacement, content)

with open('src/App.tsx', 'w') as f:
    f.write(new_content)
