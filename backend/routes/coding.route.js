import express from "express";
import {
	contestData,
	statisticsData,
	addContest,
	deleteContest,
	getUserContest,
} from "../controllers/coding.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const Router = express.Router();

Router.get("/contest", protectRoute, contestData);
Router.get("/statistics", protectRoute, statisticsData);
Router.post("/add-contest", protectRoute, addContest);
Router.delete("/delete-contest/:contest_id", protectRoute, deleteContest);
Router.get("/get-use-contest", protectRoute, getUserContest);

export default Router;
