import express from "express";
import cookieParser from "cookie-parser";
export const app = express();
import fileUpload from "express-fileupload";
import cors from "cors";

import userRouter from "./routes/userRoute.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
	fileUpload({
		limits: { fileSize: 50 * 1024 * 1024 },
		useTempFiles: true,
	})
);
app.use(cors());
app.use("/api/user", userRouter);
