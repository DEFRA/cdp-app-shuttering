import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from './logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Posts validation results as a GitHub PR comment
 * Reads validation results from .dist/validation-results.json
 * Outputs markdown for GitHub Actions to post
 */

const distDir = path.join(__dirname, '..', '.dist')
const validationResultsPath = path.join(distDir, 'validation-results.json')

if (!fs.existsSync(validationResultsPath)) {
  logger.error(
    `Error: validation-results.json not found at: ${validationResultsPath}`
  )
  logger.warn(
    'Run validation first: npm run validate:html -- --service=<service>'
  )
  process.exit(1)
}

try {
  const validationResults = JSON.parse(
    fs.readFileSync(validationResultsPath, 'utf8')
  )

  const allValid = validationResults.allValid
  const icon = allValid ? '✅' : '❌'
  const status = allValid
    ? 'All shuttering pages passed validation!'
    : 'Some shuttering pages have validation errors'

  let resultsMarkdown = ''

  for (const result of validationResults.results) {
    const serviceIcon = result.valid ? '✅' : '❌'
    resultsMarkdown += `### ${serviceIcon} ${result.service}\n\n`

    if (result.valid) {
      resultsMarkdown += 'HTML validation passed - no errors found\n\n'
    } else if (result.error) {
      resultsMarkdown += `**Error:** ${result.error}\n\n`
    } else {
      resultsMarkdown += `**${result.errorCount} validation error${result.errorCount > 1 ? 's' : ''} found:**\n\n`

      for (const err of result.errors.slice(0, 10)) {
        resultsMarkdown += `- Line ${err.line}:${err.column} - ${err.message} (\`${err.ruleId}\`)\n`
      }

      if (result.errors.length > 10) {
        resultsMarkdown += `\n... and ${result.errors.length - 10} more errors\n`
      }

      resultsMarkdown += '\n'
    }
  }

  const commentBody = `## ${icon} Shuttering Page Validation

**Status:** ${status}

${resultsMarkdown}

${allValid ? 'All pages are ready for preview below.' : 'Please fix validation errors before merging.'}`

  // Write comment to file for GitHub Actions
  const commentPath = path.join(distDir, 'validation-comment.md')
  fs.writeFileSync(commentPath, commentBody)
  logger.success(`\n Comment markdown written to: ${commentPath}`)

  // Also output to stdout for debugging
  logger.info('\n=== COMMENT PREVIEW ===')
  logger.info(commentBody)
  logger.info('=== END PREVIEW ===\n')

  // Exit with error if validation failed
  if (!allValid) {
    process.exit(1)
  }
} catch (error) {
  logger.error(`Error reading validation results: ${error.message}`)
  process.exit(1)
}
