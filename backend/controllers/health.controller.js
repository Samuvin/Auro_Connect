import mongoose from "mongoose";
import os from "os";

/**
 * Health check endpoint optimized for Dynatrace monitoring
 * Returns application health status with detailed metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getHealthStatus = async (req, res) => {
	try {
		const startTime = Date.now();
		const healthCheck = {
			status: "UP", // Dynatrace prefers UP/DOWN status
			timestamp: new Date().toISOString(),
			uptime: Math.floor(process.uptime()),
			environment: process.env.NODE_ENV || "development",
			version: process.env.npm_package_version || "1.0.0",
			hostname: os.hostname(),
			platform: os.platform(),
			nodeVersion: process.version,
			checks: {
				database: {
					status: "UNKNOWN",
					responseTime: null,
					lastChecked: new Date().toISOString()
				},
				application: {
					status: "UP",
					pid: process.pid,
					lastChecked: new Date().toISOString()
				}
			},
			metrics: {
				memory: {
					...process.memoryUsage(),
					systemTotal: os.totalmem(),
					systemFree: os.freemem(),
					systemUsage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
				},
				cpu: {
					usage: process.cpuUsage(),
					loadAverage: os.loadavg(),
					cores: os.cpus().length
				},
				system: {
					uptime: os.uptime(),
					arch: os.arch(),
					type: os.type()
				}
			}
		};

		// Check database connectivity with detailed metrics
		const dbStartTime = Date.now();
		try {
			// Check if mongoose is connected
			if (mongoose.connection.readyState === 1) {
				// Perform a simple ping to verify database connection
				await mongoose.connection.db.admin().ping();
				healthCheck.checks.database = {
					status: "UP",
					responseTime: Date.now() - dbStartTime,
					readyState: mongoose.connection.readyState,
					readyStateText: getReadyStateText(mongoose.connection.readyState),
					host: mongoose.connection.host || "unknown",
					name: mongoose.connection.name || "unknown",
					lastChecked: new Date().toISOString()
				};
			} else {
				healthCheck.checks.database = {
					status: "DOWN",
					responseTime: null,
					readyState: mongoose.connection.readyState,
					readyStateText: getReadyStateText(mongoose.connection.readyState),
					error: "Database connection not ready",
					lastChecked: new Date().toISOString()
				};
				healthCheck.status = "DOWN";
			}
		} catch (dbError) {
			healthCheck.checks.database = {
				status: "DOWN",
				responseTime: Date.now() - dbStartTime,
				readyState: mongoose.connection.readyState,
				readyStateText: getReadyStateText(mongoose.connection.readyState),
				error: dbError.message,
				lastChecked: new Date().toISOString()
			};
			healthCheck.status = "DOWN";
		}

		// Add overall response time
		healthCheck.responseTime = Date.now() - startTime;

		// Set appropriate HTTP status code for Dynatrace
		// 200 for UP, 503 for DOWN (Service Unavailable)
		const httpStatus = healthCheck.status === "UP" ? 200 : 503;

		// Add CORS headers for Dynatrace monitoring
		res.set({
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Pragma': 'no-cache',
			'Expires': '0'
		});

		res.status(httpStatus).json(healthCheck);
	} catch (error) {
		// If there's an unexpected error, return 500 with detailed error info
		res.status(500).json({
			status: "DOWN",
			timestamp: new Date().toISOString(),
			error: error.message,
			stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			checks: {
				application: {
					status: "DOWN",
					error: "Unexpected error during health check",
					lastChecked: new Date().toISOString()
				}
			},
			hostname: os.hostname(),
			environment: process.env.NODE_ENV || "development"
		});
	}
};

/**
 * Helper function to convert mongoose ready state to human readable text
 * @param {number} state - Mongoose connection ready state
 * @returns {string} Human readable state
 */
function getReadyStateText(state) {
	const states = {
		0: 'disconnected',
		1: 'connected',
		2: 'connecting',
		3: 'disconnecting'
	};
	return states[state] || 'unknown';
} 