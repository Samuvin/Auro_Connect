import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { Link } from "react-router-dom";
import { FaEmpire } from "react-icons/fa";
import { Bell, Home, LogOut, User, Users, CalendarRange } from "lucide-react";

const Navbar = () => {
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const queryClient = useQueryClient();

	const { data: notifications } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => axiosInstance.get("/notifications"),
		enabled: !!authUser,
	});

	const { data: connectionRequests } = useQuery({
		queryKey: ["connectionRequests"],
		queryFn: async () => axiosInstance.get("/connections/requests"),
		enabled: !!authUser,
	});

	const { mutate: logout } = useMutation({
		mutationFn: () => axiosInstance.post("/auth/logout"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
	});

	const unreadNotificationCount = notifications?.data.filter(
		(notif) => !notif.read
	).length;
	const unreadConnectionRequestsCount = connectionRequests?.data?.length;

	return (
		<nav className="bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 shadow-md sticky top-0 z-10">
			<div className="max-w-7xl mx-auto px-3">
				<div className="flex justify-between items-center py-2">
					{/* Logo Section */}
					<div className="flex items-center space-x-3">
						<Link to="/">
							<FaEmpire
								className="text-white hover:text-blue-100 transform transition duration-300 ease-in-out"
								size={40}
							/>
						</Link>
					</div>

					{/* Links Section */}
					<div className="flex items-center gap-4">
						{/* If User is authenticated */}
						{authUser ? (
							<>
								{/* Home Link */}
								<Link
									to={"/"}
									className="text-white flex flex-col items-center hover:text-blue-100 transition duration-300">
									<Home size={18} />
									<span className="text-xs hidden md:block">Home</span>
								</Link>

								{/* My Network Link */}
								<Link
									to="/network"
									className="text-white flex flex-col items-center relative hover:text-blue-100 transition duration-300">
									<Users size={18} />
									<span className="text-xs hidden md:block">My Network</span>
									{unreadConnectionRequestsCount > 0 && (
										<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
											{unreadConnectionRequestsCount}
										</span>
									)}
								</Link>

								{/* Notifications Link */}
								<Link
									to="/notifications"
									className="text-white flex flex-col items-center relative hover:text-blue-100 transition duration-300">
									<Bell size={18} />
									<span className="text-xs hidden md:block">Notifications</span>
									{unreadNotificationCount > 0 && (
										<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
											{unreadNotificationCount}
										</span>
									)}
								</Link>

								{/* Profile Link */}
								<Link
									to={`/profile/${authUser.username}`}
									className="text-white flex flex-col items-center hover:text-blue-100 transition duration-300">
									<User size={18} />
									<span className="text-xs hidden md:block">Me</span>
								</Link>

								{/* Contest Calendar Link */}
								<Link
									to={`/contestCalender`}
									className="text-white flex flex-col items-center hover:text-blue-100 transition duration-300">
									<CalendarRange size={18} />
									<span className="text-xs hidden md:block">Contest</span>
								</Link>

								{/* Logout Button */}
								<button
									className="flex items-center space-x-1 text-white hover:text-blue-100 transition duration-300"
									onClick={() => logout()}>
									<LogOut size={18} />
									<span className="hidden md:inline">Logout</span>
								</button>
							</>
						) : (
							<>
								{/* Sign In and Join Now Buttons */}
								<Link
									to="/login"
									className="bg-transparent border-2 border-white text-white rounded-lg px-4 py-1 hover:bg-blue-200 hover:border-blue-200 transition duration-300">
									Sign In
								</Link>
								<Link
									to="/signup"
									className="bg-white text-blue-500 rounded-lg px-4 py-1 hover:bg-blue-200 transition duration-300">
									Join now
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
