import mongoose from "mongoose";

export const connectDatabase = async () => {
	try {
		const connection = mongoose.connect(process.env.MONGO_URI);
		console.log(`DB is connected`);
	} catch (error) {
		console.log(error);
	}
};
