import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MARKER_KINDS,
  fromLegacyComment,
  isRangeMarker,
  markerAtTime,
  normalizeMarker,
  toLegacyComment,
  validateMarkerSet,
} from './markerModel.js';

test('normalizes a legacy point comment without inventing a range', () => {
  const marker = fromLegacyComment({
    id: 12,
    project_uuid: 'project-1',
    ptime: '8.25',
    text: 'Trim this pause',
    user_name: 'Director',
    created_at: '2026-06-11T00:00:00Z',
  });

  assert.equal(marker.id, '12');
  assert.equal(marker.kind, MARKER_KINDS.COMMENT);
  assert.equal(marker.start_s, 8.25);
  assert.equal(marker.end_s, null);
  assert.equal(isRangeMarker(marker), false);
});

test('clamps ranges to the asset duration and keeps minimum length', () => {
  const marker = normalizeMarker({
    id: 'caption-1',
    kind: MARKER_KINDS.CAPTION,
    start_s: 9.9,
    end_s: 20,
    text: 'Caption',
  }, 10);

  assert.equal(marker.start_s, 9.9);
  assert.equal(marker.end_s, 10);
  assert.equal(isRangeMarker(marker), true);
});

test('detects overlapping caption ranges but permits instruction overlap', () => {
  const markers = [
    normalizeMarker({ id: 'a', kind: 'caption', start_s: 1, end_s: 4, text: 'A' }),
    normalizeMarker({ id: 'b', kind: 'caption', start_s: 3.5, end_s: 6, text: 'B' }),
    normalizeMarker({ id: 'c', kind: 'instruction', start_s: 2, end_s: 5, text: 'Instruction' }),
  ];

  assert.deepEqual(validateMarkerSet(markers), [
    { id: 'b', code: 'caption-overlap', with: 'a' },
  ]);
});

test('matches points with tolerance and ranges inclusively', () => {
  const point = normalizeMarker({ id: 'p', start_s: 4, text: 'Point' });
  const range = normalizeMarker({ id: 'r', kind: 'caption', start_s: 4, end_s: 6, text: 'Range' });

  assert.equal(markerAtTime(point, 4.3), true);
  assert.equal(markerAtTime(point, 4.5), false);
  assert.equal(markerAtTime(range, 6), true);
  assert.equal(markerAtTime(range, 6.1), false);
});

test('exports compatible legacy comment fields', () => {
  const marker = normalizeMarker({
    id: 'p',
    start_s: 12.5,
    text: 'Check this',
    author_name: 'Reviewer',
  });

  assert.deepEqual(toLegacyComment(marker, 'project-2'), {
    project_uuid: 'project-2',
    ptime: 12.5,
    user_name: 'Reviewer',
    text: 'Check this',
  });
});
