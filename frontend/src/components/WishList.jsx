import React, { useState } from "react";
import { Loader, Trash2 } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
const WishList = () => {
	const queryClient = useQueryClient();

	const { mutate: deleteContest, isLoading: isDeletingContest } = useMutation({
		mutationFn: async (contest_id) => {
			await axiosInstance.delete(`/coding/delete-contest/${contest_id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["wishlistcontest"] });
			toast.success("Contest deleted successfully");
		},
		onError: (error) => {
			toast.error(
				error.message || "An error occurred while deleting the contest."
			);
		},
	});

	const handleDeleteContest = (contest_id) => {
		try {
			deleteContest(contest_id);
		} catch (err) {
			console.error("Error deleting contest:", err.message);
			toast.error("Failed to delete contest");
		}
	};

	const {
		data: wishlistContests,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["wishlistcontest"],
		queryFn: async () => {
			const response = await axiosInstance.get("/coding/get-use-contest");
			return response.data;
		},
	});
	const contests = Array.isArray(wishlistContests?.data)
		? wishlistContests?.data
		: [];

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-screen mt-[-50px]">
				<Loader size={65} className="animate-spin text-blue-600" />
			</div>
		);
	}
	if (contests && contests.length === 0) {
		return (
			<div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg border border-blue-200">
				<h2 className="text-xl font-bold text-blue-700 text-center">
					No Contests Available
				</h2>
				<p className="text-gray-800 text-center mt-4">
					Check back later for upcoming contests.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{contests.map((contest, index) => (
				<div
					key={index}
					className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg border border-blue-200">
					<div className="flex justify-between">
						<h2 className="text-2xl font-bold text-blue-700 mb-4">
							{contest.event}
						</h2>
						<button
							onClick={() => handleDeleteContest(contest._id)}
							className="text-red-500 hover:text-red-700 mb-4">
							{isDeletingContest ? (
								<Loader size={18} className="animate-spin" />
							) : (
								<Trash2 size={18} />
							)}
						</button>
					</div>
					<div className="space-y-3">
						<p className="text-gray-800">
							<span className="font-semibold">Duration:</span>{" "}
							{contest.duration}
						</p>
						<p className="text-gray-800">
							<span className="font-semibold">Start:</span>{" "}
							{new Date(contest.start).toLocaleString()}
						</p>
						<p className="text-gray-800">
							<span className="font-semibold">End:</span>{" "}
							{new Date(contest.end).toLocaleString()}
						</p>
						<p className="text-gray-800">
							<span className="font-semibold">Host:</span> {contest.host}
						</p>
						<p className="text-gray-800">
							<span className="font-semibold">Resource:</span>{" "}
							{contest.resource}
						</p>
					</div>

					<a
						href={contest.href}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-6 inline-block text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-center transition ease-in-out duration-200 shadow-md">
						Visit Contest
					</a>
				</div>
			))}
		</div>
	);
};

export default WishList;
