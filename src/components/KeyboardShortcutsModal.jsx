import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  { keys: ['Space', 'K'], action: '再生 / 一時停止' },
  { keys: ['J'], action: '10秒戻る' },
  { keys: ['L'], action: '10秒進む' },
  { keys: ['←'], action: '5秒戻る' },
  { keys: ['→'], action: '5秒進む' },
  { keys: ['1', '2', '3', '4'], action: '速度変更 (1x, 1.5x, 2x, 3x)' },
  { keys: ['C'], action: 'コメント入力にフォーカス' },
  { keys: ['Esc'], action: '入力からフォーカス解除' },
  { keys: ['?'], action: 'このヘルプを表示' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <div className="flex items-center gap-2">
            <Keyboard size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white">キーボードショートカット</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {shortcuts.map(({ keys, action }, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5"
            >
              <span className="text-gray-300 text-sm">{action}</span>
              <div className="flex gap-1">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-1 bg-[#333] border border-[#444] rounded text-xs text-gray-200 font-mono min-w-[28px] text-center"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#333] bg-[#151515]">
          <p className="text-xs text-gray-500 text-center">
            Escまたはクリックで閉じる
          </p>
        </div>
      </div>
    </div>
  );
}
