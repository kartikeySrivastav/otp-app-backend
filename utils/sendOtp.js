import { User } from "../models/userModel.js";

export const generateOtp = () => {
	const otp = Math.floor(Math.random() * 900000) + 100000;
	return otp.toString();
};

export const verifyUser = async (userId, otp) => {
	try {
		const user = await User.findById(userId);

		if (!user) {
			return {
				success: false,
				message: "User not found",
				user: null,
			};
		}

		if (user.otp !== otp) {
			return {
				success: false,
				message: "Invalid OTP",
				user: null,
			};
		}

		user.verified = true;
		user.otp = null;
		user.otp_expiry = null;

		await user.save();

		return {
			success: true,
			message: "Account Verified",
			user: user,
		};
	} catch (error) {
		return {
			success: false,
			message: error.message,
			user: null,
		};
	}
};
