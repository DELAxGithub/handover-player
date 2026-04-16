import { X, Keyboard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';

const shortcuts = [
  { keys: ['Space', 'K'], action: 'Play / Pause' },
  { keys: ['J'], action: 'Rewind 10s' },
  { keys: ['L'], action: 'Forward 10s' },
  { keys: ['←'], action: 'Rewind 5s' },
  { keys: ['→'], action: 'Forward 5s' },
  { keys: ['1', '2', '3', '4'], action: 'Playback speed (1x, 1.5x, 2x, 3x)' },
  { keys: ['M'], action: 'Toggle mute' },
  { keys: ['F'], action: 'Toggle fullscreen' },
  { keys: ['C'], action: 'Focus comment input' },
  { keys: ['Esc'], action: 'Unfocus input' },
  { keys: ['?'], action: 'Show this help' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="max-w-md w-full mx-4 overflow-hidden border-border bg-card shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-md">
              <Keyboard size={18} />
            </div>
            <CardTitle className="text-lg font-bold text-foreground">Keyboard Shortcuts</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </Button>
        </div>

        <CardContent className="p-4 space-y-1">
          {shortcuts.map(({ keys, action }, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="text-muted-foreground text-sm font-medium">{action}</span>
              <div className="flex gap-1.5">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-1 bg-muted border border-border rounded-md text-xs text-foreground font-mono font-bold shadow-sm min-w-[28px] text-center"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </CardContent>

        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center font-mono">
            Press Esc or click to close
          </p>
        </div>
      </Card>
    </div>
  );
}
