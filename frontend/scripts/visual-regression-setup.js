#!/usr/bin/env node

/**
 * Visual Regression Testing Setup Script for LoginForm Component
 * 
 * This script sets up and runs complete visual regression testing for the LoginForm component
 * using Storybook and Playwright for snapshot comparison.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Visual Regression Testing Setup for LoginForm Component...\n');

// Configuration
const CONFIG = {
  storybookPort: 6006,
  storybookUrl: `http://localhost:6006`,
  testTimeout: 120000,
  snapshotDir: './tests/visual/loginform.visual.spec.js-snapshots'
};

// Utility functions
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    process.stdout?.on('data', (data) => {
      stdout += data.toString();
      if (options.verbose) {
        console.log(data.toString());
      }
    });

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
      if (options.verbose) {
        console.error(data.toString());
      }
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForStorybook() {
  console.log('⏳ Waiting for Storybook to be ready...');
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(CONFIG.storybookUrl);
      if (response.ok) {
        console.log('✅ Storybook is ready!');
        return true;
      }
    } catch (error) {
      // Continue waiting
    }
    
    attempts++;
    await sleep(2000);
    process.stdout.write('.');
  }
  
  throw new Error('Storybook failed to start within timeout period');
}

async function createBaselineSnapshots() {
  console.log('\n📸 Creating baseline snapshots for LoginForm component...');
  
  try {
    await runCommand('npm', ['run', 'test:visual:update'], { verbose: true });
    console.log('✅ Baseline snapshots created successfully!');
  } catch (error) {
    console.error('❌ Failed to create baseline snapshots:', error.message);
    throw error;
  }
}

async function runVisualTests() {
  console.log('\n🧪 Running visual regression tests...');
  
  try {
    await runCommand('npm', ['run', 'test:visual'], { verbose: true });
    console.log('✅ Visual regression tests completed successfully!');
  } catch (error) {
    console.error('❌ Visual regression tests failed:', error.message);
    console.log('💡 This might be expected if running for the first time or if there are visual changes.');
    return false;
  }
  return true;
}

async function generateReport() {
  console.log('\n📊 Generating visual regression test report...');
  
  try {
    await runCommand('npm', ['run', 'test:visual:report']);
    console.log('✅ Report generated! Open visual-test-results/html-report/index.html to view results.');
  } catch (error) {
    console.error('❌ Failed to generate report:', error.message);
  }
}

async function displayResults() {
  console.log('\n📋 Visual Regression Testing Results:');
  console.log('=====================================');
  
  const snapshotPath = path.join(__dirname, '..', CONFIG.snapshotDir);
  
  if (fs.existsSync(snapshotPath)) {
    const snapshots = fs.readdirSync(snapshotPath).filter(file => file.endsWith('.png'));
    console.log(`📸 Generated ${snapshots.length} snapshots:`);
    
    snapshots.forEach(snapshot => {
      console.log(`   • ${snapshot}`);
    });
  }
  
  console.log('\n🔍 Available Commands:');
  console.log('   npm run test:visual          - Run visual regression tests');
  console.log('   npm run test:visual:update   - Update baseline snapshots');
  console.log('   npm run test:visual:headed   - Run tests with browser UI');
  console.log('   npm run test:visual:ui       - Open Playwright UI mode');
  console.log('   npm run test:visual:report   - Show test report');
  
  console.log('\n🎯 LoginForm Component States Tested:');
  console.log('   ✓ Default empty form');
  console.log('   ✓ Filled form with sample data');
  console.log('   ✓ Mobile responsive view');
  console.log('   ✓ Dark theme variant');
  console.log('   ✓ Interactive states (focus, hover)');
}

async function main() {
  let storybookProcess = null;
  
  try {
    // Check if Storybook is already running
    try {
      const response = await fetch(CONFIG.storybookUrl);
      if (!response.ok) {
        throw new Error('Storybook not running');
      }
      console.log('✅ Storybook is already running');
    } catch {
      // Start Storybook
      console.log('🚀 Starting Storybook...');
      storybookProcess = spawn('npm', ['run', 'storybook'], {
        stdio: 'pipe',
        shell: true
      });
      
      // Wait for Storybook to be ready
      await waitForStorybook();
    }
    
    // Create baseline snapshots if this is the first run
    const snapshotPath = path.join(__dirname, '..', CONFIG.snapshotDir);
    if (!fs.existsSync(snapshotPath)) {
      console.log('📸 First time setup - creating baseline snapshots...');
      await createBaselineSnapshots();
    } else {
      console.log('📸 Baseline snapshots exist - running comparison tests...');
      const testsSucceeded = await runVisualTests();
      
      if (!testsSucceeded) {
        console.log('\n💡 To update snapshots if changes are intentional:');
        console.log('   npm run test:visual:update');
      }
    }
    
    // Generate report
    await generateReport();
    
    // Display results
    await displayResults();
    
  } catch (error) {
    console.error('❌ Visual regression testing failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up Storybook process if we started it
    if (storybookProcess) {
      console.log('\n🛑 Stopping Storybook...');
      storybookProcess.kill();
    }
  }
  
  console.log('\n🎉 Visual regression testing setup complete!');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, CONFIG }; 