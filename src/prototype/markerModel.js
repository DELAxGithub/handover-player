export const MARKER_KINDS = Object.freeze({
  COMMENT: 'comment',
  INSTRUCTION: 'instruction',
  CAPTION: 'caption',
});

export const MARKER_STATUSES = Object.freeze({
  OPEN: 'open',
  RESOLVED: 'resolved',
  APPROVED: 'approved',
});

const asFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function normalizeMarker(marker, duration = Infinity) {
  const start = Math.max(0, asFiniteNumber(marker.start_s ?? marker.ptime));
  const rawEnd = marker.end_s == null ? null : asFiniteNumber(marker.end_s, start);
  const end = rawEnd == null
    ? null
    : Math.min(Math.max(rawEnd, start + 0.05), duration);

  return {
    id: String(marker.id),
    asset_id: marker.asset_id ?? 'prototype-asset',
    kind: Object.values(MARKER_KINDS).includes(marker.kind)
      ? marker.kind
      : MARKER_KINDS.COMMENT,
    start_s: Math.min(start, duration),
    end_s: end,
    text: String(marker.text ?? ''),
    author_name: marker.author_name ?? marker.user_name ?? 'Anonymous',
    status: Object.values(MARKER_STATUSES).includes(marker.status)
      ? marker.status
      : MARKER_STATUSES.OPEN,
    color: marker.color ?? null,
    speaker_id: marker.speaker_id ?? null,
    lines: Array.isArray(marker.lines) ? marker.lines : [],
    version: Math.max(1, Math.trunc(asFiniteNumber(marker.version, 1))),
    created_at: marker.created_at ?? new Date().toISOString(),
    updated_at: marker.updated_at ?? marker.created_at ?? new Date().toISOString(),
  };
}

export function isRangeMarker(marker) {
  return marker.end_s != null;
}

export function markerDuration(marker) {
  return isRangeMarker(marker) ? Math.max(0, marker.end_s - marker.start_s) : 0;
}

export function markerAtTime(marker, time, pointTolerance = 0.35) {
  if (isRangeMarker(marker)) {
    return time >= marker.start_s && time <= marker.end_s;
  }
  return Math.abs(time - marker.start_s) <= pointTolerance;
}

export function validateMarkerSet(markers, { preventCaptionOverlap = true } = {}) {
  const errors = [];
  for (const marker of markers) {
    if (!marker.text.trim()) errors.push({ id: marker.id, code: 'empty-text' });
    if (marker.end_s != null && marker.end_s <= marker.start_s) {
      errors.push({ id: marker.id, code: 'invalid-range' });
    }
  }

  if (preventCaptionOverlap) {
    const captions = markers
      .filter((marker) => marker.kind === MARKER_KINDS.CAPTION && isRangeMarker(marker))
      .sort((a, b) => a.start_s - b.start_s);
    for (let index = 0; index < captions.length - 1; index += 1) {
      if (captions[index].end_s > captions[index + 1].start_s + 0.001) {
        errors.push({
          id: captions[index + 1].id,
          code: 'caption-overlap',
          with: captions[index].id,
        });
      }
    }
  }

  return errors;
}

export function toLegacyComment(marker, projectId) {
  return {
    project_uuid: projectId,
    ptime: marker.start_s,
    user_name: marker.author_name,
    text: marker.text,
  };
}

export function fromLegacyComment(comment, duration = Infinity) {
  return normalizeMarker({
    id: comment.id,
    asset_id: comment.project_uuid ?? comment.project_id,
    kind: MARKER_KINDS.COMMENT,
    start_s: comment.ptime,
    text: comment.text,
    author_name: comment.user_name,
    created_at: comment.created_at,
  }, duration);
}
