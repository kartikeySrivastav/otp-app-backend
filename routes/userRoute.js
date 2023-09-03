import express from "express";
const router = express.Router();
import {
	register,
	verify,
	login,
	logout,
	getAllUser,
	addTask,
	removeTask,
	updateTask,
	getMyProfile,
	updateProfile,
	updatePassword,
	forgotPassword,
	resetPassword,
} from "../controllers/userCtrl.js";
import { isAuthenticated } from "../middleware/auth.js";

router.route("/register").post(register);

router.route("/verify").post(isAuthenticated, verify);

router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/users").get(getAllUser);

router.route("/task/add").post(isAuthenticated, addTask);
router
	.route("/task/:taskId")
	.get(isAuthenticated, updateTask)
	.delete(isAuthenticated, removeTask);

router.route("/profile").get(isAuthenticated, getMyProfile);
router.route("/updateprofile").put(isAuthenticated, updateProfile);
router.route("/updatepassword").put(isAuthenticated, updatePassword);

router.route("/forgetpassword").post(forgotPassword);
router.route("/resetpassword").put(resetPassword);

export default router;
