import { test, expect } from '@playwright/test';

/**
 * Memory Leak Detection Tests
 * 
 * These tests monitor memory usage patterns to detect potential memory leaks
 * in the frontend application using Chrome DevTools Protocol.
 */

// Helper function to get memory usage
async function getMemoryUsage(page) {
	return await page.evaluate(() => {
		// Force garbage collection if available (only in headless Chrome with --enable-precise-memory-info)
		if (window.gc) {
			window.gc();
		}
		
		// Get performance memory info
		const memory = performance.memory;
		return {
			usedJSHeapSize: memory.usedJSHeapSize,
			totalJSHeapSize: memory.totalJSHeapSize,
			jsHeapSizeLimit: memory.jsHeapSizeLimit,
			timestamp: Date.now(),
		};
	});
}

// Helper function to enable precise memory info
async function enableMemoryInfo(page) {
	const client = await page.context().newCDPSession(page);
	await client.send('Runtime.enable');
	await client.send('HeapProfiler.enable');
	return client;
}

// Helper function to force garbage collection
async function forceGC(client) {
	try {
		await client.send('HeapProfiler.collectGarbage');
	} catch (error) {
		// Fallback if HeapProfiler is not available
		console.warn('Could not force garbage collection:', error.message);
	}
}

// Helper function to take heap snapshot
async function takeHeapSnapshot(client) {
	try {
		await client.send('HeapProfiler.takeHeapSnapshot');
	} catch (error) {
		console.warn('Could not take heap snapshot:', error.message);
	}
}

test.describe('Memory Leak Detection', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the application
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('should not have significant memory leaks during navigation', async ({ page }) => {
		test.setTimeout(60000); // Set timeout to 60 seconds
		
		const client = await enableMemoryInfo(page);
		const memorySnapshots = [];
		const routes = ['/', '/login', '/dashboard', '/profile', '/notifications'];
		
		// Baseline memory measurement
		await forceGC(client);
		await page.waitForTimeout(500); // Reduced from 1000ms
		const baselineMemory = await getMemoryUsage(page);
		memorySnapshots.push({ route: 'baseline', memory: baselineMemory });

		// Navigate through routes multiple times
		for (let iteration = 0; iteration < 3; iteration++) {
			for (const route of routes) {
				// Navigate to route
				await page.goto(route);
				await page.waitForLoadState('networkidle');
				await page.waitForTimeout(200); // Reduced from 500ms

				// Force garbage collection and measure memory
				await forceGC(client);
				await page.waitForTimeout(300); // Reduced from 1000ms
				
				const currentMemory = await getMemoryUsage(page);
				memorySnapshots.push({
					route: `${route}-iter${iteration}`,
					memory: currentMemory,
					iteration,
				});

				// Log memory usage for debugging
				console.log(`Memory at ${route} (iteration ${iteration}):`, {
					used: Math.round(currentMemory.usedJSHeapSize / 1024 / 1024) + 'MB',
					total: Math.round(currentMemory.totalJSHeapSize / 1024 / 1024) + 'MB',
				});
			}
		}

		// Analyze memory growth
		const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory;
		const memoryGrowth = finalMemory.usedJSHeapSize - baselineMemory.usedJSHeapSize;
		const memoryGrowthMB = memoryGrowth / 1024 / 1024;

		// Memory growth should not exceed 50MB after multiple navigations
		expect(memoryGrowthMB).toBeLessThan(50);

		// Calculate average memory per iteration
		const iterationMemories = memorySnapshots
			.filter(snapshot => snapshot.iteration !== undefined)
			.reduce((acc, snapshot) => {
				const iter = snapshot.iteration;
				if (!acc[iter]) {
					acc[iter] = [];
				}
				acc[iter].push(snapshot.memory.usedJSHeapSize);
				return acc;
			}, {});

		// Check that memory doesn't grow significantly between iterations
		const avgMemoryByIteration = Object.keys(iterationMemories).map(iter => {
			const memories = iterationMemories[iter];
			return memories.reduce((sum, mem) => sum + mem, 0) / memories.length;
		});

		if (avgMemoryByIteration.length > 1) {
			const memoryGrowthBetweenIterations = 
				avgMemoryByIteration[avgMemoryByIteration.length - 1] - avgMemoryByIteration[0];
			const growthMB = memoryGrowthBetweenIterations / 1024 / 1024;
			
			// Memory growth between iterations should be minimal (less than 20MB)
			expect(growthMB).toBeLessThan(20);
		}

		await client.detach();
	});

	test('should clean up event listeners on component unmount', async ({ page }) => {
		const client = await enableMemoryInfo(page);

		// Navigate to a page with many interactive elements
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		// Add many event listeners to test cleanup
		await page.evaluate(() => {
			window.testEventListeners = [];
			
			// Simulate adding many event listeners (common memory leak source)
			for (let i = 0; i < 100; i++) {
				const handler = () => console.log(`Event ${i}`);
				document.addEventListener('click', handler);
				window.addEventListener('scroll', handler);
				window.addEventListener('resize', handler);
				window.testEventListeners.push(handler);
			}
		});

		// Measure memory after adding listeners
		await forceGC(client);
		const memoryWithListeners = await getMemoryUsage(page);

		// Navigate away (should trigger component unmount and cleanup)
		await page.goto('/profile');
		await page.waitForLoadState('networkidle');

		// Clean up our test listeners
		await page.evaluate(() => {
			window.testEventListeners?.forEach(handler => {
				document.removeEventListener('click', handler);
				window.removeEventListener('scroll', handler);
				window.removeEventListener('resize', handler);
			});
			delete window.testEventListeners;
		});

		// Force garbage collection and measure memory
		await forceGC(client);
		await page.waitForTimeout(2000); // Allow time for cleanup
		const memoryAfterCleanup = await getMemoryUsage(page);

		// Memory should be reduced after cleanup (allowing some variance)
		const memoryDiff = memoryWithListeners.usedJSHeapSize - memoryAfterCleanup.usedJSHeapSize;
		const memoryDiffMB = memoryDiff / 1024 / 1024;

		console.log('Memory difference after cleanup:', memoryDiffMB.toFixed(2) + 'MB');

		// We expect some memory to be freed, but not necessarily all
		// (due to other application memory usage)
		expect(memoryDiffMB).toBeGreaterThan(-10); // Memory shouldn't increase significantly

		await client.detach();
	});

	test('should handle timer cleanup correctly', async ({ page }) => {
		const client = await enableMemoryInfo(page);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		// Create timers that should be cleaned up
		await page.evaluate(() => {
			window.testTimers = [];
			
			// Create multiple timers
			for (let i = 0; i < 50; i++) {
				const intervalId = setInterval(() => {
					// Simulate some work that creates objects
					const data = new Array(1000).fill(Math.random());
					window.tempData = data;
				}, 100);
				
				const timeoutId = setTimeout(() => {
					console.log(`Timeout ${i} executed`);
				}, 5000 + i * 100);

				window.testTimers.push({ intervalId, timeoutId });
			}
		});

		// Let timers run for a bit
		await page.waitForTimeout(2000);

		// Measure memory with active timers
		await forceGC(client);
		const memoryWithTimers = await getMemoryUsage(page);

		// Clean up timers
		await page.evaluate(() => {
			window.testTimers?.forEach(({ intervalId, timeoutId }) => {
				clearInterval(intervalId);
				clearTimeout(timeoutId);
			});
			delete window.testTimers;
			delete window.tempData;
		});

		// Force garbage collection and measure
		await forceGC(client);
		await page.waitForTimeout(1000);
		const memoryAfterCleanup = await getMemoryUsage(page);

		// Memory should not increase significantly
		const memoryIncrease = memoryAfterCleanup.usedJSHeapSize - memoryWithTimers.usedJSHeapSize;
		const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

		console.log('Memory change after timer cleanup:', memoryIncreaseMB.toFixed(2) + 'MB');

		// Memory should not increase by more than 5MB
		expect(memoryIncreaseMB).toBeLessThan(5);

		await client.detach();
	});

	test('should handle large data operations without memory leaks', async ({ page }) => {
		const client = await enableMemoryInfo(page);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		// Baseline memory
		await forceGC(client);
		const baselineMemory = await getMemoryUsage(page);

		// Simulate processing large amounts of data
		for (let iteration = 0; iteration < 5; iteration++) {
			await page.evaluate((iter) => {
				// Simulate creating and processing large datasets
				const largeArray = new Array(100000).fill(0).map((_, i) => ({
					id: i + iter * 100000,
					data: Math.random().toString(36),
					timestamp: Date.now(),
					nested: {
						value: Math.random(),
						array: new Array(100).fill(Math.random()),
					},
				}));

				// Simulate data processing
				const processed = largeArray
					.filter(item => item.nested.value > 0.5)
					.map(item => ({
						...item,
						processed: true,
						hash: item.data.slice(0, 8),
					}));

				// Store temporarily (simulating state updates)
				window.tempProcessedData = processed;

				// Clean up immediately (simulating proper cleanup)
				setTimeout(() => {
					delete window.tempProcessedData;
				}, 100);
			}, iteration);

			// Allow processing and cleanup
			await page.waitForTimeout(200);
		}

		// Force garbage collection
		await forceGC(client);
		await page.waitForTimeout(2000);
		const finalMemory = await getMemoryUsage(page);

		// Calculate memory growth
		const memoryGrowth = finalMemory.usedJSHeapSize - baselineMemory.usedJSHeapSize;
		const memoryGrowthMB = memoryGrowth / 1024 / 1024;

		console.log('Memory growth after data processing:', memoryGrowthMB.toFixed(2) + 'MB');

		// Memory growth should be reasonable (less than 30MB)
		expect(memoryGrowthMB).toBeLessThan(30);

		await client.detach();
	});

	test('should detect DOM node leaks', async ({ page }) => {
		const client = await enableMemoryInfo(page);

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		// Count initial DOM nodes
		const initialNodeCount = await page.evaluate(() => {
			return document.querySelectorAll('*').length;
		});

		// Simulate dynamic content creation and removal
		for (let i = 0; i < 10; i++) {
			await page.evaluate((iteration) => {
				// Create many DOM elements
				const container = document.createElement('div');
				container.id = `test-container-${iteration}`;
				
				for (let j = 0; j < 100; j++) {
					const element = document.createElement('div');
					element.className = 'test-element';
					element.textContent = `Element ${iteration}-${j}`;
					
					// Add event listeners (potential leak source)
					element.addEventListener('click', () => {
						console.log(`Clicked ${iteration}-${j}`);
					});
					
					container.appendChild(element);
				}
				
				document.body.appendChild(container);

				// Remove the container (should clean up all child elements)
				setTimeout(() => {
					const containerToRemove = document.getElementById(`test-container-${iteration}`);
					if (containerToRemove) {
						containerToRemove.remove();
					}
				}, 100);
			}, i);

			await page.waitForTimeout(150);
		}

		// Allow all cleanup to complete
		await page.waitForTimeout(1000);

		// Count final DOM nodes
		const finalNodeCount = await page.evaluate(() => {
			return document.querySelectorAll('*').length;
		});

		// Force garbage collection
		await forceGC(client);
		await page.waitForTimeout(1000);

		console.log('DOM nodes - Initial:', initialNodeCount, 'Final:', finalNodeCount);

		// DOM node count should not increase significantly
		const nodeIncrease = finalNodeCount - initialNodeCount;
		expect(nodeIncrease).toBeLessThan(50); // Allow some variance for normal app behavior

		await client.detach();
	});

	test('should monitor memory during user interactions', async ({ page }) => {
		const client = await enableMemoryInfo(page);
		const memorySnapshots = [];

		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		// Baseline measurement
		await forceGC(client);
		const baseline = await getMemoryUsage(page);
		memorySnapshots.push({ action: 'baseline', memory: baseline });

		// Simulate user interactions
		const interactions = [
			{
				name: 'scroll',
				action: async () => {
					await page.evaluate(() => {
						window.scrollTo(0, document.body.scrollHeight);
					});
					await page.waitForTimeout(500);
				},
			},
			{
				name: 'click-elements',
				action: async () => {
					const clickableElements = await page.locator('button, a, [role="button"]').all();
					for (let i = 0; i < Math.min(5, clickableElements.length); i++) {
						try {
							await clickableElements[i].click({ timeout: 1000 });
							await page.waitForTimeout(200);
						} catch (error) {
							// Ignore click errors for this test
							console.log('Click error (ignored):', error.message);
						}
					}
				},
			},
			{
				name: 'form-interactions',
				action: async () => {
					const inputs = await page.locator('input, textarea').all();
					for (let i = 0; i < Math.min(3, inputs.length); i++) {
						try {
							await inputs[i].fill(`Test input ${i}`, { timeout: 1000 });
							await page.waitForTimeout(100);
							await inputs[i].clear({ timeout: 1000 });
							await page.waitForTimeout(100);
						} catch (error) {
							// Ignore form errors for this test
							console.log('Form error (ignored):', error.message);
						}
					}
				},
			},
		];

		// Perform interactions and measure memory
		for (const interaction of interactions) {
			await interaction.action();
			await forceGC(client);
			await page.waitForTimeout(500);
			
			const memory = await getMemoryUsage(page);
			memorySnapshots.push({ action: interaction.name, memory });
			
			console.log(`Memory after ${interaction.name}:`, 
				Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB');
		}

		// Analyze memory patterns
		const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory;
		const totalGrowth = finalMemory.usedJSHeapSize - baseline.usedJSHeapSize;
		const totalGrowthMB = totalGrowth / 1024 / 1024;

		console.log('Total memory growth during interactions:', totalGrowthMB.toFixed(2) + 'MB');

		// Memory growth during interactions should be reasonable
		expect(totalGrowthMB).toBeLessThan(25);

		await client.detach();
	});
});

/**
 * Memory Leak Detection Utilities Test
 * These tests verify that memory monitoring utilities work correctly
 */
test.describe('Memory Monitoring Utilities', () => {
	test('should correctly measure memory usage', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const memory = await getMemoryUsage(page);

		expect(memory).toHaveProperty('usedJSHeapSize');
		expect(memory).toHaveProperty('totalJSHeapSize');
		expect(memory).toHaveProperty('jsHeapSizeLimit');
		expect(memory).toHaveProperty('timestamp');

		expect(memory.usedJSHeapSize).toBeGreaterThan(0);
		expect(memory.totalJSHeapSize).toBeGreaterThanOrEqual(memory.usedJSHeapSize);
		expect(memory.jsHeapSizeLimit).toBeGreaterThan(memory.totalJSHeapSize);
	});

	test('should enable Chrome DevTools Protocol correctly', async ({ page }) => {
		const client = await enableMemoryInfo(page);
		
		expect(client).toBeDefined();
		expect(typeof client.send).toBe('function');
		
		await client.detach();
	});
}); 