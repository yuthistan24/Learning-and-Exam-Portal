const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = {
  info: (message, data = '') => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data);
  },
  error: (message, error = '') => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  },
  warn: (message, data = '') => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data);
  },
  debug: (message, data = '') => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data);
    }
  }
};

module.exports = { logger };
