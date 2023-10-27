import express from "express";
import {
	register,
	login,
	logout,
	sendOtpCtrl,
	getMyProfile,
	updateProfile,
	createAddress,
	deleteProfile,
	updateAddress,
	deleteAddress,
	getAddress,
	createSubUser,
	deleteSubUser,
	updateSubUser,
	getSubUser,
	getUser,
} from "../controllers/userCtrl.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/send-otp").post(sendOtpCtrl);
router.route("/logout").get(logout);
router.route("/profile").get(isAuthenticated, getMyProfile);
router.route("/update-profile").post(isAuthenticated, updateProfile);

router.route("/delete").delete(isAuthenticated, deleteProfile);
router.route("/address/add").post(isAuthenticated, createAddress);
router.route("/address").get(isAuthenticated, getAddress);

router
	.route("/address/:addressId")
	.put(isAuthenticated, updateAddress)
	.delete(isAuthenticated, deleteAddress);

// subuser
router.route("/subuser-add").post(isAuthenticated, createSubUser);
router.route("/subuser-update/:subuserId").put(isAuthenticated, updateSubUser);

getSubUser;
router.route("/subuser").get(isAuthenticated, getSubUser);
router
	.route("/subuser-delete/:subuserId")
	.delete(isAuthenticated, deleteSubUser);

router.route("/get-user").get(isAuthenticated, getUser);
export default router;
