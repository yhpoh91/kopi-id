import crypto from 'crypto';

const hash = (plaintext, hashAlgorithm) => {
  const hasher = crypto.createHash(hashAlgorithm);
  hasher.update(plaintext);
  return hasher.copy().digest();
};

export default {
  hash,
}