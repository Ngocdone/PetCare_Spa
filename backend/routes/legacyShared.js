/**
 * Tiện ích dùng chung cho route legacy: MD5 (token), đọc cookie thủ công.
 */
const crypto = require('crypto');

function md5(s) {
  return crypto.createHash('md5').update(String(s), 'utf8').digest('hex');
}

function cookieGet(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return '';
  for (const p of raw.split(';')) {
    const i = p.indexOf('=');
    if (i === -1) continue;
    const k = p.slice(0, i).trim();
    const v = p.slice(i + 1).trim();
    if (k === name) {
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
  }
  return '';
}

module.exports = { md5, cookieGet };
