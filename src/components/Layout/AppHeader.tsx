import React from 'react';
import { ViewType } from '../../types';

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
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print">
      <h1 className="text-xl font-bold text-slate-900">
        {VIEW_TITLES[currentView] || 'Plandango'}
      </h1>
    </header>
  );
};

export default AppHeader;
