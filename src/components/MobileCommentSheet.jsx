import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, ChevronUp, ChevronDown, Share2 } from 'lucide-react';
import CommentSection from './CommentSection';
import ExportMenu from './ExportMenu';
import Button from './ui/Button';
import Badge from './ui/Badge';

// Sheet states: closed (peek bar), half (~50%), full (almost full screen)
const HANDLE_HEIGHT = 52; // px — closed state peek bar
const TOP_MARGIN = 56; // px — gap at top so video is still slightly visible in full mode

const MobileCommentSheet = ({
  projectId,
  currentTime,
  onSeek,
  comments,
  isLoading,
  commentInputRef,
  onRefreshComments,
  onShareClick,
  filename,
}) => {
  const [sheetState, setSheetState] = useState('closed'); // closed | half | full
  const sheetRef = useRef(null);
  const dragRef = useRef({ startY: 0, startTranslate: 0, dragging: false });
  const [translateY, setTranslateY] = useState(0);
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);

  // Calculate snap points based on container height
  const getSnapPoints = useCallback(() => {
    const h = containerHeight;
    return {
      closed: h - HANDLE_HEIGHT,
      half: Math.round(h * 0.45),
      full: TOP_MARGIN,
    };
  }, [containerHeight]);

  // Update container height (handles iOS keyboard via visualViewport)
  useEffect(() => {
    const update = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setContainerHeight(vh);
    };
    update();
    window.visualViewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // Sync translateY to current sheetState
  useEffect(() => {
    const snaps = getSnapPoints();
    setTranslateY(snaps[sheetState]);
  }, [sheetState, getSnapPoints]);

  // Auto-expand to half when input is focused
  useEffect(() => {
    const input = commentInputRef?.current;
    if (!input) return;
    const handleFocus = () => {
      if (sheetState === 'closed') setSheetState('half');
    };
    input.addEventListener('focus', handleFocus);
    return () => input.removeEventListener('focus', handleFocus);
  }, [sheetState, commentInputRef]);

  // --- Touch drag handlers ---
  const onTouchStart = useCallback((e) => {
    // Only drag from handle area (first 48px of the sheet)
    const touch = e.touches[0];
    const sheetTop = sheetRef.current?.getBoundingClientRect().top ?? 0;
    if (touch.clientY - sheetTop > 48) return; // not on handle
    dragRef.current = { startY: touch.clientY, startTranslate: translateY, dragging: true };
  }, [translateY]);

  const onTouchMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    const snaps = getSnapPoints();
    const newY = Math.max(snaps.full, Math.min(snaps.closed, dragRef.current.startTranslate + dy));
    setTranslateY(newY);
  }, [getSnapPoints]);

  const onTouchEnd = useCallback(() => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    // Snap to nearest state
    const snaps = getSnapPoints();
    const points = [
      { state: 'closed', y: snaps.closed },
      { state: 'half', y: snaps.half },
      { state: 'full', y: snaps.full },
    ];
    let nearest = points[0];
    for (const p of points) {
      if (Math.abs(translateY - p.y) < Math.abs(translateY - nearest.y)) {
        nearest = p;
      }
    }
    setSheetState(nearest.state);
  }, [translateY, getSnapPoints]);

  // Cycle state on handle tap
  const handleToggle = () => {
    if (sheetState === 'closed') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('closed');
  };

  const snaps = getSnapPoints();
  const isAnimating = !dragRef.current.dragging;
  const sheetHeight = containerHeight - TOP_MARGIN;

  return (
    <div
      ref={sheetRef}
      className="fixed left-0 right-0 z-40 flex flex-col bg-card rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.3)] border-t border-border"
      style={{
        top: 0,
        height: `${sheetHeight}px`,
        transform: `translateY(${translateY}px)`,
        transition: isAnimating ? 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
        willChange: 'transform',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Drag Handle + Peek Bar */}
      <div
        className="flex-shrink-0 flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
        onClick={handleToggle}
      >
        {/* Pill handle */}
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mt-2 mb-2" />
        {/* Peek bar content */}
        <div className="w-full flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquare size={16} />
            <span>コメント</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-full bg-muted text-muted-foreground font-mono">
              {comments.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {sheetState !== 'closed' && (
              <>
                <Button onClick={(e) => { e.stopPropagation(); onShareClick?.(); }} size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs">
                  <Share2 size={12} /> 共有
                </Button>
                <ExportMenu comments={comments} filename={filename} />
              </>
            )}
            {sheetState === 'closed' ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Comment content — only rendered when not fully closed for perf */}
      <div className="flex-1 overflow-hidden min-h-0 border-t border-border">
        <CommentSection
          projectId={projectId}
          currentTime={currentTime}
          onSeek={onSeek}
          externalComments={comments}
          isLoading={isLoading}
          commentInputRef={commentInputRef}
          onRefreshComments={onRefreshComments}
        />
      </div>
    </div>
  );
};

export default MobileCommentSheet;
