#!/usr/bin/env node
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get git commit count for version
const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim()
const version = `0.${commitCount}`

// Get current date
const date = new Date()
const dateStr = date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
})

// Create version info object
const versionInfo = {
  version,
  date: dateStr,
  timestamp: date.toISOString(),
}

// Write to file
const versionPath = join(__dirname, '..', 'src', 'version.json')
writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2))

console.log(`Version updated: ${version}@${dateStr}`)
