#!/usr/bin/env node

/**
 * Quartz Blog Auto Publish Script (Node.js version)
 * More intelligent and Agent-friendly publishing tool
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const COLORS = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  reset: '\x1b[0m',
}

function log(color, message) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

function exec(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' })
    return { success: true, output }
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' }
  }
}

function getGitStatus() {
  const staged = execSync('git diff --name-only --cached', { encoding: 'utf-8' }).trim()
  const unstaged = execSync('git diff --name-only', { encoding: 'utf-8' }).trim()
  const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf-8' }).trim()

  return {
    staged: staged ? staged.split('\n') : [],
    unstaged: unstaged ? unstaged.split('\n') : [],
    untracked: untracked ? untracked.split('\n') : [],
    hasChanges: !!(staged || unstaged || untracked),
  }
}

function getCurrentBranch() {
  return execSync('git branch --show-current', { encoding: 'utf-8' }).trim()
}

function generateCommitMessage(status) {
  const allMdFiles = [
    ...status.staged,
    ...status.unstaged,
    ...status.untracked,
  ].filter((f) => f.endsWith('.md'))

  if (allMdFiles.length === 0) {
    return '📝 Update content'
  }

  if (allMdFiles.length === 1) {
    const filename = allMdFiles[0].split('/').pop().replace('.md', '')
    return `📝 Update: ${filename}`
  }

  if (allMdFiles.length <= 3) {
    const files = allMdFiles
      .map((f) => f.split('/').pop().replace('.md', ''))
      .join(', ')
    return `📝 Update: ${files}`
  }

  return `📝 Update ${allMdFiles.length} documents`
}

function validateEnvironment() {
  // Check if in correct directory
  if (!existsSync('quartz.config.ts')) {
    log('red', '✗ Error: This script must be run from the quartz-blog root directory')
    process.exit(1)
  }

  // Check if git is initialized
  const result = exec('git rev-parse --git-dir', true)
  if (!result.success) {
    log('red', '✗ Error: Not a git repository')
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const autoMessage = args.includes('--auto') || args.includes('-a')
  const dryRun = args.includes('--dry-run') || args.includes('-d')
  const customMessage = args.find((arg) => !arg.startsWith('-'))

  log('blue', '🚀 Quartz Blog Auto Publish Script\n')

  validateEnvironment()

  // Check for changes
  const status = getGitStatus()

  if (!status.hasChanges) {
    log('yellow', '⚠ No changes to publish!')
    log('blue', 'Make some changes to your content first.')
    process.exit(0)
  }

  // Display changed files
  log('yellow', '▶ Changed files:')
  const allFiles = [...status.staged, ...status.unstaged, ...status.untracked]
  allFiles.forEach((file) => {
    const prefix = status.staged.includes(file) ? '  staged:' : status.untracked.includes(file) ? '  untracked:' : '  modified:'
    console.log(`${prefix} ${file}`)
  })
  console.log()

  // Determine commit message
  let commitMessage = customMessage
  if (!commitMessage && autoMessage) {
    commitMessage = generateCommitMessage(status)
    log('blue', `Auto-generated commit message: ${commitMessage}\n`)
  } else if (!commitMessage) {
    log('yellow', 'What changes did you make?')
    log('blue', 'Usage: npm run publish -- "your commit message"')
    log('blue', 'Or use --auto to auto-generate message')
    process.exit(1)
  }

  if (dryRun) {
    log('yellow', '🔍 Dry run mode - no changes will be made\n')
    log('blue', 'Would commit with message:')
    console.log(`  "${commitMessage}"`)
    log('blue', '\nWould push to:')
    console.log(`  origin/${getCurrentBranch()}`)
    process.exit(0)
  }

  // Build project
  log('yellow', '▶ Building project to verify changes...')
  const buildResult = exec('npx quartz build', true)
  if (!buildResult.success) {
    log('red', '✗ Build failed! Please fix errors before publishing.')
    console.log()
    log('blue', "Run 'npx quartz build' to see error details.")
    process.exit(1)
  }
  log('green', '✓ Build successful!\n')

  // Stage all changes
  log('yellow', '▶ Staging changes...')
  if (!exec('git add -A').success) {
    log('red', '✗ Failed to stage changes')
    process.exit(1)
  }
  log('green', '✓ Changes staged\n')

  // Commit changes
  log('yellow', '▶ Committing changes...')
  const commitResult = exec(`git commit -m "${commitMessage}"`)
  if (!commitResult.success) {
    log('red', '✗ Failed to commit changes')
    process.exit(1)
  }
  log('green', '✓ Changes committed\n')

  // Push to remote
  log('yellow', '▶ Pushing to GitHub...')
  const branch = getCurrentBranch()
  if (branch !== 'v4') {
    log('yellow', `⚠ Warning: You're not on the v4 branch! Current: ${branch}`)
  }

  const pushResult = exec(`git push origin ${branch}`)
  if (!pushResult.success) {
    log('red', '✗ Push failed! Check your network connection and permissions.')
    process.exit(1)
  }
  log('green', '✓ Pushed to GitHub!\n')

  // Success message
  log('green', '🎉 Successfully published!\n')
  log('blue', 'Next steps:')
  console.log('1. GitHub Actions will automatically build and deploy your site')
  console.log('2. Check deployment status at: https://github.com/Kris4js/quartz-blog/actions')
  console.log('3. Your site will be live at: https://kris4js.github.io/quartz-blog/')
  console.log()
}

main().catch((error) => {
  log('red', `✗ Unexpected error: ${error.message}`)
  process.exit(1)
})
