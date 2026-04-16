import { X } from 'lucide-react';

const shortcuts = [
  { keys: ['Space'], action: 'Play / Pause' },
  { keys: ['J'], action: 'Rewind 2x/4x/8x' },
  { keys: ['L'], action: 'Fast forward 2x/4x/8x' },
  { keys: ['←'], action: 'Rewind 5s' },
  { keys: ['→'], action: 'Forward 5s' },
  { keys: ['F'], action: 'Toggle fullscreen' },
  { keys: ['C'], action: 'Focus comment input' },
  { keys: ['M'], action: 'Toggle mute' },
  { keys: ['Shift', 'Enter'], action: 'Send comment' },
  { keys: ['?'], action: 'Show this help' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{ width: '400px', maxWidth: '90vw', backgroundColor: 'var(--background)', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — mockup: title + × */}
        <div className="flex items-center justify-between" style={{ padding: '24px 28px 0' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>Keyboard shortcuts</span>
          <button onClick={onClose} style={{ fontSize: '20px', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 28px 28px' }}>
          <div className="flex flex-col" style={{ gap: 0 }}>
            {shortcuts.map(({ keys, action }, index) => (
              <div
                key={index}
                className="flex items-center justify-between"
                style={{ padding: '10px 0', borderBottom: index < shortcuts.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span style={{ fontSize: '13px', color: '#666' }}>{action}</span>
                <div className="flex" style={{ gap: '4px' }}>
                  {keys.map((key) => (
                    <kbd
                      key={key}
                      style={{ fontFamily: 'inherit', fontSize: '11px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 7px', color: '#666', fontWeight: 500 }}
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
