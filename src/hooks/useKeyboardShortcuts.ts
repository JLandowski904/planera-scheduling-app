import { useEffect, useCallback } from 'react';
import { ViewType } from '../types';

interface KeyboardShortcutsProps {
  onNewTask: () => void;
  onNewMilestone: () => void;
  onNewDeliverable: () => void;
  onNewPerson: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onLinkMode: () => void;
  onSwitchView: (view: ViewType) => void;
  onToggleProperties: () => void;
}

export const useKeyboardShortcuts = ({
  onNewTask,
  onNewMilestone,
  onNewDeliverable,
  onNewPerson,
  onDelete,
  onUndo,
  onRedo,
  onLinkMode,
  onSwitchView,
  onToggleProperties,
}: KeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement ||
      (e.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

    switch (e.key.toLowerCase()) {
      case 'n':
        if (!ctrlKey) {
          e.preventDefault();
          onNewTask();
        }
        break;
      case 'm':
        if (!ctrlKey) {
          e.preventDefault();
          onNewMilestone();
        }
        break;
      case 'd':
        if (!ctrlKey) {
          e.preventDefault();
          onNewDeliverable();
        }
        break;
      case 'p':
        if (!ctrlKey) {
          e.preventDefault();
          onNewPerson();
        }
        break;
      case 'l':
        if (!ctrlKey) {
          e.preventDefault();
          onLinkMode();
        }
        break;
      case 'delete':
      case 'backspace':
        e.preventDefault();
        onDelete();
        break;
      case 'z':
        if (ctrlKey && !e.shiftKey) {
          e.preventDefault();
          onUndo();
        } else if (ctrlKey && e.shiftKey) {
          e.preventDefault();
          onRedo();
        }
        break;
      case 'y':
        if (ctrlKey) {
          e.preventDefault();
          onRedo();
        }
        break;
      case '1':
        if (!ctrlKey) {
          e.preventDefault();
          onSwitchView('whiteboard');
        }
        break;
      case '2':
        if (!ctrlKey) {
          e.preventDefault();
          onSwitchView('timeline');
        }
        break;
      case '3':
        if (!ctrlKey) {
          e.preventDefault();
          onSwitchView('table');
        }
        break;
      case '4':
        if (!ctrlKey) {
          e.preventDefault();
          onSwitchView('calendar');
        }
        break;
      case 'f':
        if (ctrlKey) {
          e.preventDefault();
          // Focus search/filter
          const searchInput = document.querySelector('input[placeholder*="search"], input[placeholder*="filter"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }
        break;
      case 'escape':
        // Close any open modals or context menus
        const contextMenu = document.querySelector('.context-menu');
        if (contextMenu) {
          (contextMenu as HTMLElement).style.display = 'none';
        }
        break;
    }
  }, [
    onNewTask,
    onNewMilestone,
    onNewDeliverable,
    onNewPerson,
    onDelete,
    onUndo,
    onRedo,
    onLinkMode,
    onSwitchView,
    onToggleProperties,
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

