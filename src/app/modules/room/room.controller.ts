import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import httpCode from "../../utils/httpStatus.js";
import { roomService } from "./room.service.js";

const createRoom = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await roomService.createRoom(req.body);
    sendResponse(res, { status: httpCode.CREATED, success: true, message: "Room created successfully", data: result });
});
const getAllRooms = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const result = await roomService.getAllRooms();
    sendResponse(res, { status: httpCode.OK, success: true, message: "Rooms retrieved successfully", data: result });
});
export const roomController = { createRoom, getAllRooms };
