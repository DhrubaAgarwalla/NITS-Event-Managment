#!/usr/bin/env node

/**
 * Script to remove all console.log statements from the event-manager project
 * This will replace console.log with logger.log and add logger imports where needed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const EXTENSIONS = ['.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', '.git'];

// Statistics
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  consoleLogsReplaced: 0,
  consoleErrorsReplaced: 0,
  consoleWarnsReplaced: 0,
  loggerImportsAdded: 0
};

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  if (!EXTENSIONS.includes(ext)) return false;
  
  // Skip if in excluded directory
  for (const excludeDir of EXCLUDE_DIRS) {
    if (filePath.includes(excludeDir)) return false;
  }
  
  // Skip the logger file itself
  if (filePath.includes('logger.js')) return false;
  
  return true;
}

/**
 * Get all files recursively
 */
function getAllFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !EXCLUDE_DIRS.includes(item)) {
        traverse(fullPath);
      } else if (stat.isFile() && shouldProcessFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  console.log(`Processing: ${path.relative(__dirname, filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let modified = false;
  
  // Check if file has console statements
  const hasConsoleLog = /console\.log\s*\(/g.test(content);
  const hasConsoleError = /console\.error\s*\(/g.test(content);
  const hasConsoleWarn = /console\.warn\s*\(/g.test(content);
  const hasConsoleInfo = /console\.info\s*\(/g.test(content);
  const hasConsoleDebug = /console\.debug\s*\(/g.test(content);
  
  const hasAnyConsole = hasConsoleLog || hasConsoleError || hasConsoleWarn || hasConsoleInfo || hasConsoleDebug;
  
  if (!hasAnyConsole) {
    console.log(`  ✓ No console statements found`);
    return;
  }
  
  // Check if logger is already imported
  const hasLoggerImport = /import.*logger.*from.*['"](\.\.\/)*utils\/logger['"]/i.test(content);
  
  // Add logger import if needed and file has console statements
  if (!hasLoggerImport && hasAnyConsole) {
    // Find the best place to add the import
    const importRegex = /^import\s+.*from\s+['"][^'"]+['"];?\s*$/gm;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      // Add after the last import
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      // Determine the correct relative path to logger
      const relativePath = path.relative(path.dirname(filePath), path.join(SRC_DIR, 'utils'));
      const loggerImportPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
      const loggerImport = `\nimport logger from '${loggerImportPath}/logger';`;
      
      content = content.slice(0, insertIndex) + loggerImport + content.slice(insertIndex);
      stats.loggerImportsAdded++;
      modified = true;
      console.log(`  ✓ Added logger import`);
    }
  }
  
  // Replace console statements
  if (hasConsoleLog) {
    const matches = content.match(/console\.log\s*\(/g);
    if (matches) {
      content = content.replace(/console\.log\s*\(/g, 'logger.log(');
      stats.consoleLogsReplaced += matches.length;
      modified = true;
      console.log(`  ✓ Replaced ${matches.length} console.log statements`);
    }
  }
  
  if (hasConsoleError) {
    const matches = content.match(/console\.error\s*\(/g);
    if (matches) {
      content = content.replace(/console\.error\s*\(/g, 'logger.error(');
      stats.consoleErrorsReplaced += matches.length;
      modified = true;
      console.log(`  ✓ Replaced ${matches.length} console.error statements`);
    }
  }
  
  if (hasConsoleWarn) {
    const matches = content.match(/console\.warn\s*\(/g);
    if (matches) {
      content = content.replace(/console\.warn\s*\(/g, 'logger.warn(');
      stats.consoleWarnsReplaced += matches.length;
      modified = true;
      console.log(`  ✓ Replaced ${matches.length} console.warn statements`);
    }
  }
  
  if (hasConsoleInfo) {
    const matches = content.match(/console\.info\s*\(/g);
    if (matches) {
      content = content.replace(/console\.info\s*\(/g, 'logger.info(');
      modified = true;
      console.log(`  ✓ Replaced ${matches.length} console.info statements`);
    }
  }
  
  if (hasConsoleDebug) {
    const matches = content.match(/console\.debug\s*\(/g);
    if (matches) {
      content = content.replace(/console\.debug\s*\(/g, 'logger.debug(');
      modified = true;
      console.log(`  ✓ Replaced ${matches.length} console.debug statements`);
    }
  }
  
  // Write the file if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    stats.filesModified++;
    console.log(`  ✅ File updated successfully`);
  }
  
  stats.filesProcessed++;
}

/**
 * Main function
 */
function main() {
  console.log('🧹 Console Log Removal Script');
  console.log('==============================');
  console.log(`📁 Processing directory: ${SRC_DIR}`);
  console.log(`📄 File extensions: ${EXTENSIONS.join(', ')}`);
  console.log('');
  
  // Check if src directory exists
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`❌ Source directory not found: ${SRC_DIR}`);
    process.exit(1);
  }
  
  // Get all files to process
  const files = getAllFiles(SRC_DIR);
  console.log(`📋 Found ${files.length} files to process\n`);
  
  // Process each file
  for (const file of files) {
    try {
      processFile(file);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
    console.log(''); // Empty line for readability
  }
  
  // Print summary
  console.log('📊 SUMMARY');
  console.log('==========');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Logger imports added: ${stats.loggerImportsAdded}`);
  console.log(`console.log replaced: ${stats.consoleLogsReplaced}`);
  console.log(`console.error replaced: ${stats.consoleErrorsReplaced}`);
  console.log(`console.warn replaced: ${stats.consoleWarnsReplaced}`);
  console.log('');
  
  if (stats.filesModified > 0) {
    console.log('✅ Console log removal completed successfully!');
    console.log('💡 All console statements have been replaced with logger calls.');
    console.log('💡 Logger calls will only show in development mode.');
  } else {
    console.log('ℹ️  No console statements found to replace.');
  }
}

// Run the script
main();
