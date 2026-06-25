import type {
    Request,
    Response,
    NextFunction,
} from "express";

import catchAsync from "../../utils/catchAsync.js";

import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";

import { staffService } from "./staff.service.js";

const createStaff = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await staffService.createStaff(
                req.body
            );

        sendResponse(res, {
            status: httpCode.CREATED,
            success: true,
            message:
                "Staff created successfully",
            data: result,
        });
    }
);

const getAllStaff = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await staffService.getAllStaff();

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Staff retrieved successfully",
            data: result,
        });
    }
);

const getSingleStaff = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await staffService.getSingleStaff(
                req.params.id as string
            );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Staff retrieved successfully",
            data: result,
        });
    }
);

export const staffController = {
    createStaff,
    getAllStaff,
    getSingleStaff,
};