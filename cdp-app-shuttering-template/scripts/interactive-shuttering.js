#!/usr/bin/env node

import { Command } from 'commander'
import inquirer from 'inquirer'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import open from 'open'
import { logger } from './logger.js'

const program = new Command()

program
  .name('interactive-shuttering')
  .description('Interactive CLI for creating CDP shuttering pages')
  .version('1.0.0')
  .action(async () => {
    await runInteractiveCli()
  })

async function runInteractiveCli() {
  try {
    // Step 1: Ask for service name
    const { serviceName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'serviceName',
        message: 'What is your service name?',
        validate: (input) => {
          if (!input || input.trim() === '') {
            return 'Service name cannot be empty'
          }
          if (!/^[a-z0-9-]+$/.test(input)) {
            return 'Service name can only contain lowercase letters, numbers, and hyphens'
          }
          return true
        }
      }
    ])

    logger.info(`\nCreating folder structure for service: ${serviceName}`)

    // Step 2: Create folder and copy content.njk
    const serviceFolder = path.resolve(`../tenants/${serviceName}`)
    const templateFolder = path.resolve('src/templates/common')

    if (!fs.existsSync(serviceFolder)) {
      fs.mkdirSync(serviceFolder, { recursive: true })
      logger.info(`Created folder: ${serviceFolder}`)
    }

    // Copy content.njk
    const sourceFile = path.join(templateFolder, 'content.njk')
    const destFile = path.join(serviceFolder, 'content.njk')
    fs.copyFileSync(sourceFile, destFile)
    logger.info(`Copied content.njk to ${destFile}`)

    // Step 3: Prompt user to edit the file
    logger.info(`\nPlease edit the content.njk file at:\n  ${destFile}\n`)
    const { readyToBuild } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'readyToBuild',
        message: 'Are you ready to build the HTML?',
        default: false
      }
    ])

    if (!readyToBuild) {
      logger.info('Please edit the content.njk file and run this script again.')
      process.exit(0)
    }

    // Build and preview loop
    let satisfied = false
    while (!satisfied) {
      // Step 4: Build the HTML
      logger.info('Building HTML...')
      try {
        execSync(`npm run build:dev -- --service=${serviceName}`, {
          stdio: 'inherit',
          cwd: process.cwd()
        })
        logger.info('Build complete!')
      } catch (error) {
        logger.error(`Build failed: ${error.message}`)
        process.exit(1)
      }

      // Step 5: Open in browser
      const htmlPath = path.resolve('.dist/index.html')
      if (fs.existsSync(htmlPath)) {
        logger.info(`Opening ${htmlPath} in browser...`)
        await open(htmlPath)
      } else {
        logger.error('HTML file not found at .dist/index.html')
        process.exit(1)
      }

      // Step 6: Ask if they're happy
      const { isHappy } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'isHappy',
          message: 'Are you happy with the result?',
          default: true
        }
      ])

      if (isHappy) {
        satisfied = true
      } else {
        // Step 7: Allow re-editing and re-rendering
        logger.info(`\nEdit the content.njk file when ready:\n  ${destFile}\n`)
        const { continueEditing } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueEditing',
            message: 'Ready to rebuild?',
            default: false
          }
        ])

        if (!continueEditing) {
          logger.info('Exiting. You can run this script again when ready.')
          process.exit(0)
        }
      }
    }

    // Step 8: Create git commit
    const { shouldCommit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldCommit',
        message: 'Would you like to create a git commit with the new content?',
        default: true
      }
    ])

    if (shouldCommit) {
      try {
        logger.info('Creating git commit...')
        execSync(`git add ../tenants/${serviceName}`, { stdio: 'inherit' })
        execSync(
          `git commit -m "Committing ${serviceName} custom shuttering content"`,
          { stdio: 'inherit' }
        )
        logger.info('Git commit created successfully!')
      } catch (error) {
        logger.error(`Git commit failed: ${error.message}`)
        logger.info('You can manually commit the changes later.')
      }
    }

    logger.info('\nAll done! Your shuttering page is ready.')
    logger.info(`Service folder: ${serviceFolder}`)
    logger.info(`HTML output: ${path.resolve('.dist/index.html')}`)
  } catch (error) {
    logger.error(`An error occurred: ${error}`)
    process.exit(1)
  }
}

program.parse()
