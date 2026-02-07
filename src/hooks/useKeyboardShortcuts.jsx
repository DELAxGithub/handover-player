import { useEffect, useCallback } from 'react';

export function useKeyboardShortcuts(videoRef, {
  onTogglePlay,
  onSeekRelative,
  onSetPlaybackRate,
  onFocusComment,
  onShowHelp,
  onToggleMute,
  onToggleFullscreen,
}) {
  const handleKeyDown = useCallback((e) => {
    // Skip if user is typing in input/textarea
    const isTyping = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);

    if (isTyping) {
      // Only handle Escape to blur
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }

    const video = videoRef?.current;

    switch (e.key) {
      case ' ':
      case 'k':
      case 'K':
        e.preventDefault();
        onTogglePlay?.();
        break;

      case 'j':
      case 'J':
        e.preventDefault();
        onSeekRelative?.(-10);
        break;

      case 'l':
      case 'L':
        e.preventDefault();
        onSeekRelative?.(10);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        onSeekRelative?.(-5);
        break;

      case 'ArrowRight':
        e.preventDefault();
        onSeekRelative?.(5);
        break;

      case '1':
        e.preventDefault();
        onSetPlaybackRate?.(1.0);
        break;

      case '2':
        e.preventDefault();
        onSetPlaybackRate?.(1.5);
        break;

      case '3':
        e.preventDefault();
        onSetPlaybackRate?.(2.0);
        break;

      case '4':
        e.preventDefault();
        onSetPlaybackRate?.(3.0);
        break;

      case 'c':
      case 'C':
        e.preventDefault();
        onFocusComment?.();
        break;

      case 'm':
      case 'M':
        e.preventDefault();
        onToggleMute?.();
        break;

      case 'f':
      case 'F':
        e.preventDefault();
        onToggleFullscreen?.();
        break;

      case '?':
        e.preventDefault();
        onShowHelp?.();
        break;

      default:
        break;
    }
  }, [videoRef, onTogglePlay, onSeekRelative, onSetPlaybackRate, onFocusComment, onShowHelp, onToggleMute, onToggleFullscreen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
