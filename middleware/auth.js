import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticated = async (req, res, next) => {
	try {
		const token = req.cookies.token;

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Login first",
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

		req.user = await User.findById(decoded._id);

		next();
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
