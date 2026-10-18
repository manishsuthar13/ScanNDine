const stamp = () => new Date().toISOString();

const write = (level, message, meta) => {
  const line = `${stamp()} [${level}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`;
  (level === 'error' ? console.error : console.log)(line);
};

// Minimal leveled logger; silenced under test so suites stay readable
const quiet = () => process.env.NODE_ENV === 'test';

module.exports = {
  info: (message, meta) => !quiet() && write('info', message, meta),
  warn: (message, meta) => !quiet() && write('warn', message, meta),
  error: (message, meta) => !quiet() && write('error', message, meta),
};
