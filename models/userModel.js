import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const subUserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
		lowercase: true,
	},
	number: {
		type: String,
		required: true,
	},
});

const addressSchema = new mongoose.Schema({
	houseNumber: {
		type: String,
	},
	street: {
		type: String,
	},
	city: {
		type: String,
	},
	state: {
		type: String,
	},
	postalCode: {
		type: String,
	},
});

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
		},
		email: {
			type: String,
			unique: true,
			lowercase: true,
		},
		number: {
			type: Number,
		},
		avatar: {
			public_id: String,
			url: String,
		},
		addresses: [addressSchema],
		subUsers: [subUserSchema],
		verified: {
			type: Boolean,
			default: false,
		},
		otp: Number,
		otp_expiry: {
			type: Date,
			default: Date.now() + 5 * 60 * 1000,
		},
	},
	{
		timestamps: true,
	}
);

userSchema.methods.getJWTToken = function () {
	const cookieExpirationTime = 2 * 24 * 60 * 60 * 1000;
	const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET_KEY, {
		expiresIn: cookieExpirationTime,
	});
	return token;
};

userSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.model("User", userSchema);
