import { configure, getLogger } from 'log4js';

const buildLog = (logger, logLevel = 'info') => {
  const appenders = {
    out: {
      type: 'stdout',
    },
  };
  
  const logConfig = {
    appenders,
    categories: {
      default: {
        appenders: Object.keys(appenders),
        level: logLevel,
      },
    },
  };

  configure(logConfig);
  return {
    L: getLogger(logger),
  };
};

export default buildLog;
