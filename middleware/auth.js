import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/userModel.js";

export const isAuthenticated = async (req, res, next) => {
	const token = req.cookies.token;

	try {
		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized. Please log in.",
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

		if (!decoded || !decoded._id) {
			return res.status(401).json({
				success: false,
				message: "Invalid token",
			});
		}

		// Check if the token has expired
		const currentTimestamp = Date.now();
		if (decoded.exp * 1000 <= currentTimestamp) {
			return res.status(401).json({
				success: false,
				message: "Token has expired",
			});
		}

		const userId = new mongoose.Types.ObjectId(decoded._id);
		const user = await User.findById(userId);

		if (!user || !user.verified) {
			return res.status(401).json({
				success: false,
				message: "User is not verified",
			});
		}

		req.user = user;

		next();
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
