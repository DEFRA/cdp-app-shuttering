import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { logger } from './logger.js'

/**
 * Runs a command and returns the result
 */
export function runCommand(command, description, options = {}) {
  logger.info(`\n${description}...`)
  logger.box(command)

  try {
    const output = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: process.cwd(),
      encoding: 'utf-8'
    })
    logger.success(`${description} - completed`)
    return { success: true, output }
  } catch (error) {
    if (options.allowFailure) {
      logger.warn(`${description} - failed (continuing)`)
      return { success: false, error, output: error.stdout || '' }
    }
    logger.error(`${description} - failed`)
    throw error
  }
}

/**
 * Runs a command and captures output (silent mode)
 */
export function runCommandWithOutput(command, description) {
  logger.info(`\n${description}...`)
  logger.box(command)

  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
    logger.success(`${description} - completed`)
    return { success: true, output }
  } catch (error) {
    return {
      success: false,
      output: error.stdout || '',
      stderr: error.stderr || '',
      error
    }
  }
}

/**
 * Checks if a file exists and logs the result
 */
export function verifyFile(filePath, description) {
  const absolutePath = path.resolve(filePath)
  const exists = fs.existsSync(absolutePath)

  if (exists) {
    const stats = fs.statSync(absolutePath)
    logger.success(
      ` ${description}: ${absolutePath} (${formatBytes(stats.size)})`
    )
  } else {
    logger.error(`✗ ${description}: ${absolutePath} NOT FOUND`)
  }

  return exists
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Check if Playwright is installed
 */
export function isPlaywrightInstalled() {
  try {
    execSync('npx playwright --version', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Ensure we are in the right directory
 */
export function ensureCorrectDirectory() {
  if (!fs.existsSync('package.json')) {
    logger.error('Must be run from cdp-app-shuttering-template directory')
    process.exit(1)
  }
}
