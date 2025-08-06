import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global setup for performance tests
 * Prepares directories and environment
 */
async function globalSetup() {
  console.log('🚀 Setting up performance testing environment...');
  
  // Create necessary directories
  const dirs = [
    path.join(__dirname, '../../lighthouse-reports'),
    path.join(__dirname, '../../test-results'),
    path.join(__dirname, '../../playwright-report')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
  
  // Set environment variables for performance testing
  process.env.PERFORMANCE_TEST_MODE = 'true';
  process.env.NODE_ENV = 'test';
  
  console.log('✅ Performance testing environment ready');
}

export default globalSetup; 