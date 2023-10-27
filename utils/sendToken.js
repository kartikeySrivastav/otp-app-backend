export const sendToken = (res, user, statusCode, message) => {
	if (!user || !user._id) {
		return res.status(500).json({
			success: false,
			message: "User information not available",
		});
	}

	const token = user.getJWTToken();
	const options = {
		httpOnly: true,
		expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
		path: "/",
		domain: "localhost",
	};

	res.cookie("token", token, options);

	const userData = {
		_id: user._id,
		email: user.email,
		verified: user.verified,
	};

	res.status(statusCode).json({
		success: true,
		message,
		user: userData,
		token: token,
	});
};
