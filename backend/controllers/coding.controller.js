import axios from "axios";
import Contest from "../models/contest.model.js";
import User from "../models/user.model.js";

export const contestData = async (req, res) => {
	try {
		const contest = await axios.get(
			process.env.CLIST_BASE_URL +
				"/contest?with_problems=false&upcoming=true&format_time=true",
			{
				headers: {
					Authorization: `ApiKey ${process.env.CLIST_USERNAME}:${process.env.CLIST_API_KEY}`,
				},
			}
		);
		const data = contest.data.objects.map((e) => {
			return {
				duration: e.duration,
				start: e.start,
				end: e.end,
				event: e.event,
				host: e.host,
				href: e.href,
				resource: e.resource,
			};
		});
		res.status(200).send({
			message: "success",
			data: data,
		});
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

export const statisticsData = async (req, res) => {
	try {
		const id = req.body.account_id;
		const statistics = await axios.get(
			process.env.CLIST_BASE_URL +
				`/statistics/?with_problems=false&with_more_fields=true&account_id=${id}&order_by=-date`,
			{
				headers: {
					Authorization: `ApiKey ${process.env.CLIST_USERNAME}:${process.env.CLIST_API_KEY}`,
				},
			}
		);

		res.status(200).send({ message: "success", data: statistics.data.objects });
	} catch (err) {
		res.status(400).json({
			message: "Failure",
			Error: err.message,
		});
	}
};

export const addContest = async (req, res) => {
	const userId = req.user;
	const { data } = req.body;
	try {
		let contest = await Contest.findOne({ event: data.event });
		if (!contest) {
			contest = new Contest({
				duration: data.duration,
				start: data.start,
				end: data.end,
				event: data.event,
				host: data.host,
				resource: data.resource,
				href: data.href,
			});
			await contest.save();
		}
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		if (!user.contests.includes(contest._id)) {
			user.contests.push(contest._id);
			await user.save();
		} else {
			return res.status(200).json({ message: "Contest already exists" });
		}
		res.status(200).json({
			message: "Contest added successfully",
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteContest = async (req, res) => {
	try {
		const contest_remove = req.params.contest_id;
		const user = await User.findById(req.user._id);
		user.contests = user.contests.filter((e) => e != contest_remove);
		await user.save();
		res.status(200).json({ message: "Contest deleted successfully" });
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

export const getUserContest = async (req, res) => {
	try {
		const user = req.user;
		const data = await User.findById(user._id).populate("contests");
		res.status(200).json({
			staus: "success",
			data: data.contests,
		});
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};

export const getCurrentContest = async (req, res) => {
	try {
		const user = req.user;
		const now = new Date().toISOString();
		const userWishlist = await User.findById(user._id).populate("contests");
		const ongoingContests = userWishlist.contests.filter((contest) => {
			const startDate = new Date(contest.start).toISOString();
			const endDate = new Date(contest.end).toISOString();
			return startDate <= now && now <= endDate;
		});
		res.status(200).json({ status: "success", data: ongoingContests });
	} catch (err) {
		res.status(500).json({ staus: "failed", message: "Server error" });
	}
};
