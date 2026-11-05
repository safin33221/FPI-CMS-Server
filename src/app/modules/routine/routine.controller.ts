import type { NextFunction, Request, Response } from "express";
import { Weekday } from "@prisma/client";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";
import { routineService } from "./routine.service.js";

type AuthenticatedRequest = Request & { user: { id: string; role: string } };

const createRoutine = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    const result = await routineService.createRoutine(req.body, user);
    sendResponse(res, { status: httpCode.CREATED, success: true, message: "Class routine created successfully", data: result });
});

const getRoutines = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const semesterId = typeof req.query.semesterId === "string" ? req.query.semesterId : undefined;
    const departmentId = typeof req.query.departmentId === "string" ? req.query.departmentId : undefined;
    const day = typeof req.query.day === "string" ? (req.query.day as Weekday) : undefined;
    const user = (req as AuthenticatedRequest).user;
    const result = await routineService.getRoutines(user, { semesterId, departmentId, day });
    sendResponse(res, { status: httpCode.OK, success: true, message: "Class routines retrieved successfully", data: result });
});

const deleteRoutine = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    await routineService.deleteRoutine(req.params.id as string, user);
    sendResponse(res, { status: httpCode.OK, success: true, message: "Class routine deleted successfully", data: null });
});

export const routineController = { createRoutine, getRoutines, deleteRoutine };
