import { describe, expect, it } from 'vitest';
import { formatDate } from '../../../src/ui/RecordsScreen';

describe('formatDate', () => {
  it('muestra las fechas en formato DD/MM/AAAA', () => {
    expect(formatDate('2026-10-01')).toBe('01/10/2026');
  });
});
