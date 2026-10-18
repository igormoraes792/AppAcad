import React from 'react';
import { PlayCircle, Dumbbell, Scale, TrendingUp } from 'lucide-react';

export type TabType = 'hoje' | 'treinos' | 'pesos' | 'evolucao';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  isWorkoutActive: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab, isWorkoutActive }) => {
  const tabs = [
    {
      id: 'hoje' as TabType,
      label: isWorkoutActive ? 'Treinando' : 'Hoje',
      icon: PlayCircle,
      badge: isWorkoutActive,
    },
    {
      id: 'treinos' as TabType,
      label: 'Treinos',
      icon: Dumbbell,
      badge: false,
    },
    {
      id: 'pesos' as TabType,
      label: 'Pesos',
      icon: Scale,
      badge: false,
    },
    {
      id: 'evolucao' as TabType,
      label: 'Evolução',
      icon: TrendingUp,
      badge: false,
    },
  ];

  const handleTabClick = (tabId: TabType) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch (e) {
        // ignore
      }
    }
    onChangeTab(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 px-2 pb-safe pt-1">
      <div className="max-w-md mx-auto grid grid-cols-4 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="flex flex-col items-center justify-center relative transition-transform active:scale-95"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors duration-200 ${
                    isActive ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-1 font-medium transition-colors duration-200 ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-zinc-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

