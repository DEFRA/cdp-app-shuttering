import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

const src = 'src/templates/common'

const args = process.argv.slice(2)
const serviceArg = args.find((arg) => arg.startsWith('--service='))
const service = serviceArg ? serviceArg.split('=')[1] : undefined

if (!service) {
  console.error(chalk.red('Error: Please provide a service name'))
  console.info(
    chalk.blue('Usage: npm run create:content -- --service=<your-service-name>')
  )
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
      console.info(chalk.blue(`Copied: ${srcPath} -> ${destPath}`))
    }
  }
}

console.info(chalk.blue(`Copying from ${src} to ${service}...`))
copyDir(src, `../tenants/${service}`)
console.info(chalk.blue('Copy complete!'))
