import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from './logger.js'
import { chromium } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Generates screenshots of built HTML files
 * Accepts a list of service names to screenshot
 */

const args = process.argv.slice(2)

// Parse service names and output directory from arguments
const services = args
  .filter((arg) => arg.startsWith('--service='))
  .map((arg) => arg.split('=')[1])

const outputDirArg = args.find((arg) => arg.startsWith('--output='))
const outputDir = outputDirArg
  ? path.resolve(outputDirArg.split('=')[1])
  : path.join(__dirname, '..', '.dist', 'screenshots')

if (services.length === 0) {
  logger.error('Error: Please provide at least one service name')
  logger.info(
    'Usage: npm run generate:screenshot -- --service=service1 --service=service2 [--output=./screenshots]'
  )
  process.exit(1)
}

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true })

const distDir = path.join(__dirname, '..', '.dist')
const results = []

logger.info(`Generating screenshots for ${services.length} service(s)...\n`)

// Launch browser once for all screenshots
let browser

async function generateScreenshots() {
  try {
    browser = await chromium.launch()

    for (const service of services) {
      logger.info(`Generating screenshot for: ${service}`)

      const htmlFile = path.join(distDir, 'index.html')
      const screenshotFile = path.join(outputDir, `${service}.png`)

      if (!fs.existsSync(htmlFile)) {
        logger.error(`✗ HTML file not found: ${htmlFile}`)
        results.push({
          service,
          success: false,
          error: 'HTML file not found',
          path: null
        })
        continue
      }

      try {
        const page = await browser.newPage({
          viewport: { width: 1280, height: 720 }
        })

        // Navigate to the HTML file
        await page.goto(`file://${htmlFile}`, { waitUntil: 'networkidle' })

        // Take screenshot
        await page.screenshot({
          path: screenshotFile,
          fullPage: true
        })

        await page.close()

        logger.success(
          ` Screenshot saved: ${path.relative(process.cwd(), screenshotFile)}`
        )

        results.push({
          service,
          success: true,
          path: screenshotFile
        })
      } catch (error) {
        logger.error(
          `✗ Error generating screenshot for ${service}: ${error.message}`
        )
        results.push({
          service,
          success: false,
          error: error.message,
          path: null
        })
      }
    }
  } catch (error) {
    logger.error(`Error launching browser: ${error.message}`)
    process.exit(1)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  // Output summary
  logger.info('\n=== Screenshot Generation Summary ===')
  logger.info(
    `Total services: ${services.length}, Success: ${results.filter((r) => r.success).length}, Failed: ${results.filter((r) => !r.success).length}`
  )
  logger.info(`\nScreenshots saved to: ${outputDir}`)

  // Write results to file for GitHub Actions to consume
  const outputFile = path.join(distDir, 'screenshot-results.json')
  fs.writeFileSync(outputFile, JSON.stringify({ results }, null, 2))
  logger.info(`Results written to: ${outputFile}`)

  // Output JSON summary to stdout for easy parsing
  logger.info('\n--- JSON OUTPUT START ---')
  logger.info(JSON.stringify({ results }))
  logger.info('--- JSON OUTPUT END ---')

  const allSuccess = results.every((r) => r.success)
  if (!allSuccess) {
    process.exit(1)
  }

  logger.success('\n All screenshots generated successfully!')
}

generateScreenshots().catch((error) => {
  logger.error(`Fatal error: ${error}`)
  process.exit(1)
})
