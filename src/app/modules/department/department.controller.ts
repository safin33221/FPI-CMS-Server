import type {
    NextFunction,
    Request,
    Response,
} from "express";

import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";

import { departmentService } from "./department.service.js";

const createDepartment = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await departmentService.createDepartment(
                req.body
            );

        sendResponse(res, {
            status: httpCode.CREATED,
            success: true,
            message:
                "Department created successfully",
            data: result,
        });
    }
);

const getAllDepartment = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await departmentService.getAllDepartment();

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Departments retrieved successfully",
            data: result,
        });
    }
);

const getSingleDepartment = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await departmentService.getSingleDepartment(
                req.params.id as string
            );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Department retrieved successfully",
            data: result,
        });
    }
);

const updateDepartment = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await departmentService.updateDepartment(
                req.params.id as string,
                req.body
            );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Department updated successfully",
            data: result,
        });
    }
);

const deleteDepartment = catchAsync(
    async (
        req: Request,
        res: Response,
        _next: NextFunction
    ) => {
        const result =
            await departmentService.deleteDepartment(
                req.params.id as string
            );

        sendResponse(res, {
            status: httpCode.OK,
            success: true,
            message:
                "Department deleted successfully",
            data: result,
        });
    }
);

export const departmentController = {
    createDepartment,
    getAllDepartment,
    getSingleDepartment,
    updateDepartment,
    deleteDepartment,
};