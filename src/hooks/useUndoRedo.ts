import { useState, useCallback } from 'react';
import { Project } from '../types';

interface UseUndoRedoReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveState: (project: Project) => void;
}

export const useUndoRedo = (
  project: Project,
  setProject: (project: Project) => void
): UseUndoRedoReturn => {
  const [history, setHistory] = useState<Project[]>([project]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxHistorySize = 50;

  const saveState = useCallback((newProject: Project) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push({ ...newProject });
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    setCurrentIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setProject(history[newIndex]);
    }
  }, [currentIndex, history, setProject]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setProject(history[newIndex]);
    }
  }, [currentIndex, history, setProject]);

  return {
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    saveState,
  };
};


