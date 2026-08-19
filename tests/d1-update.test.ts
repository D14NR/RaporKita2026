import test from 'node:test';
import assert from 'node:assert/strict';

import { findMatchingRowForUpdate } from '../src/lib/d1.ts';

test('findMatchingRowForUpdate resolves records by filter when id is not provided', () => {
  const rows = [
    { id: 'abc-123', nis: '60-444-001-6', nama_lengkap: 'Budi' },
    { id: 'def-456', nis: '60-444-002-6', nama_lengkap: 'Ani' }
  ];

  const match = findMatchingRowForUpdate(rows, [
    { column: 'nis', op: 'eq', value: '60-444-001-6' }
  ], null);

  assert.ok(match);
  assert.equal(match.id, 'abc-123');
});

test('findMatchingRowForUpdate prefers explicit id when available', () => {
  const rows = [
    { id: 'abc-123', nis: '60-444-001-6', nama_lengkap: 'Budi' },
    { id: 'def-456', nis: '60-444-001-6', nama_lengkap: 'Budi Baru' }
  ];

  const match = findMatchingRowForUpdate(rows, [
    { column: 'nis', op: 'eq', value: '60-444-001-6' }
  ], 'def-456');

  assert.ok(match);
  assert.equal(match.id, 'def-456');
});
