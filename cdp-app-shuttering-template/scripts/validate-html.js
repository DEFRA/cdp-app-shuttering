import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from './logger.js'
import { HtmlValidate } from 'html-validate'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Validates HTML files in .dist directory
 * Accepts a list of service names to validate
 */

const args = process.argv.slice(2)

// Parse service names from arguments
const services = args
  .filter((arg) => arg.startsWith('--service='))
  .map((arg) => arg.split('=')[1])

if (services.length === 0) {
  logger.error('Error: Please provide at least one service name')
  logger.info(
    'Usage: npm run validate:html -- --service=service1 --service=service2'
  )
  process.exit(1)
}

// Configure HTML validator
const htmlvalidate = new HtmlValidate({
  extends: ['html-validate:recommended'],
  rules: {
    // Customize rules for GOV.UK Frontend compatibility
    'require-sri': 'off',
    'no-inline-style': 'off',
    'attribute-boolean-style': 'off',
    'no-trailing-whitespace': 'off'
  }
})

const distDir = path.join(__dirname, '..', '.dist')
const results = []
let allValid = true

logger.info(`Validating HTML for ${services.length} service(s)...\n`)

async function validateServices() {
  for (const service of services) {
    logger.info(`Validating: ${service}`)

    const htmlFile = path.join(distDir, 'index.html')

    if (!fs.existsSync(htmlFile)) {
      logger.error(`✗ HTML file not found: ${htmlFile}`)
      results.push({
        service,
        valid: false,
        error: 'HTML file not generated',
        errors: []
      })
      allValid = false
      continue
    }

    try {
      const htmlContent = fs.readFileSync(htmlFile, 'utf-8')
      const report = await htmlvalidate.validateString(htmlContent)

      if (report.valid) {
        logger.success(` HTML validation passed for ${service}`)
        results.push({
          service,
          valid: true,
          errors: []
        })
      } else {
        const errorCount = report.errorCount
        logger.error(
          `✗ HTML validation failed for ${service} (${errorCount} error${errorCount > 1 ? 's' : ''})`
        )

        const errors = report.results
          .flatMap((result) =>
            result.messages.map((msg) => ({
              line: msg.line,
              column: msg.column,
              message: msg.message,
              ruleId: msg.ruleId,
              severity: msg.severity
            }))
          )
          .filter((msg) => msg.severity === 2) // Only errors, not warnings

        // Log errors to console
        errors.forEach((err) => {
          logger.error(
            `  Line ${err.line}:${err.column} - ${err.message} (${err.ruleId})`
          )
        })

        results.push({
          service,
          valid: false,
          errorCount,
          errors
        })
        allValid = false
      }
    } catch (error) {
      logger.error(`✗ Error validating ${service}: ${error.message}`)
      results.push({
        service,
        valid: false,
        error: error.message,
        errors: []
      })
      allValid = false
    }

    logger.info('') // Empty line for readability
  }

  // Output summary
  logger.info('\n=== Validation Summary ===')
  logger.info(
    `Total services: ${services.length}, Passed: ${results.filter((r) => r.valid).length}, Failed: ${results.filter((r) => !r.valid).length}`
  )

  // Write results to file for GitHub Actions to consume
  const outputFile = path.join(
    __dirname,
    '..',
    '.dist',
    'validation-results.json'
  )
  fs.writeFileSync(outputFile, JSON.stringify({ allValid, results }, null, 2))
  logger.info(`\nResults written to: ${outputFile}`)

  // Output JSON summary to stdout for easy parsing
  logger.info('\n--- JSON OUTPUT START ---')
  logger.info(JSON.stringify({ allValid, results }))
  logger.info('--- JSON OUTPUT END ---')

  // Exit with error code if validation failed
  if (!allValid) {
    process.exit(1)
  }

  logger.success('\n All HTML files are valid!')
}

// Run validation
validateServices().catch((error) => {
  logger.error(`Fatal error: ${error}`)
  process.exit(1)
})
