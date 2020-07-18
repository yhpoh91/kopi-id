import assert from 'assert';

import itAsync from './asyncTest';
import flowUtils from '../services/flowUtils';

describe('Flow Utils', () => {
  itAsync('should get Authorization Code Flow', async () => {
    const actual = flowUtils.getFlowType(['code']);
    const expected = 'authorization_code';

    assert.equal(actual, expected);
  });
  
  itAsync('should get Implicit Flow 1', async () => {
    const actual = flowUtils.getFlowType(['id_token']);
    const expected = 'implicit';

    assert.equal(actual, expected);
  });
  
  itAsync('should get Implicit Flow 2', async () => {
    const actual = flowUtils.getFlowType(['id_token', 'token']);
    const expected = 'implicit';

    assert.equal(actual, expected);
  });
  
  itAsync('should get Implicit Flow 3', async () => {
    const actual = flowUtils.getFlowType(['token', 'id_token']);
    const expected = 'implicit';

    assert.equal(actual, expected);
  });
  
  itAsync('should get Hybrid Flow 1', async () => {
    const actual = flowUtils.getFlowType(['code', 'id_token']);
    const expected = 'hybrid';

    assert.equal(actual, expected);
  });
  
  itAsync('should get Hybrid Flow 2', async () => {
    const actual = flowUtils.getFlowType(['code', 'token']);
    const expected = 'hybrid';

    assert.equal(actual, expected);
  });
  
  itAsync('should get Hybrid Flow 3', async () => {
    const actual = flowUtils.getFlowType(['token']);
    const expected = 'hybrid';

    assert.equal(actual, expected);
  });
  
  itAsync('should get Hybrid Flow 4', async () => {
    const actual = flowUtils.getFlowType(['code', 'id_token', 'token']);
    const expected = 'hybrid';

    assert.equal(actual, expected);
  });
});
