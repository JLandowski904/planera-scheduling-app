import React from 'react';
import { Grid, Calendar, Table2, CalendarDays } from 'lucide-react';
import { ViewType } from '../../types';

interface AppSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

interface NavItem {
  title: string;
  view: ViewType;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  {
    title: 'Whiteboard',
    view: 'whiteboard',
    icon: Grid,
  },
  {
    title: 'Timeline',
    view: 'timeline',
    icon: Calendar,
  },
  {
    title: 'Calendar',
    view: 'calendar',
    icon: CalendarDays,
  },
  {
    title: 'Table',
    view: 'table',
    icon: Table2,
  },
];

const AppSidebar: React.FC<AppSidebarProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="app-sidebar w-64 bg-white border-r border-slate-200 flex flex-col no-print">
      {/* Brand Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <Grid className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Plandango</h2>
            <p className="text-xs text-slate-500">Project Scheduler</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-3 flex-1">
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
            Navigation
          </p>
        </div>
        
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200
                ${
                  currentView === item.view
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppSidebar;
