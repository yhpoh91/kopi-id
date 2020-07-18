import assert from 'assert';

const wrapAsync = (runnable) => async () => {
  let rejected = false;
  let rejectError = null;
  try {
    await runnable();
  } catch (error) {
    if (error.name === 'AssertionError') {
      throw error;
    }

    rejected = true;
    rejectError = error;
  }

  const errorMessage = (rejectError || {}).message || 'No error message';
  const message = `Promise Rejected - ${errorMessage}`;
  assert.equal(rejected, false, message);
};

const itAsync = (message, asyncRunnable) => it(message, wrapAsync(asyncRunnable));

export default itAsync;
