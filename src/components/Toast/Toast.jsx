import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const styles = {
  success: 'bg-[#1a3a1a] border-[#2d5a2d] text-[#86efac]',
  error: 'bg-[#3a1a1a] border-[#5a2d2d] text-[#fca5a5]',
  info: 'bg-[#1a1a3a] border-[#2d2d5a] text-[#93c5fd]',
};

const iconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-blue-400',
};

export default function Toast({ id, message, type, duration, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const Icon = icons[type];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    // Start exit animation before removal
    const exitTimeout = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300);

    return () => {
      clearInterval(interval);
      clearTimeout(exitTimeout);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(id), 300);
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border shadow-lg
        transform transition-all duration-300 ease-out
        ${styles[type]}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="flex items-start gap-3 p-4 pr-10">
        <Icon size={18} className={`flex-shrink-0 mt-0.5 ${iconColors[type]}`} />
        <p className="text-sm leading-relaxed">{message}</p>
      </div>

      <button
        onClick={handleClose}
        className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors"
      >
        <X size={14} className="opacity-60 hover:opacity-100" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-current opacity-40 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
