import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Node, Project } from '../types';

interface CalendarViewProps {
  project: Project;
  selectedNodes: string[];
  onNodeSelect: (nodeId: string) => void;
}

type EventKind = 'start' | 'due';

interface CalendarEvent {
  id: string;
  nodeId: string;
  nodeType: Node['type'];
  title: string;
  date: Date;
  kind: EventKind;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TYPE_STYLES: Record<Node['type'], string> = {
  milestone: 'border-blue-500 bg-blue-50 text-blue-700',
  deliverable: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  task: 'border-orange-500 bg-orange-50 text-orange-700',
  person: 'border-slate-400 bg-slate-50 text-slate-600',
};

const KIND_LABEL: Record<EventKind, string> = {
  start: 'Start',
  due: 'Due',
};

const getInitialMonth = (project: Project): Date => {
  const allDates = project.nodes.flatMap(node => {
    const dates: Date[] = [];
    if (node.data.startDate instanceof Date) {
      dates.push(node.data.startDate);
    }
    if (node.data.dueDate instanceof Date) {
      dates.push(node.data.dueDate);
    }
    return dates;
  });

  if (allDates.length === 0) {
    return startOfMonth(new Date());
  }

  const earliest = allDates.reduce(
    (earliestDate, current) => (current < earliestDate ? current : earliestDate),
    allDates[0]
  );

  return startOfMonth(earliest);
};

const CalendarView: React.FC<CalendarViewProps> = ({ project, selectedNodes, onNodeSelect }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => getInitialMonth(project));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const intervalStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const intervalEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: intervalStart, end: intervalEnd });
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    const addEvent = (date: Date, event: CalendarEvent) => {
      const key = format(date, 'yyyy-MM-dd');
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(event);
      } else {
        map.set(key, [event]);
      }
    };

    project.nodes.forEach(node => {
      const { startDate, dueDate } = node.data;

      if (startDate instanceof Date) {
        addEvent(startDate, {
          id: `${node.id}-start`,
          nodeId: node.id,
          nodeType: node.type,
          title: node.title,
          date: startDate,
          kind: 'start',
        });
      }

      if (dueDate instanceof Date) {
        addEvent(dueDate, {
          id: `${node.id}-due`,
          nodeId: node.id,
          nodeType: node.type,
          title: node.title,
          date: dueDate,
          kind: 'due',
        });
      }
    });

    map.forEach(events => {
      events.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    return map;
  }, [project.nodes]);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-slate-500" />
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <p className="text-sm text-slate-500">
            Tasks, milestones, and deliverables with dates appear on this calendar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          >
            Today
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-7 gap-3">
          {WEEKDAY_LABELS.map(label => (
            <div key={label} className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-2">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3 mt-2">
          {calendarDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const events = eventsByDay.get(dayKey) ?? [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dayKey}
                className={clsx(
                  'min-h-[120px] rounded-xl border p-2 flex flex-col bg-white transition',
                  isCurrentMonth ? 'border-slate-200' : 'border-slate-100 bg-slate-50',
                  isToday && 'ring-1 ring-blue-500'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={clsx(
                      'text-sm font-medium',
                      isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {events.length > 0 && (
                    <span className="text-xs text-slate-400">{events.length} item{events.length > 1 ? 's' : ''}</span>
                  )}
                </div>

                <div className="space-y-2 overflow-hidden">
                  {events.map(event => (
                    <button
                      key={event.id}
                      onClick={() => onNodeSelect(event.nodeId)}
                      className={clsx(
                        'w-full text-left text-xs px-2 py-1 rounded-lg border-l-4 transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500',
                        TYPE_STYLES[event.nodeType],
                        selectedNodes.includes(event.nodeId) && 'ring-2 ring-offset-1 ring-blue-500'
                      )}
                    >
                      <div className="font-semibold truncate">{event.title}</div>
                      <div className="text-[10px] uppercase tracking-wide">{KIND_LABEL[event.kind]}</div>
                    </button>
                  ))}

                  {events.length === 0 && (
                    <div className="text-xs text-slate-300 italic">
                      No items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
