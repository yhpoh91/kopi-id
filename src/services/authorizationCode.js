import crypto from 'crypto';

const generateCode = (codeLength) => {
  const byteLength = Math.floor(codeLength / 2);
  const bytes = crypto.randomBytes(byteLength);
  const hex = bytes.toString('hex');
  return hex;
}

export default {
  generateCode,
};
