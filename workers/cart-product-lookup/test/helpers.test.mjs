import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCoupangProductId,
  isCoupangUrl,
  makeCoupangSignedDate,
  toCoupangProductUrl,
} from '../src/helpers.mjs';

test('accepts Coupang and Coupang Partners links only', () => {
  assert.equal(isCoupangUrl('https://link.coupang.com/a/abc123'), true);
  assert.equal(isCoupangUrl('https://www.coupang.com/vp/products/5525962778'), true);
  assert.equal(isCoupangUrl('https://not-coupang.com/vp/products/5525962778'), false);
  assert.equal(isCoupangUrl('javascript:alert(1)'), false);
});

test('extracts and normalizes a product URL without tracking parameters', () => {
  const input = 'https://www.coupang.com/vp/products/5525962778?itemId=8657163829&vendorItemId=74031112860&traceid=abc';

  assert.equal(getCoupangProductId(input), '5525962778');
  assert.equal(
    toCoupangProductUrl(input),
    'https://www.coupang.com/vp/products/5525962778?itemId=8657163829&vendorItemId=74031112860',
  );
});

test('creates the signed timestamp format expected by the Partner API', () => {
  assert.equal(makeCoupangSignedDate(new Date('2026-08-24T01:02:03.456Z')), '20260824T010203Z');
});
