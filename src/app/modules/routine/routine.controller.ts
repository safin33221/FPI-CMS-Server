import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";
import { routineService } from "./routine.service.js";

type AuthenticatedRequest = Request & { user: { id: string } };

const createRoutine = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await routineService.createRoutine(req.body, (req as AuthenticatedRequest).user.id);
    sendResponse(res, { status: httpCode.CREATED, success: true, message: "Class routine created successfully", data: result });
});
const getRoutines = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const semesterId = typeof req.query.semesterId === "string" ? req.query.semesterId : undefined;
    const result = await routineService.getRoutines((req as AuthenticatedRequest).user.id, semesterId);
    sendResponse(res, { status: httpCode.OK, success: true, message: "Class routines retrieved successfully", data: result });
});
const deleteRoutine = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await routineService.deleteRoutine(req.params.id as string, (req as AuthenticatedRequest).user.id);
    sendResponse(res, { status: httpCode.OK, success: true, message: "Class routine deleted successfully", data: null });
});
export const routineController = { createRoutine, getRoutines, deleteRoutine };
