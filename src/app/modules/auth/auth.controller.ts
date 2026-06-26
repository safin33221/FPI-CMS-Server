import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import { authService } from "./auth.service.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";
import { envConfig } from "../../config/env.config.js";

const registerStudent = catchAsync(
    async (req: Request, res: Response) => {
        const result = await authService.registerStudent(req.body);

        return res.status(201).json({
            success: true,
            message:
                "Student registered successfully",
            data: result,
        });
    }
);

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.login(req.body)
    const { accessToken, refreshToken, user } = result;


    res.cookie("accessToken", accessToken, {
        secure: envConfig.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24, // 1 hour
    });

    res.cookie("refreshToken", refreshToken, {
        secure: envConfig.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 90, // 90 days
    });
    sendResponse(res, {
        status: httpCode.OK,
        success: true,
        message: "Student Login Success full",
        data: user
    })
})

const logout = catchAsync(
    async (_req: Request, res: Response, _next: NextFunction) => {
        res.clearCookie("accessToken", {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "none",
        });

        res.clearCookie("refreshToken", {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "none",
        });

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "Logout successful",
        });
    }
);

export const authController = {
    registerStudent,
    login,
    logout
};