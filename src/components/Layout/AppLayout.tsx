import React from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { ViewType } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, currentView, onViewChange }) => {
  return (
    <div className="app-shell h-screen flex w-full bg-slate-50 dark:bg-slate-900 transition-colors">
      <AppSidebar currentView={currentView} onViewChange={onViewChange} />
      
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <AppHeader currentView={currentView} />
        
        <div className="flex-1 min-h-0 overflow-auto bg-slate-50 dark:bg-slate-900">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;


















