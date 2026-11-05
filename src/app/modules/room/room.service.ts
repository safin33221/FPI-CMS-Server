import { prisma } from "../../../lib/prisma.js";
import AppError from "../../error/AppError.js";
import httpCode from "../../utils/httpStatus.js";

type RoomPayload = { buildingName?: string; roomCode?: string; capacity?: number };

const createRoom = async (payload: RoomPayload) => {
    if (!payload.buildingName?.trim() || !payload.roomCode?.trim()) {
        throw new AppError(httpCode.BAD_REQUEST, "Building name and room code are required");
    }
    return prisma.room.create({ data: { buildingName: payload.buildingName.trim(), roomCode: payload.roomCode.trim().toUpperCase(), capacity: payload.capacity ?? null } });
};

const getAllRooms = async () => prisma.room.findMany({ where: { isActive: true }, orderBy: { roomCode: "asc" } });

export const roomService = { createRoom, getAllRooms };
