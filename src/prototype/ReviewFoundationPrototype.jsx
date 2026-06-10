import React, { useMemo, useState } from 'react';
import {
  Captions,
  Check,
  ChevronLeft,
  CircleDot,
  Download,
  MessageSquare,
  Plus,
  Scissors,
  ShieldCheck,
} from 'lucide-react';
import {
  MARKER_KINDS,
  MARKER_STATUSES,
  isRangeMarker,
  markerAtTime,
  markerDuration,
  normalizeMarker,
  validateMarkerSet,
} from './markerModel';
import './review-foundation.css';

const DURATION = 180;

const INITIAL_MARKERS = [
  {
    id: 'm1',
    kind: 'comment',
    start_s: 18.4,
    text: 'ここは少し間を詰めたいです',
    author_name: 'Director',
    status: 'open',
  },
  {
    id: 'm2',
    kind: 'caption',
    start_s: 34.2,
    end_s: 42.8,
    text: '土地の記憶は 音から立ち上がる',
    author_name: 'Caption editor',
    speaker_id: 'narrator',
    status: 'approved',
    lines: [
      { text: '土地の記憶は', speaker_id: 'narrator', delay_ms: 0 },
      { text: '音から立ち上がる', speaker_id: 'narrator', delay_ms: 0 },
    ],
  },
  {
    id: 'm3',
    kind: 'instruction',
    start_s: 61.7,
    end_s: 68.5,
    text: '※ Bロールへ差し替え。入口の看板を見せる',
    author_name: 'Producer',
    status: 'open',
  },
  {
    id: 'm4',
    kind: 'caption',
    start_s: 91.5,
    end_s: 99.1,
    text: 'いまの話 すごくわかります',
    author_name: 'Caption editor',
    speaker_id: 'guest-b',
    status: 'open',
    lines: [
      { text: 'いまの話', speaker_id: 'guest-a', delay_ms: 0 },
      { text: 'すごくわかります', speaker_id: 'guest-b', delay_ms: 250 },
    ],
  },
  {
    id: 'm5',
    kind: 'comment',
    start_s: 132.2,
    text: 'BGMを一段下げて声を優先',
    author_name: 'Mixer',
    status: 'resolved',
  },
].map((marker) => normalizeMarker(marker, DURATION));

const KIND_META = {
  comment: { label: 'Comment', icon: MessageSquare, color: '#6366f1' },
  instruction: { label: 'Instruction', icon: Scissors, color: '#ef4444' },
  caption: { label: 'Caption', icon: Captions, color: '#0f9f6e' },
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
};

function ReviewFoundationPrototype() {
  const [markers, setMarkers] = useState(INITIAL_MARKERS);
  const [currentTime, setCurrentTime] = useState(36);
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState('m2');

  const visibleMarkers = useMemo(
    () => markers.filter((marker) => filter === 'all' || marker.kind === filter),
    [filter, markers],
  );
  const activeMarkers = markers.filter((marker) => markerAtTime(marker, currentTime));
  const selected = markers.find((marker) => marker.id === selectedId) ?? markers[0];
  const validationErrors = validateMarkerSet(markers);

  const patchMarker = (id, patch) => {
    setMarkers((current) => current.map((marker) => (
      marker.id === id ? normalizeMarker({ ...marker, ...patch, version: marker.version + 1 }, DURATION) : marker
    )));
  };

  const addMarker = (kind) => {
    const id = `m${Date.now()}`;
    const marker = normalizeMarker({
      id,
      kind,
      start_s: currentTime,
      end_s: kind === MARKER_KINDS.COMMENT ? null : Math.min(DURATION, currentTime + 4),
      text: kind === MARKER_KINDS.CAPTION ? '新しい字幕' : kind === MARKER_KINDS.INSTRUCTION ? '※ 新しい修正指示' : '新しいコメント',
      author_name: 'You',
    }, DURATION);
    setMarkers((current) => [...current, marker]);
    setSelectedId(id);
  };

  const exportSummary = () => {
    const payload = {
      schema: 'handover.marker.v1',
      asset: { id: 'prototype-asset', duration_s: DURATION, fps: 24 },
      markers,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'handover-marker-prototype.json';
    anchor.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="rf-shell">
      <header className="rf-header">
        <a href="/" className="rf-icon-button" aria-label="Back to Handover">
          <ChevronLeft size={18} />
        </a>
        <div className="rf-title-block">
          <strong>Review Foundation Prototype</strong>
          <span>Point comments + range instructions + editable captions</span>
        </div>
        <div className="rf-header-status">
          <ShieldCheck size={16} />
          Isolated prototype
        </div>
        <button className="rf-button rf-button-dark" onClick={exportSummary}>
          <Download size={15} />
          Export JSON
        </button>
      </header>

      <main className="rf-workspace">
        <section className="rf-stage-column">
          <div className="rf-stage">
            <div className="rf-stage-label">Dropbox proxy / local media adapter</div>
            <div className="rf-scene">
              <div className="rf-scene-window" />
              <div className="rf-scene-person rf-scene-person-a" />
              <div className="rf-scene-person rf-scene-person-b" />
            </div>

            {activeMarkers
              .filter((marker) => marker.kind === MARKER_KINDS.CAPTION)
              .map((marker) => (
                <div className="rf-caption-overlay" key={marker.id}>
                  {(marker.lines.length ? marker.lines : [{ text: marker.text, delay_ms: 0 }]).map((line, index) => {
                    const elapsedMs = (currentTime - marker.start_s) * 1000;
                    return elapsedMs >= (line.delay_ms ?? 0)
                      ? <span key={`${marker.id}-${index}`}>{line.text}</span>
                      : null;
                  })}
                </div>
              ))}

            {activeMarkers
              .filter((marker) => marker.kind === MARKER_KINDS.INSTRUCTION)
              .map((marker) => (
                <div className="rf-instruction-chip" key={marker.id}>
                  {marker.text}
                </div>
              ))}

            <div className="rf-stage-time">{formatTime(currentTime)} / {formatTime(DURATION)}</div>
          </div>

          <div className="rf-timeline-card">
            <div className="rf-timeline-toolbar">
              <div>
                <strong>Unified marker timeline</strong>
                <span>{markers.length} markers</span>
              </div>
              <div className="rf-add-actions">
                <button onClick={() => addMarker(MARKER_KINDS.COMMENT)}><CircleDot size={14} /> Comment</button>
                <button onClick={() => addMarker(MARKER_KINDS.INSTRUCTION)}><Scissors size={14} /> Instruction</button>
                <button onClick={() => addMarker(MARKER_KINDS.CAPTION)}><Captions size={14} /> Caption</button>
              </div>
            </div>

            <div
              className="rf-timeline-track"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setCurrentTime(((event.clientX - rect.left) / rect.width) * DURATION);
              }}
            >
              {visibleMarkers.map((marker) => {
                const meta = KIND_META[marker.kind];
                const left = `${(marker.start_s / DURATION) * 100}%`;
                const width = isRangeMarker(marker)
                  ? `${Math.max(0.8, (markerDuration(marker) / DURATION) * 100)}%`
                  : undefined;
                return isRangeMarker(marker) ? (
                  <button
                    key={marker.id}
                    className={`rf-range-marker ${marker.id === selectedId ? 'is-selected' : ''}`}
                    style={{ left, width, '--marker-color': meta.color }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedId(marker.id);
                      setCurrentTime(marker.start_s);
                    }}
                    title={marker.text}
                  >
                    {meta.label}
                  </button>
                ) : (
                  <button
                    key={marker.id}
                    className={`rf-point-marker ${marker.id === selectedId ? 'is-selected' : ''}`}
                    style={{ left, '--marker-color': meta.color }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedId(marker.id);
                      setCurrentTime(marker.start_s);
                    }}
                    title={marker.text}
                  />
                );
              })}
              <div className="rf-playhead" style={{ left: `${(currentTime / DURATION) * 100}%` }} />
            </div>
            <div className="rf-axis"><span>0:00</span><span>0:45</span><span>1:30</span><span>2:15</span><span>3:00</span></div>
          </div>
        </section>

        <aside className="rf-sidebar">
          <div className="rf-tabs">
            {['all', 'comment', 'instruction', 'caption'].map((kind) => (
              <button
                key={kind}
                className={filter === kind ? 'is-active' : ''}
                onClick={() => setFilter(kind)}
              >
                {kind === 'all' ? 'All' : KIND_META[kind].label}
              </button>
            ))}
          </div>

          <div className="rf-marker-list">
            {visibleMarkers.map((marker) => {
              const meta = KIND_META[marker.kind];
              const Icon = meta.icon;
              return (
                <button
                  key={marker.id}
                  className={`rf-marker-row ${marker.id === selectedId ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedId(marker.id);
                    setCurrentTime(marker.start_s);
                  }}
                >
                  <span className="rf-kind-icon" style={{ color: meta.color }}><Icon size={15} /></span>
                  <span className="rf-marker-copy">
                    <span><b>{formatTime(marker.start_s)}</b>{isRangeMarker(marker) ? `–${formatTime(marker.end_s)}` : ''}</span>
                    <strong>{marker.text}</strong>
                    <small>{marker.author_name} · {marker.status}</small>
                  </span>
                  {marker.status !== MARKER_STATUSES.OPEN && <Check size={15} className="rf-status-check" />}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="rf-inspector">
              <div className="rf-inspector-heading">
                <span style={{ background: KIND_META[selected.kind].color }} />
                {KIND_META[selected.kind].label} inspector
              </div>
              <label>
                Type
                <select value={selected.kind} onChange={(event) => patchMarker(selected.id, { kind: event.target.value })}>
                  <option value="comment">Comment</option>
                  <option value="instruction">Instruction</option>
                  <option value="caption">Caption</option>
                </select>
              </label>
              <div className="rf-time-fields">
                <label>
                  In
                  <input
                    type="number"
                    step="0.1"
                    value={selected.start_s}
                    onChange={(event) => patchMarker(selected.id, { start_s: event.target.value })}
                  />
                </label>
                <label>
                  Out
                  <input
                    type="number"
                    step="0.1"
                    disabled={!isRangeMarker(selected)}
                    value={selected.end_s ?? ''}
                    onChange={(event) => patchMarker(selected.id, { end_s: event.target.value })}
                  />
                </label>
              </div>
              <label>
                Text
                <textarea value={selected.text} onChange={(event) => patchMarker(selected.id, { text: event.target.value })} />
              </label>
              <label>
                Status
                <select value={selected.status} onChange={(event) => patchMarker(selected.id, { status: event.target.value })}>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="approved">Approved</option>
                </select>
              </label>
              <div className={`rf-validation ${validationErrors.length ? 'has-errors' : ''}`}>
                {validationErrors.length
                  ? `${validationErrors.length} validation issue(s)`
                  : 'Marker set is valid'}
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default ReviewFoundationPrototype;
