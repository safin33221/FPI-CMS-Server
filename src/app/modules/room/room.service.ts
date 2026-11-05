import { prisma } from "../../../lib/prisma.js";
import AppError from "../../error/AppError.js";
import httpCode from "../../utils/httpStatus.js";

type RoomPayload = {
    buildingName?: string;
    roomCode?: string;
    capacity?: number;
    isActive?: boolean;
};

const createRoom = async (payload: RoomPayload) => {
    if (!payload.buildingName?.trim() || !payload.roomCode?.trim()) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "Building name and room code are required"
        );
    }

    const code = payload.roomCode.trim().toUpperCase();

    const existingRoom = await prisma.room.findUnique({
        where: { roomCode: code },
    });

    if (existingRoom) {
        throw new AppError(
            httpCode.CONFLICT,
            `Room code "${code}" already exists in ${existingRoom.buildingName}`
        );
    }

    return prisma.room.create({
        data: {
            buildingName: payload.buildingName.trim(),
            roomCode: code,
            capacity: payload.capacity ? Number(payload.capacity) : null,
        },
    });
};

const getAllRooms = async () => {
    return prisma.room.findMany({
        orderBy: [{ buildingName: "asc" }, { roomCode: "asc" }],
    });
};

const updateRoom = async (id: string, payload: RoomPayload) => {
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError(httpCode.NOT_FOUND, "Room not found");
    }

    const updateData: {
        buildingName?: string;
        roomCode?: string;
        capacity?: number | null;
        isActive?: boolean;
    } = {};

    if (payload.buildingName?.trim()) {
        updateData.buildingName = payload.buildingName.trim();
    }

    if (payload.roomCode?.trim()) {
        const code = payload.roomCode.trim().toUpperCase();
        if (code !== existing.roomCode) {
            const duplicate = await prisma.room.findUnique({
                where: { roomCode: code },
            });
            if (duplicate) {
                throw new AppError(
                    httpCode.CONFLICT,
                    `Room code "${code}" is already taken`
                );
            }
            updateData.roomCode = code;
        }
    }

    if (payload.capacity !== undefined) {
        updateData.capacity = payload.capacity ? Number(payload.capacity) : null;
    }

    if (payload.isActive !== undefined) {
        updateData.isActive = Boolean(payload.isActive);
    }

    return prisma.room.update({
        where: { id },
        data: updateData,
    });
};

const deleteRoom = async (id: string) => {
    const existing = await prisma.room.findUnique({
        where: { id },
        include: { routines: { where: { isActive: true } } },
    });

    if (!existing) {
        throw new AppError(httpCode.NOT_FOUND, "Room not found");
    }

    if (existing.routines.length > 0) {
        // If routines are actively scheduled in this room, soft delete (deactivate)
        await prisma.room.update({
            where: { id },
            data: { isActive: false },
        });
        return {
            deactivated: true,
            message: "Room is referenced in active class routines, marked as inactive.",
        };
    }

    await prisma.room.delete({ where: { id } });
    return { deactivated: false, message: "Room deleted successfully" };
};

export const roomService = {
    createRoom,
    getAllRooms,
    updateRoom,
    deleteRoom,
};
