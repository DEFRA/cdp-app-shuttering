#!/usr/bin/env node

import { Command } from 'commander'
import fs from 'node:fs'
import path from 'node:path'
import { logger } from './logger.js'
import {
  runCommand,
  runCommandWithOutput,
  verifyFile,
  isPlaywrightInstalled,
  ensureCorrectDirectory
} from './test-utils.js'

const program = new Command()

program
  .name('test-workflow')
  .description(
    'Test the complete shuttering page workflow locally or simulate CI'
  )
  .version('1.0.0')
  .option('-s, --service <name>', 'Service name to test with', 'test-service')
  .option('--ci', 'Run in CI mode - detect changed files from git')
  .option(
    '-b, --base-branch <branch>',
    'Base branch to compare against (CI mode only)',
    'origin/main'
  )
  .option('--skip-cleanup', 'Skip cleanup of test files at the end')
  .option(
    '--skip-screenshot',
    'Skip screenshot generation (requires Playwright)'
  )
  .option('--open-browser', 'Open the generated HTML in browser')
  .action(async (options) => {
    if (options.ci) {
      await runCiWorkflow(options)
    } else {
      await runStandaloneWorkflow(options)
    }
  })

/**
 * Standalone workflow - creates a test service and runs through all steps
 */
async function runStandaloneWorkflow(options) {
  const { service, skipCleanup, skipScreenshot, openBrowser } = options
  const startTime = Date.now()
  const results = {
    steps: [],
    passed: 0,
    failed: 0
  }

  function recordStep(name, success) {
    results.steps.push({ name, success })
    if (success) {
      results.passed++
    } else {
      results.failed++
    }
  }

  logger.box(`Testing Shuttering Page Workflow\nService: ${service}`)

  try {
    // Step 0: Check prerequisites
    logger.info('\n Checking prerequisites...')
    ensureCorrectDirectory()

    const hasPlaywright = isPlaywrightInstalled()
    if (!hasPlaywright && !skipScreenshot) {
      logger.warn('Playwright not found. Run: npx playwright install chromium')
      logger.warn('Skipping screenshot steps...')
    }

    // Step 1: Clean previous build
    logger.info('\n Step 1: Cleaning previous build...')
    runCommand('npm run clean', 'Clean build directory', { allowFailure: true })
    recordStep('Clean build directory', true)

    // Step 2: Create test service
    logger.info('\n Step 2: Creating test service...')
    const serviceFolder = path.resolve(`../tenants/${service}`)

    if (fs.existsSync(serviceFolder)) {
      logger.warn(`Service folder already exists: ${serviceFolder}`)
      logger.info('Removing existing folder...')
      fs.rmSync(serviceFolder, { recursive: true })
    }

    runCommand(
      `npm run create:content -- --service=${service}`,
      'Create service content'
    )
    recordStep(
      'Create service content',
      verifyFile(`../tenants/${service}/content.njk`, 'Content template')
    )

    // Step 3: Build the shuttering page (production mode)
    logger.info('\n Step 3: Building shuttering page (production)...')
    runCommand(
      `npm run build:prod -- --service=${service}`,
      'Build production HTML'
    )

    const buildSuccess =
      verifyFile('.dist/index.html', 'Built HTML') &&
      verifyFile('.dist/assets', 'Assets directory')
    recordStep('Build production HTML', buildSuccess)

    // Step 4: Validate HTML
    logger.info('\n Step 4: Validating HTML...')
    try {
      runCommand(
        `npm run validate:html -- --service=${service}`,
        'Validate HTML'
      )
      verifyFile('.dist/validation-results.json', 'Validation results')
      recordStep('Validate HTML', true)
    } catch (error) {
      logger.warn('HTML validation had issues (see above)')
      recordStep('Validate HTML', false)
    }

    // Step 5: Generate validation comment
    logger.info('\n Step 5: Generating validation comment...')
    try {
      runCommand(
        'npm run post:validation-comment',
        'Generate validation comment'
      )
      verifyFile('.dist/validation-comment.md', 'Validation comment')
      recordStep('Generate validation comment', true)
    } catch (error) {
      logger.warn('Failed to generate validation comment')
      recordStep('Generate validation comment', false)
    }

    // Step 6: Generate screenshot (if Playwright is available)
    if (!skipScreenshot && hasPlaywright) {
      logger.info('\n Step 6: Generating screenshot...')
      try {
        runCommand(
          `npm run generate:screenshot -- --service=${service}`,
          'Generate screenshot'
        )
        verifyFile(`.dist/screenshots/${service}.png`, 'Screenshot')
        verifyFile('.dist/screenshot-results.json', 'Screenshot results')
        recordStep('Generate screenshot', true)
      } catch (error) {
        logger.warn('Screenshot generation failed')
        recordStep('Generate screenshot', false)
      }
    } else {
      logger.info(
        '\n Step 6: Skipping screenshot (Playwright not available or --skip-screenshot)'
      )
    }

    // Step 8: Open in browser (optional)
    if (openBrowser) {
      logger.info('\n Opening in browser...')
      const htmlPath = path.resolve('.dist/index.html')
      if (fs.existsSync(htmlPath)) {
        const open = (await import('open')).default
        await open(htmlPath)
        logger.info('Opened in default browser')
      }
    }

    // Step 9: Verify all output files
    logger.info('\n Step 8: Verifying output files...')
    logger.info('Expected files in .dist/:')
    const expectedFiles = [
      ['.dist/index.html', 'Built shuttering page'],
      ['.dist/validation-results.json', 'Validation results'],
      ['.dist/validation-comment.md', 'Validation comment']
    ]

    if (!skipScreenshot && hasPlaywright) {
      expectedFiles.push(
        [`.dist/screenshots/${service}.png`, 'Screenshot'],
        ['.dist/screenshot-results.json', 'Screenshot results']
      )
    }

    for (const [file, desc] of expectedFiles) {
      verifyFile(file, desc)
    }

    // Cleanup
    if (!skipCleanup) {
      logger.info('\n Step 9: Cleaning up test files...')
      if (fs.existsSync(serviceFolder)) {
        fs.rmSync(serviceFolder, { recursive: true })
        logger.info(`Removed: ${serviceFolder}`)
      }
      runCommand('npm run clean', 'Clean build directory', {
        allowFailure: true
      })
      recordStep('Cleanup', true)
    } else {
      logger.info('\n Skipping cleanup (--skip-cleanup)')
      logger.info(`Service folder: ${serviceFolder}`)
      logger.info(`Build output: ${path.resolve('.dist')}`)
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    logger.box(
      `Workflow Test Complete\n` +
        `Duration: ${duration}s\n` +
        `Passed: ${results.passed}/${results.steps.length}\n` +
        `Failed: ${results.failed}/${results.steps.length}`
    )

    if (results.failed > 0) {
      logger.warn('\nFailed steps:')
      results.steps
        .filter((s) => !s.success)
        .forEach((s) => logger.error(`  - ${s.name}`))
      process.exit(1)
    } else {
      logger.success('\n All workflow steps completed successfully!')
    }
  } catch (error) {
    logger.error(`\n Workflow test failed: ${error.message}`)
    process.exit(1)
  }
}

/**
 * CI workflow - detects changed files from git and validates them
 */
async function runCiWorkflow(options) {
  const { baseBranch, skipScreenshot } = options
  const startTime = Date.now()

  logger.box('Testing CI Workflow: Validate Shuttering Pages')
  ensureCorrectDirectory()

  try {
    // Step 1: Detect changed files
    logger.info('\n Step 1: Detecting changed content files...')
    const detectResult = runCommandWithOutput(
      `npm run detect:changes -- --base-branch=${baseBranch}`,
      'Detect changes'
    )

    let services = []

    if (detectResult.success) {
      logger.info(detectResult.output)

      // Extract service names from the JSON output
      const jsonMatch = detectResult.output.match(
        /\{"services":\[([^\]]*)\],"count":\d+\}/
      )
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          services = parsed.services || []
        } catch (e) {
          logger.warn('Could not parse JSON output, trying alternative parsing')
        }
      }

      if (services.length === 0) {
        // Try alternative parsing
        const serviceMatches = detectResult.output.match(
          /Services to build: ([^\n]+)/
        )
        if (serviceMatches) {
          services = serviceMatches[1].split(', ').map((s) => s.trim())
        }
      }
    } else {
      // Check if it's just "no changes" (exit code 0 with warning)
      if (
        detectResult.output.includes('No content.njk files changed') ||
        detectResult.stderr?.includes('No content.njk files changed')
      ) {
        logger.success('No content.njk files changed - skipping validation')
        process.exit(0)
      }
      logger.error('Detection failed')
      logger.info(detectResult.output)
      logger.info(detectResult.stderr)
      process.exit(1)
    }

    if (services.length === 0) {
      logger.success('No services to validate')
      process.exit(0)
    }

    logger.info(`\nServices to validate: ${services.join(', ')}`)

    // Step 2 & 3: Build and validate each service
    for (const service of services) {
      logger.box(`Building service: ${service}`)

      runCommand(
        `npm run build:prod -- --service=${service}`,
        `Build ${service}`
      )

      logger.box(`Validating HTML for: ${service}`)

      try {
        runCommand(
          `npm run validate:html -- --service=${service}`,
          `Validate ${service}`
        )
      } catch (error) {
        logger.error(`HTML validation failed for ${service}`)
        process.exit(1)
      }
    }

    // Step 4: Generate validation comment
    logger.box('Generating validation comment')

    runCommand('npm run post:validation-comment', 'Generate validation comment')

    const validationCommentPath = path.resolve('.dist/validation-comment.md')
    if (fs.existsSync(validationCommentPath)) {
      logger.info('\nComment preview:')
      const comment = fs.readFileSync(validationCommentPath, 'utf-8')
      logger.info(comment)
    }

    // Step 5: Generate screenshots (if not skipped)
    if (!skipScreenshot) {
      logger.box('Generating screenshots')

      for (const service of services) {
        try {
          runCommand(
            `npm run generate:screenshot -- --service=${service}`,
            `Screenshot ${service}`
          )
        } catch (error) {
          logger.warn(`Screenshot generation failed for ${service}`)
        }
      }
    } else {
      logger.info('\nSkipping screenshot generation (--skip-screenshot)')
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    logger.box(`ALL TESTS PASSED!\nDuration: ${duration}s`)

    logger.info('\nGenerated files:')
    const files = [
      '.dist/validation-results.json',
      '.dist/validation-comment.md'
    ]

    if (!skipScreenshot) {
      files.push('.dist/screenshot-results.json', '.dist/screenshots/*.png')
    }

    for (const file of files) {
      logger.info(`  - ${file}`)
    }

    logger.info('\nYou can now review the generated comments and screenshots.')
  } catch (error) {
    logger.error(`\nCI workflow test failed: ${error.message}`)
    process.exit(1)
  }
}

program.parse()
