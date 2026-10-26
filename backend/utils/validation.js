const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const isValidEmail = (email = '') => {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return false;
  if (normalized.includes('..')) return false;

  const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;
  return emailPattern.test(normalized);
};

const isGmailAddress = (email = '') => {
  const normalized = normalizeEmail(email);
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:gmail\.com|googlemail\.com)$/i.test(normalized);
};

const generatePasswordResetToken = () => {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${rand}${time}`;
};

const isStrongPassword = (password = '') => {
  const value = String(password);
  return value.length >= 6;
};

module.exports = {
  normalizeEmail,
  isValidEmail,
  isGmailAddress,
  generatePasswordResetToken,
  isStrongPassword,
};
