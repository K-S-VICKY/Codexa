import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onAddTask: () => void;
  onRefresh: () => void;
}
//done
export const useKeyboardShortcuts = ({ onAddTask, onRefresh }: KeyboardShortcutsConfig) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only trigger shortcuts when not typing in input fields
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true' ||
                        target.classList.contains('CodeMirror');

    if (isInputField) return;

    // Ctrl/Cmd + Shift + T: Add new task (to avoid conflict with browser tab)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
      event.preventDefault();
      onAddTask();
    }

    // Ctrl/Cmd + R: Refresh tasks
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault();
      onRefresh();
    }

    // Escape: Close any open modals (handled by individual components)
    if (event.key === 'Escape') {
      // This will be handled by the component that needs to close
    }
  }, [onAddTask, onRefresh]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
