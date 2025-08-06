/**
 * Global teardown for performance tests
 * Cleans up after all tests are complete
 */
async function globalTeardown() {
  console.log('🧹 Cleaning up performance testing environment...');
  
  // Reset environment variables
  delete process.env.PERFORMANCE_TEST_MODE;
  
  console.log('✅ Performance testing cleanup complete');
}

export default globalTeardown; 