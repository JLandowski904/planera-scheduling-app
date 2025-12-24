import React from 'react';
import { ViewType } from '../../types';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';

interface AppHeaderProps {
  currentView: ViewType;
}

const VIEW_TITLES: Record<ViewType, string> = {
  whiteboard: 'Whiteboard',
  timeline: 'Timeline',
  table: 'Table',
  calendar: 'Calendar',
};

const AppHeader: React.FC<AppHeaderProps> = ({ currentView }) => {
  const { theme, toggleTheme } = useTheme();

  const handleToggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    
    // Save to Supabase (don't block UI if it fails)
    try {
      await authAPI.updateTheme(newTheme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between no-print transition-colors">
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
        {VIEW_TITLES[currentView] || 'Plandango'}
      </h1>
      
      <button
        onClick={handleToggleTheme}
        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>
    </header>
  );
};

export default AppHeader;
