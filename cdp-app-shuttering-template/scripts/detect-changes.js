import { execSync } from 'child_process'
import { logger } from './logger.js'

/**
 * Detects changed and new content.njk files in tenants/ directory
 * Compares against the base branch to find modified or added files
 * Outputs a JSON list of services with changes
 *
 * Ran from .github/workflows/check-pull-request.yml
 */

const args = process.argv.slice(2)
const baseBranchArg = args.find((arg) => arg.startsWith('--base-branch='))
const baseBranch = baseBranchArg ? baseBranchArg.split('=')[1] : 'origin/main'

logger.info(
  `Detecting changed/new content.njk files in tenants/ against ${baseBranch}...`
)

try {
  // Get list of changed AND new files in tenants/*/content.njk
  // Using --diff-filter=AM to include Added and Modified files
  const diffCommand = `git diff --name-only --diff-filter=AM ${baseBranch}...HEAD -- '../tenants/*/content.njk'`
  const changedFiles = execSync(diffCommand, { encoding: 'utf-8' }).trim()

  if (!changedFiles) {
    logger.warn('No content.njk files changed or added')
    process.exit(0)
  }

  logger.success('Changed/new files:')
  logger.log(changedFiles)

  // Extract service names from paths (tenants/<service-name>/content.njk)
  const services = changedFiles
    .split('\n')
    .map((file) => {
      const match = file.match(/tenants\/([^/]+)\/content\.njk/)
      return match ? match[1] : null
    })
    .filter(Boolean)

  if (services.length === 0) {
    logger.warn('No valid service names extracted')
    process.exit(0)
  }

  logger.success(`Services to build: ${services.join(', ')}`)

  // Output as JSON for easy parsing
  logger.log(JSON.stringify({ services, count: services.length }))
} catch (error) {
  logger.error('Error detecting changes:', error.message)
  process.exit(1)
}
