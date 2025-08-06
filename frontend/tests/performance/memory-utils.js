/**
 * Memory Monitoring Utilities for Playwright Tests
 * 
 * This module provides utilities for detecting memory leaks and monitoring
 * memory usage patterns in frontend applications.
 */

/**
 * Get current memory usage from the browser
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<Object>} Memory usage information
 */
export async function getMemoryUsage(page) {
	return await page.evaluate(() => {
		// Force garbage collection if available
		if (window.gc) {
			window.gc();
		}
		
		const memory = performance.memory;
		return {
			usedJSHeapSize: memory.usedJSHeapSize,
			totalJSHeapSize: memory.totalJSHeapSize,
			jsHeapSizeLimit: memory.jsHeapSizeLimit,
			timestamp: Date.now(),
		};
	});
}

/**
 * Enable memory monitoring using Chrome DevTools Protocol
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<import('@playwright/test').CDPSession>} CDP session
 */
export async function enableMemoryMonitoring(page) {
	const client = await page.context().newCDPSession(page);
	await client.send('Runtime.enable');
	await client.send('HeapProfiler.enable');
	return client;
}

/**
 * Force garbage collection
 * @param {import('@playwright/test').CDPSession} client - CDP session
 */
export async function forceGarbageCollection(client) {
	try {
		await client.send('HeapProfiler.collectGarbage');
	} catch (error) {
		console.warn('Could not force garbage collection:', error.message);
	}
}

/**
 * Take a heap snapshot
 * @param {import('@playwright/test').CDPSession} client - CDP session
 * @returns {Promise<void>}
 */
export async function takeHeapSnapshot(client) {
	try {
		await client.send('HeapProfiler.takeHeapSnapshot');
	} catch (error) {
		console.warn('Could not take heap snapshot:', error.message);
	}
}

/**
 * Monitor memory usage during a specific action
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Function} action - Async function to execute while monitoring
 * @param {Object} options - Monitoring options
 * @returns {Promise<Object>} Memory monitoring results
 */
export async function monitorMemoryDuringAction(page, action, options = {}) {
	const {
		enableGC = true,
		sampleInterval = 500,
		maxSamples = 20,
	} = options;

	const client = enableGC ? await enableMemoryMonitoring(page) : null;
	const memorySnapshots = [];

	// Initial memory measurement
	if (enableGC && client) {
		await forceGarbageCollection(client);
		await page.waitForTimeout(100);
	}
	
	const initialMemory = await getMemoryUsage(page);
	memorySnapshots.push({ 
		phase: 'initial', 
		memory: initialMemory,
		timestamp: Date.now(),
	});

	// Start memory sampling
	const samplingPromise = (async () => {
		let sampleCount = 0;
		while (sampleCount < maxSamples) {
			await page.waitForTimeout(sampleInterval);
			
			if (enableGC && client) {
				await forceGarbageCollection(client);
				await page.waitForTimeout(50);
			}
			
			const memory = await getMemoryUsage(page);
			memorySnapshots.push({ 
				phase: 'during', 
				memory,
				timestamp: Date.now(),
				sample: sampleCount,
			});
			
			sampleCount++;
		}
	})();

	// Execute the action
	const actionStart = Date.now();
	await action();
	const actionEnd = Date.now();

	// Stop sampling after action completes
	await page.waitForTimeout(100); // Allow a moment for any async cleanup

	// Final memory measurement
	if (enableGC && client) {
		await forceGarbageCollection(client);
		await page.waitForTimeout(500); // Allow GC to complete
	}
	
	const finalMemory = await getMemoryUsage(page);
	memorySnapshots.push({ 
		phase: 'final', 
		memory: finalMemory,
		timestamp: Date.now(),
	});

	// Cleanup
	if (client) {
		await client.detach();
	}

	// Analyze results
	const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
	const memoryGrowthMB = memoryGrowth / 1024 / 1024;
	
	const peakMemory = Math.max(...memorySnapshots.map(s => s.memory.usedJSHeapSize));
	const peakMemoryMB = peakMemory / 1024 / 1024;

	return {
		initialMemory: Math.round(initialMemory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
		finalMemory: Math.round(finalMemory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
		peakMemory: Math.round(peakMemoryMB * 100) / 100,
		memoryGrowth: Math.round(memoryGrowthMB * 100) / 100,
		actionDuration: actionEnd - actionStart,
		snapshots: memorySnapshots,
		summary: {
			memoryGrowthMB: Math.round(memoryGrowthMB * 100) / 100,
			peakMemoryMB: Math.round(peakMemoryMB * 100) / 100,
			avgMemoryDuringAction: Math.round(
				memorySnapshots
					.filter(s => s.phase === 'during')
					.reduce((sum, s) => sum + s.memory.usedJSHeapSize, 0) /
				Math.max(1, memorySnapshots.filter(s => s.phase === 'during').length) /
				1024 / 1024 * 100
			) / 100,
		},
	};
}

/**
 * Test for memory leaks during repeated navigation
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Array<string>} routes - Routes to navigate through
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Memory leak test results
 */
export async function testNavigationMemoryLeaks(page, routes, options = {}) {
	const {
		iterations = 3,
		waitBetweenNavigations = 500,
		enableGC = true,
		maxAllowedGrowthMB = 50,
	} = options;

	const client = enableGC ? await enableMemoryMonitoring(page) : null;
	const memorySnapshots = [];

	// Baseline measurement
	if (enableGC && client) {
		await forceGarbageCollection(client);
		await page.waitForTimeout(1000);
	}
	
	const baselineMemory = await getMemoryUsage(page);
	memorySnapshots.push({ 
		phase: 'baseline', 
		memory: baselineMemory,
		route: 'initial',
	});

	// Navigate through routes multiple times
	for (let iteration = 0; iteration < iterations; iteration++) {
		for (const route of routes) {
			await page.goto(route);
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(waitBetweenNavigations);

			if (enableGC && client) {
				await forceGarbageCollection(client);
				await page.waitForTimeout(200);
			}
			
			const memory = await getMemoryUsage(page);
			memorySnapshots.push({
				phase: 'navigation',
				memory,
				route,
				iteration,
				timestamp: Date.now(),
			});
		}
	}

	// Final measurement
	if (enableGC && client) {
		await forceGarbageCollection(client);
		await page.waitForTimeout(1000);
	}
	
	const finalMemory = await getMemoryUsage(page);

	// Cleanup
	if (client) {
		await client.detach();
	}

	// Analyze results
	const totalGrowth = finalMemory.usedJSHeapSize - baselineMemory.usedJSHeapSize;
	const totalGrowthMB = totalGrowth / 1024 / 1024;

	// Calculate memory growth per iteration
	const iterationGroups = {};
	memorySnapshots
		.filter(s => s.iteration !== undefined)
		.forEach(snapshot => {
			if (!iterationGroups[snapshot.iteration]) {
				iterationGroups[snapshot.iteration] = [];
			}
			iterationGroups[snapshot.iteration].push(snapshot.memory.usedJSHeapSize);
		});

	const avgMemoryByIteration = Object.keys(iterationGroups).map(iter => {
		const memories = iterationGroups[iter];
		return memories.reduce((sum, mem) => sum + mem, 0) / memories.length;
	});

	const growthBetweenIterations = avgMemoryByIteration.length > 1 
		? avgMemoryByIteration[avgMemoryByIteration.length - 1] - avgMemoryByIteration[0]
		: 0;

	const growthBetweenIterationsMB = growthBetweenIterations / 1024 / 1024;

	return {
		passed: totalGrowthMB < maxAllowedGrowthMB,
		baselineMemoryMB: Math.round(baselineMemory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
		finalMemoryMB: Math.round(finalMemory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
		totalGrowthMB: Math.round(totalGrowthMB * 100) / 100,
		growthBetweenIterationsMB: Math.round(growthBetweenIterationsMB * 100) / 100,
		maxAllowedGrowthMB,
		iterations,
		routesTested: routes.length,
		snapshots: memorySnapshots,
		summary: {
			memoryLeak: totalGrowthMB > maxAllowedGrowthMB,
			severityLevel: totalGrowthMB > 100 ? 'critical' : 
						   totalGrowthMB > 50 ? 'high' : 
						   totalGrowthMB > 20 ? 'medium' : 'low',
			avgMemoryPerIteration: avgMemoryByIteration.map(mem => 
				Math.round(mem / 1024 / 1024 * 100) / 100
			),
		},
	};
}

/**
 * Create a memory usage reporter for tests
 * @param {string} testName - Name of the test
 * @returns {Object} Reporter object with logging methods
 */
export function createMemoryReporter(testName) {
	const startTime = Date.now();
	
	return {
		logMemoryUsage(phase, memory) {
			const memoryMB = Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;
			const elapsed = Date.now() - startTime;
			console.log(`[${testName}] ${phase}: ${memoryMB}MB (${elapsed}ms elapsed)`);
		},
		
		logMemoryDifference(before, after, phase = 'operation') {
			const beforeMB = Math.round(before.usedJSHeapSize / 1024 / 1024 * 100) / 100;
			const afterMB = Math.round(after.usedJSHeapSize / 1024 / 1024 * 100) / 100;
			const diffMB = Math.round((after.usedJSHeapSize - before.usedJSHeapSize) / 1024 / 1024 * 100) / 100;
			const change = diffMB > 0 ? `+${diffMB}MB` : `${diffMB}MB`;
			console.log(`[${testName}] ${phase}: ${beforeMB}MB → ${afterMB}MB (${change})`);
		},
		
		logTestResult(result) {
			const { passed, totalGrowthMB, summary } = result;
			const status = passed ? '✅ PASSED' : '❌ FAILED';
			console.log(`[${testName}] ${status}: Memory growth ${totalGrowthMB}MB (${summary.severityLevel} severity)`);
		},
	};
}

/**
 * Memory thresholds for different types of operations
 */
export const MEMORY_THRESHOLDS = {
	NAVIGATION: {
		TOTAL_GROWTH_MB: 50,
		ITERATION_GROWTH_MB: 20,
	},
	USER_INTERACTIONS: {
		TOTAL_GROWTH_MB: 25,
		PEAK_MEMORY_MB: 200,
	},
	DATA_PROCESSING: {
		TOTAL_GROWTH_MB: 30,
		CLEANUP_EFFICIENCY: 0.8, // 80% of memory should be freed after cleanup
	},
	DOM_OPERATIONS: {
		NODE_INCREASE_LIMIT: 50,
		MEMORY_GROWTH_MB: 15,
	},
	TIMER_OPERATIONS: {
		MEMORY_GROWTH_MB: 5,
		CLEANUP_TIMEOUT_MS: 2000,
	},
}; 