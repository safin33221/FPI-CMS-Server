import type{ NextFunction, Request, Response } from "express";



import httpCode from "http-status";
import catchAsync from "../../utils/catchAsync.js";
import { userService } from "./user.service.js";
import sendResponse from "../../utils/sendResponse.js";


const getAllUser = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const result = await userService.getAllUser(req.query);

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "Users retrieved successfully",
            data: result,
        });
    }
);

const getSingleUser = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const result = await userService.getSingleUser(req.params.id as string);

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "User retrieved successfully",
            data: result,
        });
    }
);

const getMyProfile = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const userId = (req as any).user.userId;

        const result = await userService.getMyProfile(userId);

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "Profile retrieved successfully",
            data: result,
        });
    }
);

const updateUser = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const result = await userService.updateUser(
            req.params.id as string,
            req.body
        );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "User updated successfully",
            data: result,
        });
    }
);

const updateProfile = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const userId = (req as any).user.userId;

        const result = await userService.updateProfile(
            userId,
            req.body
        );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "Profile updated successfully",
            data: result,
        });
    }
);

const updateUserStatus = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const result = await userService.updateUserStatus(
            req.params.id as string,
            req.body
        );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "User status updated successfully",
            data: result,
        });
    }
);

const updateUserRole = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const result = await userService.updateUserRole(
            req.params.id as string,
            req.body
        );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "User role updated successfully",
            data: result,
        });
    }
);

const uploadAvatar = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const userId = (req as any).user.userId;

        const result = await userService.uploadAvatar(
            userId,
            req.body
        );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "Avatar uploaded successfully",
            data: result,
        });
    }
);

const deleteUser = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
        const result = await userService.deleteUser(req.params.id as string);

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message: "User deleted successfully",
            data: result,
        });
    }
);

export const userController = {
    getAllUser,
    getSingleUser,
    getMyProfile,

    updateUser,
    updateProfile,

    updateUserStatus,
    updateUserRole,

    uploadAvatar,

    deleteUser,
};