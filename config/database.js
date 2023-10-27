import mongoose from "mongoose";

export const connectDatabase = async () => {
	try {
		const connection = await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		console.log("Database Connected Successfully");
	} catch (error) {
		console.error("MongoDB connection error:", error);
	}
};
