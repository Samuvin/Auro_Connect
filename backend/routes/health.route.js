import express from "express";
import { getHealthStatus } from "../controllers/health.controller.js";

const router = express.Router();

// Dynatrace/Kubernetes standard health check endpoint
router.get("/healthz", getHealthStatus);

// Also provide the root path for convenience
router.get("/", getHealthStatus);

export default router; 