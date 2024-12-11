import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { useState } from "react";
import { LuCodesandbox } from "react-icons/lu";

const CurrentContest = () => {
	const { data, error, isLoading, isError } = useQuery({
		queryKey: ["onGoingContest"],
		queryFn: () => axiosInstance.get("coding/getOngoingContest"),
		select: (response) => response.data.data,
	});

	const [showModal, setShowModal] = useState(false);

	if (isError) {
		return (
			<div className="text-center text-red-600">Error: {error.message}</div>
		);
	}

	const toggleModal = () => {
		setShowModal(!showModal);
	};

	return (
		<>
			<div className="fixed bottom-10 right-10">
				<button
					onClick={toggleModal}
					className="relative p-4 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-transform transform hover:scale-110">
					<div
						className={`absolute top-0 right-0 h-3 w-3 rounded-full ${
							data && data.length > 0 ? "bg-green-500" : "bg-gray-400"
						} border-2 border-white`}></div>
					<LuCodesandbox size={30} />
				</button>
			</div>

			{showModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
					<div className="bg-white p-6 rounded-lg w-1/3 max-h-[80vh] overflow-hidden flex flex-col">
						<h2 className="text-xl font-semibold text-center text-blue-700 mb-4">
							{data && data.length > 0
								? "Ongoing Contests"
								: "No Contests Available"}
						</h2>

						<div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
							{data && data.length > 0 ? (
								data.map((contest) => (
									<div
										key={contest._id}
										className="p-4 bg-gray-100 rounded-lg shadow-md">
										<h3 className="text-lg font-semibold text-blue-700">
											{contest.event}
										</h3>
										<p className="text-gray-500">Host: {contest.host}</p>
										<p className="text-gray-500">
											Duration: {contest.duration}
										</p>
										<p className="text-gray-500">
											Ends at: {new Date(contest.end).toLocaleString()}
										</p>
										<a
											href={contest.href}
											target="_blank"
											rel="noopener noreferrer"
											className="block mt-2 text-center text-white bg-blue-600 py-2 rounded-lg hover:bg-blue-700 transition">
											Join Contest
										</a>
									</div>
								))
							) : (
								<p className="text-center text-gray-500">
									No ongoing contests available at the moment.
								</p>
							)}
						</div>

						{/* Close Button */}
						<button
							onClick={toggleModal}
							className="mt-4 w-full text-center text-white bg-red-600 py-2 rounded-lg hover:bg-red-700 transition">
							Close
						</button>
					</div>
				</div>
			)}
		</>
	);
};

export default CurrentContest;
