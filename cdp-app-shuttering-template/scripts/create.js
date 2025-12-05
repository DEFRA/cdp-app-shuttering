import fs from 'fs'
import path from 'path'
import { logger } from './logger.js'

/**
 * Script to create a new service content folder by copying from the common template
 * Usage: npm run create:content -- --service=<your-service-name>
 */

const src = 'src/templates/common'

const args = process.argv.slice(2)
const serviceArg = args.find((arg) => arg.startsWith('--service='))
const service = serviceArg ? serviceArg.split('=')[1] : undefined

if (!service) {
  logger.error('Error: Please provide a service name')
  logger.info('Usage: npm run create:content -- --service=<your-service-name>')
  process.exit(1)
}

function copyDir(source, destination) {
  fs.mkdirSync(destination, { recursive: true })

  const entries = fs.readdirSync(source, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name)
    const destPath = path.join(destination, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
      logger.info(`Copied: ${srcPath} -> ${destPath}`)
    }
  }
}

logger.info(`Copying from ${src} to ${service}...`)
copyDir(src, `../tenants/${service}`)
logger.info('Copy complete!')
