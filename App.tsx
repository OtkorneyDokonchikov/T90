import React, { useState, useCallback, useEffect } from 'react';
import { UserRole, ToolType, AppScenario, WorkspaceState } from './types';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import RightInspector from './components/RightInspector';
import ToolDock from './components/ToolDock';
import Canvas from './components/Canvas';
import StatusBar from './components/StatusBar';

const App: React.FC = () => {
  const [state, setState] = useState<WorkspaceState>({
    role: UserRole.OPERATOR,
    scenario: AppScenario.CREATE,
    activeTool: ToolType.SELECT,
    isVoiceActive: false,
    isSidebarOpen: true,
    historyIndex: 0,
    history: ['Сессия успешно инициализирована'],
    theme: 'dark',
    selectedPage: 1,
  });

  const updateState = useCallback(<K extends keyof WorkspaceState>(key: K, value: WorkspaceState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleScenarioChange = useCallback((s: AppScenario) => {
    setState(prev => ({ ...prev, scenario: s }));
  }, []);

  const handleQualityControlToggle = useCallback(() => {
    window.dispatchEvent(new CustomEvent('t90:toggle-quality-control'));
  }, []);

  const toggleTheme = () => {
    updateState('theme', state.theme === 'dark' ? 'light' : 'dark');
  };

  const addHistory = useCallback((entry: string) => {
    setState(prev => ({
      ...prev,
      history: [...prev.history, entry],
      historyIndex: prev.history.length,
    }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setState(prev => ({ ...prev, selectedPage: Math.max(1, Math.min(100, newPage)) }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'v') updateState('isVoiceActive', !state.isVoiceActive);
      if (e.key === 'ArrowDown') handlePageChange(state.selectedPage + 1);
      if (e.key === 'ArrowUp') handlePageChange(state.selectedPage - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedPage, state.isVoiceActive, handlePageChange, updateState]);

  const isDark = state.theme === 'dark';

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden select-none transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      <TopBar
        role={state.role}
        onRoleChange={(r) => updateState('role', r)}
        scenario={state.scenario}
        onScenarioChange={handleScenarioChange}
        onQualityControlToggle={handleQualityControlToggle}
        theme={state.theme}
        toggleTheme={toggleTheme}
      />

      <div className="flex flex-1 relative overflow-hidden">
        <LeftSidebar
          isOpen={state.isSidebarOpen}
          setIsOpen={(v) => updateState('isSidebarOpen', v)}
          selectedPage={state.selectedPage}
          onPageSelect={handlePageChange}
          theme={state.theme}
        />

        <main className={`flex-1 flex flex-col relative ${isDark ? 'bg-[#0d0d0d]' : 'bg-zinc-100/50'}`}>
          <ToolDock
            activeTool={state.activeTool}
            onToolSelect={(t) => updateState('activeTool', t)}
            theme={state.theme}
          />
          <Canvas
            scenario={state.scenario}
            activeTool={state.activeTool}
            onAction={addHistory}
            theme={state.theme}
          />
        </main>

        <RightInspector
          isVoiceActive={state.isVoiceActive}
          setIsVoiceActive={(v) => updateState('isVoiceActive', v)}
          history={state.history}
          theme={state.theme}
        />
      </div>

      <StatusBar
        isVoiceActive={state.isVoiceActive}
        setIsVoiceActive={(v) => updateState('isVoiceActive', v)}
        lastAction={state.history[state.historyIndex]}
        currentPage={state.selectedPage}
        totalPages={100}
        onPageChange={handlePageChange}
        theme={state.theme}
      />
    </div>
  );
};

export default App;
