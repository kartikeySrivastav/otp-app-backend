import { User } from "../models/userModel.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import { generateOtp, verifyUser } from "../utils/sendOtp.js";
import cloudinary from "cloudinary";
import fs from "fs";

export const register = async (req, res) => {
	try {
		const { email } = req.body;

		// Check if the email already exists in the database
		console.log("Before findOne query");
		const existingUser = await User.findOne({ email }).maxTimeMS(10000);
		console.log("After findOne query");

		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "Email already exists. Please use a different email.",
			});
		}

		// Generate a new OTP and OTP expiry
		const otp = generateOtp();
		const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

		// Create a new user with the provided data and generated OTP
		const newUser = new User({
			email,
			otp,
			otp_expiry: otpExpiry,
		});

		// Save the new user to the database
		await newUser.save();

		// Send the OTP to the user's email
		await sendMail(email, "Verify your account", `Your OTP is ${otp}`);

		res.status(200).json({
			success: true,
			message: "OTP sent to your email for verification",
		});
	} catch (error) {
		if (error.name === "MongoTimeoutError") {
			// Handle timeout error
			res.status(500).json({
				success: false,
				message: "Database operation timed out.",
			});
		} else {
			// Handle other errors
			res.status(500).json({ success: false, message: error.message });
		}
	}
};

export const sendOtpCtrl = async (req, res) => {
	try {
		const { email } = req.body;

		// Check if the email already exists in the database
		const existingUser = await User.findOne({ email });

		if (!existingUser) {
			// User does not exist, so send an error response
			return res.status(400).json({
				success: false,
				message: "Email does not exist. Please use a different email.",
			});
		}

		// Generate a new OTP and OTP expiry
		const otp = generateOtp();
		const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

		// Send the OTP to the user's email
		await sendMail(email, "Verify your account", `Your OTP is ${otp}`);

		// Update the existing user with the new OTP and OTP expiry
		existingUser.otp = otp;
		existingUser.otp_expiry = otpExpiry;
		await existingUser.save();

		// Send a success response
		res.status(200).json({
			success: true,
			message: "OTP sent to your email for verification",
		});
	} catch (error) {
		// Handle any errors that occur during the process
		res.status(500).json({ success: false, message: error.message });
	}
};

export const login = async (req, res) => {
	try {
		const { email, otp } = req.body;

		if (!email || !otp) {
			return res.status(400).json({
				success: false,
				message: "Please provide both email and OTP",
			});
		}

		const user = await User.findOne({ email });

		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		const currentTimestamp = new Date().getTime();
		if (user.otp_expiry < currentTimestamp) {
			user.otp = null;
			user.otp_expiry = null;
			await user.save();

			return res.status(400).json({
				success: false,
				message: "OTP has expired. Please request a new OTP.",
			});
		}

		const verifiedUser = await verifyUser(user._id, otp);

		if (!verifiedUser.success) {
			return res.status(400).json({
				success: false,
				message: verifiedUser.message,
			});
		}

		sendToken(res, verifiedUser.user, 200, "Login Successful");
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const logout = async (req, res) => {
	try {
		res.clearCookie("token");
		res.status(200).json({
			success: true,
			message: "Logged out successfully",
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		const { name, email, number, addresses } = req.body;

		if (name) user.name = name;
		if (email) user.email = email;
		if (number) user.number = number;

		if (req.files && req.files.avatar) {
			const avatar = req.files.avatar.tempFilePath;
			const mycloud = await cloudinary.v2.uploader.upload(avatar);
			fs.rmSync("./tmp", { recursive: true });
			user.avatar = {
				public_id: mycloud.public_id,
				url: mycloud.secure_url,
			};
		}

		const parsedAddresses =
			typeof addresses === "string" ? JSON.parse(addresses) : addresses;

		const existingAddressIndex = user.addresses.findIndex(
			(address) => address._id.toString() === (parsedAddresses._id || "")
		);

		if (existingAddressIndex !== -1) {
			// If an existing address is found, update it
			const existingAddress = user.addresses[existingAddressIndex];
			existingAddress.houseNumber = parsedAddresses.houseNumber;
			existingAddress.street = parsedAddresses.street;
			existingAddress.city = parsedAddresses.city;
			existingAddress.state = parsedAddresses.state;
			existingAddress.postalCode = parsedAddresses.postalCode;
		} else {
			// If no existing addresses, create a new one
			user.addresses = parsedAddresses;
		}

		const savedUser = await user.save();

		const userData = {
			_id: savedUser._id,
			email: savedUser.email,
			name: savedUser.name,
			number: savedUser.number,
			avatar: savedUser.avatar,
			addresses: savedUser.addresses,
			subUsers: savedUser.subUsers,
			verified: savedUser.verified,
			otp: savedUser.otp,
			otp_expiry: savedUser.otp_expiry,
			createdAt: savedUser.createdAt,
			updatedAt: savedUser.updatedAt,
		};

		res.status(200).json({
			success: true,
			message: "Profile Updated successfully",
			user: userData,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const getMyProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);

		sendToken(res, user, 200, `Welcome back ${user.name}`);
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const deleteProfile = async (req, res) => {
	try {
		const deletedUser = await User.findByIdAndDelete(req.user._id);

		if (!deletedUser) {
			return res.status(404).json({
				success: false,
				message: "User not found or already deleted",
			});
		}

		res.status(200).json({
			success: true,
			message: "User profile deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// Address functionality

export const createAddress = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		const address = req.body;

		const isDuplicate = user.addresses.some((existingAddress) => {
			return (
				existingAddress.houseNumber === address.houseNumber &&
				existingAddress.street === address.street &&
				existingAddress.city === address.city &&
				existingAddress.state === address.state &&
				existingAddress.postalCode === address.postalCode
			);
		});

		if (isDuplicate) {
			return res.status(400).json({
				success: false,
				message: "This address already exists in your profile.",
			});
		}

		if (isDuplicate) {
			return res.status(400).json({
				success: false,
				message: "This address already exists in your profile.",
			});
		}

		user.addresses.push(address);
		await user.save();

		res.status(200).json({
			success: true,
			message: "Address created successfully",
			user: user,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const updateAddress = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		const { addressId } = req.params;

		const addressData = req.body;

		const addressToUpdate = user.addresses.find(
			(address) => address._id.toString() === addressId
		);

		if (!addressToUpdate) {
			return res.status(404).json({
				success: false,
				message: "Address not found",
			});
		}

		Object.assign(addressToUpdate, addressData);

		await user.save();

		res.status(200).json({
			user: user,
			success: true,
			message: "Address updated successfully",
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const deleteAddress = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		const { addressId } = req.params;

		user.addresses = user.addresses.filter(
			(address) => address._id.toString() !== addressId
		);

		await user.save();

		res.status(200).json({
			success: true,
			message: "Address deleted successfully",
			user: user,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const getAddress = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		const addresses = user.addresses;

		res.status(200).json({
			addresses: addresses,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// subUser functionality

export const createSubUser = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);

		const subUserData = req.body;

		const existingSubUser = user.subUsers.find(
			(subUser) =>
				subUser.email === subUserData.email ||
				subUser.number === subUserData.number
		);

		if (existingSubUser) {
			return res.status(400).json({
				success: false,
				message:
					"Sub-user with the same email or number already exists.",
			});
		}

		user.subUsers.push(subUserData);
		await user.save();

		res.status(200).json({
			success: true,
			message: "Sub-user created successfully",
			user: user,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const updateSubUser = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		const { subuserId } = req.params;

		const updatedSubuserData = req.body;

		const subuserToUpdate = user.subUsers.find(
			(subuser) => subuser._id.toString() === subuserId
		);

		if (!subuserToUpdate) {
			return res.status(404).json({
				success: false,
				message: "Sub-user not found",
			});
		}

		const existingSubUser = user.subUsers.find(
			(subuser) =>
				(subuser.email === updatedSubuserData.email ||
					subuser.number === updatedSubuserData.number) &&
				subuser._id.toString() !== subuserId
		);

		if (existingSubUser) {
			return res.status(400).json({
				success: false,
				message:
					"A sub-user with the same email or number already exists",
			});
		}

		Object.assign(subuserToUpdate, updatedSubuserData);

		await user.save();

		res.status(200).json({
			user: user,
			success: true,
			message: "Sub-user updated successfully",
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// Delete a specific sub-user for the user
export const deleteSubUser = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		const { subuserId } = req.params;

		user.subUsers = user.subUsers.filter(
			(subuser) => subuser._id.toString() !== subuserId
		);

		await user.save();

		res.status(200).json({
			user: user,
			success: true,
			message: "Sub-user deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const getSubUser = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		const subUsers = user.subUsers;

		res.status(200).json({
			subUsers: subUsers,
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const getUser = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			user: user,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to fetch user data",
		});
	}
};
