import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import { authService } from "./auth.service.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";

const registerStudent = catchAsync(
    async (req: Request, res: Response) => {
        const result =
            await authService.registerStudent(
                req.body
            );

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

    sendResponse(res, {
        status: httpCode.OK,
        success: true,
        message: "Student Login Success full",
        data: result
    })
})

export const authController = {
    registerStudent,
    login,
};