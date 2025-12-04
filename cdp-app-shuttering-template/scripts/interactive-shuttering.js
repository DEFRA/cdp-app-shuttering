#!/usr/bin/env node

import { Command } from 'commander'
import inquirer from 'inquirer'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import open from 'open'
import chalk from 'chalk'

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

    console.log(
      chalk.blue(`\nCreating folder structure for service: ${serviceName}`)
    )

    // Step 2: Create folder and copy content.njk
    const serviceFolder = path.resolve(`../tenants/${serviceName}`)
    const templateFolder = path.resolve('src/templates/common')

    if (!fs.existsSync(serviceFolder)) {
      fs.mkdirSync(serviceFolder, { recursive: true })
      console.log(chalk.blue(`Created folder: ${serviceFolder}`))
    }

    // Copy content.njk
    const sourceFile = path.join(templateFolder, 'content.njk')
    const destFile = path.join(serviceFolder, 'content.njk')
    fs.copyFileSync(sourceFile, destFile)
    console.log(chalk.blue(`Copied content.njk to ${destFile}`))

    // Step 3: Prompt user to edit the file
    console.log(
      chalk.blue(`\nPlease edit the content.njk file at:\n  ${destFile}\n`)
    )
    const { readyToBuild } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'readyToBuild',
        message: 'Are you ready to build the HTML?',
        default: false
      }
    ])

    if (!readyToBuild) {
      console.log(
        chalk.blue(
          'Please edit the content.njk file and run this script again.'
        )
      )
      process.exit(0)
    }

    // Build and preview loop
    let satisfied = false
    while (!satisfied) {
      // Step 4: Build the HTML
      console.log(chalk.blue('Building HTML...'))
      try {
        execSync(`npm run build:dev -- --service=${serviceName}`, {
          stdio: 'inherit',
          cwd: process.cwd()
        })
        console.log(chalk.blue('Build complete!'))
      } catch (error) {
        console.error(chalk.red(`Build failed: ${error.message}`))
        process.exit(1)
      }

      // Step 5: Open in browser
      const htmlPath = path.resolve('.dist/index.html')
      if (fs.existsSync(htmlPath)) {
        console.log(chalk.blue(`Opening ${htmlPath} in browser...`))
        await open(htmlPath)
      } else {
        console.error(chalk.red('HTML file not found at .dist/index.html'))
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
        console.log(
          chalk.blue(`\nEdit the content.njk file when ready:\n  ${destFile}\n`)
        )
        const { continueEditing } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueEditing',
            message: 'Ready to rebuild?',
            default: false
          }
        ])

        if (!continueEditing) {
          console.log(
            chalk.blue('Exiting. You can run this script again when ready.')
          )
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
        console.log(chalk.blue('Creating git commit...'))
        execSync(`git add ../tenants/${serviceName}`, { stdio: 'inherit' })
        execSync(
          `git commit -m "Committing ${serviceName} custom shuttering content"`,
          { stdio: 'inherit' }
        )
        console.log(chalk.blue('Git commit created successfully!'))
      } catch (error) {
        console.error(chalk.red(`Git commit failed: ${error.message}`))
        console.log(chalk.blue('You can manually commit the changes later.'))
      }
    }

    console.log(chalk.blue('\n✅ All done! Your shuttering page is ready.'))
    console.log(chalk.blue(`Service folder: ${serviceFolder}`))
    console.log(chalk.blue(`HTML output: ${path.resolve('.dist/index.html')}`))
  } catch (error) {
    console.error(chalk.red(`An error occurred: ${error}`))
    process.exit(1)
  }
}

program.parse()
