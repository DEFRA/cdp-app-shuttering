import { createConsola } from 'consola'

const info = 3
/**
 * Shared logger instance for all scripts
 */
export const logger = createConsola({
  level: process.env.LOG_LEVEL || info,
  fancy: true,
  formatOptions: {
    colors: true,
    compact: false,
    date: false
  }
})
