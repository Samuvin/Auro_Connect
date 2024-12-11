import { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { axiosInstance } from "../lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const CalendarComponent = () => {
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const queryClient = useQueryClient();
	const {
		data: authUser,
		isLoading: loading,
		error: UserError,
	} = useQuery({
		queryKey: ["authUser"],
	});
	const { data, error, isLoading } = useQuery({
		queryKey: ["contest"],
		queryFn: () => axiosInstance.get("/coding/contest"),
		select: (response) => response.data,
	});

	const { mutate: addContest, isPending: isLoadingContest } = useMutation({
		mutationFn: async (contestData) => {
			const response = await axiosInstance.post("/coding/add-contest", {
				data: contestData,
			});
			return response.data;
		},
		onSuccess: (data) => {
			toast.success(data?.message || "Contest added successfully");
			queryClient.invalidateQueries({ queryKey: ["wishlistcontest"] });
		},
		onError: (err) => {
			console.error("Error response:", err.message); // Debugging: log error structure
			toast.error(err.message || "Failed to add contest"); // Access error message correctly
		},
	});

	const handleAddContest = (e) => {
		addContest(selectedEvent);
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-screen mt-[-50px]">
				<Loader size={65} className="animate-spin text-blue-600" />
			</div>
		);
	}

	if (error || UserError)
		return (
			<div className="text-center text-red-500">Error: {error.message}</div>
		);

	const events = data.data.map((contest) => ({
		title: contest.event,
		start: new Date(moment(contest.start, "DD.MM ddd HH:mm")),
		end: new Date(moment(contest.end, "DD.MM ddd HH:mm")),
		allDay: false,
		event: contest.event,
		duration: contest.duration,
		host: contest.host,
		resource: contest.resource,
		href: contest.href,
	}));

	const handleSelectEvent = (event) => {
		setSelectedEvent(event);
		setShowModal(true);
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setSelectedEvent(null);
	};

	return (
		<div className="p-6 bg-white shadow-lg rounded-lg max-w-7xl mx-auto">
			<h1 className="text-3xl font-semibold text-center text-blue-600 mb-6">
				Contest Calendar
			</h1>
			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<Calendar
					localizer={localizer}
					events={events}
					startAccessor="start"
					endAccessor="end"
					style={{ height: 500 }}
					className="rounded-lg shadow-md"
					onSelectEvent={handleSelectEvent}
				/>
			</div>

			{showModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
						<h2 className="text-xl font-semibold text-blue-600 mb-4">
							Event Details
						</h2>
						{selectedEvent && (
							<div>
								<p className="mb-2 text-gray-700">
									<strong>Event:</strong> {selectedEvent.event}
								</p>
								<p className="mb-2 text-gray-700">
									<strong>Duration:</strong> {selectedEvent.duration}
								</p>
								<p className="mb-2 text-gray-700">
									<strong>Start:</strong> {selectedEvent.start.toString()}
								</p>
								<p className="mb-2 text-gray-700">
									<strong>End:</strong> {selectedEvent.end.toString()}
								</p>
								<p className="mb-2 text-gray-700">
									<strong>Host:</strong> {selectedEvent.host}
								</p>
								<p className="mb-4 text-gray-700">
									<strong>Resource:</strong> {selectedEvent.resource}
								</p>
								<a
									href={selectedEvent.href}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-500 hover:text-blue-700 underline">
									Visit Contest
								</a>
							</div>
						)}
						<div className="flex justify-between">
							<div className="mt-4 flex justify-end">
								<button
									className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
									onClick={handleCloseModal}>
									Close
								</button>
							</div>
							<div className="mt-4 flex justify-end">
								<button
									className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
									onClick={handleAddContest}>
									{isLoadingContest ? (
										<Loader size={18} className="animate-spin" />
									) : (
										"Wishlist"
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CalendarComponent;
