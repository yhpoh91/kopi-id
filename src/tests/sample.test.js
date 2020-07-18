import assert from 'assert';

import itAsync from './asyncTest';

describe('Sample', () => {
  itAsync('should pass', async () => {
    const actual = 1 + 1;
    const expected = 2;
    assert.equal(actual, expected);
  });
});
