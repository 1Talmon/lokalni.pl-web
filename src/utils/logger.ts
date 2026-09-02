/* eslint-disable no-console */
const isDev = process.env.NODE_ENV === 'development';

type LogArgs = unknown[];

const format = (level: string, msg: string) => `[MyLokalni:${level}] ${msg}`;

export const logger = {
    error: (msg: string, ...args: LogArgs): void => {
        console.error(format('ERROR', msg), ...args);
        // TODO: replace with Sentry.captureException when available
    },
    warn: (msg: string, ...args: LogArgs): void => {
        if (isDev) console.warn(format('WARN', msg), ...args);
    },
    info: (msg: string, ...args: LogArgs): void => {
        if (isDev) console.info(format('INFO', msg), ...args);
    },
    debug: (msg: string, ...args: LogArgs): void => {
        if (isDev) console.log(format('DEBUG', msg), ...args);
    },
};
