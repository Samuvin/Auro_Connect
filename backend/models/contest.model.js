import mongoose from "mongoose";
const Schema = mongoose.Schema;

const contestSchema = new Schema({
	duration: {
		type: String,
		required: true,
	},
	start: {
		type: String,
		required: true,
	},
	end: {
		type: String,
		required: true,
	},
	event: {
		type: String,
		required: true,
		unique: true,
	},
	host: {
		type: String,
		required: true,
	},
	resource: {
		type: String,
		required: true,
	},
	href: {
		type: String,
		required: true,
	},
});

const Contest = mongoose.model("Contest", contestSchema);
export default Contest;
