import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import { authService } from "./auth.service.js";

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
    return res.status(201).json({
        success: true,
        message:
            "Student registered successfully",
        data: result,
    });
})

export const authController = {
    registerStudent,
    login,
};