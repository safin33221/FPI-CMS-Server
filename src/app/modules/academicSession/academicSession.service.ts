import { prisma } from "../../../lib/prisma.js";
import AppError from "../../error/AppError.js";
import httpCode from "../../utils/httpStatus.js";

interface CreateAcademicSessionPayload {
    name: string;
    startDate?: string | Date;
    endDate?: string | Date;
    isCurrent?: boolean;
    isActive?: boolean;
}

interface UpdateAcademicSessionPayload {
    name?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    isCurrent?: boolean;
    isActive?: boolean;
}

// Automatically calculate reasonable start and end dates from session name (e.g., "2024-2025" or "2024")
const parseSessionDates = (
    name: string,
    customStart?: string | Date,
    customEnd?: string | Date
) => {
    if (customStart && customEnd) {
        return {
            startDate: new Date(customStart),
            endDate: new Date(customEnd),
        };
    }

    const trimmed = name.trim();
    // Match 4-digit start year, e.g. "2024-2025" -> 2024
    const match = trimmed.match(/(\d{4})/);
    if (match && match[1]) {
        const startYear = parseInt(match[1], 10);
        // In Bangladesh Technical Education Board (BTEB), 4-year diploma session runs July to June
        return {
            startDate: new Date(`${startYear}-07-01T00:00:00.000Z`),
            endDate: new Date(`${startYear + 4}-06-30T23:59:59.999Z`),
        };
    }

    const currentYear = new Date().getFullYear();
    return {
        startDate: new Date(`${currentYear}-07-01T00:00:00.000Z`),
        endDate: new Date(`${currentYear + 4}-06-30T23:59:59.999Z`),
    };
};

const createAcademicSession = async (payload: CreateAcademicSessionPayload) => {
    if (!payload.name || !payload.name.trim()) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "শিক্ষাবর্ষের নাম আবশ্যক (e.g. 2024-2025)"
        );
    }

    const trimmedName = payload.name.trim();

    const existing = await prisma.academicSession.findUnique({
        where: { name: trimmedName },
    });

    if (existing) {
        throw new AppError(
            httpCode.CONFLICT,
            `Academic session "${trimmedName}" already exists`
        );
    }

    const { startDate, endDate } = parseSessionDates(
        trimmedName,
        payload.startDate,
        payload.endDate
    );

    // If marked as the current/latest admission session, update previous latest
    if (payload.isCurrent) {
        await prisma.academicSession.updateMany({
            where: { isCurrent: true },
            data: { isCurrent: false },
        });
    }

    // In polytechnic institutes, multiple sessions run concurrently (e.g. 2021-22, 2022-23, 2023-24, 2024-25).
    // All added sessions default to isActive: true (Running / সক্রিয়).
    const count = await prisma.academicSession.count();
    const isCurrent = payload.isCurrent ?? (count === 0);

    const session = await prisma.academicSession.create({
        data: {
            name: trimmedName,
            startDate,
            endDate,
            isCurrent,
            isActive: payload.isActive ?? true,
        },
    });

    return session;
};

const getAllAcademicSessions = async () => {
    return prisma.academicSession.findMany({
        orderBy: {
            startDate: "desc",
        },
        include: {
            _count: {
                select: {
                    routines: true,
                    sections: true,
                    teachingAssignments: true,
                },
            },
        },
    });
};

const getActiveAcademicSessions = async () => {
    return prisma.academicSession.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            startDate: "desc",
        },
    });
};

const getCurrentAcademicSession = async () => {
    let session = await prisma.academicSession.findFirst({
        where: {
            isCurrent: true,
            isActive: true,
        },
    });

    if (!session) {
        // Fallback to latest active running session
        session = await prisma.academicSession.findFirst({
            where: { isActive: true },
            orderBy: { startDate: "desc" },
        });
    }

    return session;
};

const toggleSessionStatus = async (id: string) => {
    const existing = await prisma.academicSession.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError(httpCode.NOT_FOUND, "Academic session not found");
    }

    const newActiveState = !existing.isActive;

    return prisma.academicSession.update({
        where: { id },
        data: {
            isActive: newActiveState,
            // If deactivating, it can no longer be the current active session
            isCurrent: newActiveState ? existing.isCurrent : false,
        },
    });
};

const setCurrentAcademicSession = async (id: string) => {
    const existing = await prisma.academicSession.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError(httpCode.NOT_FOUND, "Academic session not found");
    }

    return prisma.$transaction(async (tx) => {
        // Set previous current to false, but keep them ACTIVE so other running sessions continue!
        await tx.academicSession.updateMany({
            where: { isCurrent: true },
            data: { isCurrent: false },
        });

        return tx.academicSession.update({
            where: { id },
            data: {
                isCurrent: true,
                isActive: true, // ensure it is active
            },
        });
    });
};

const updateAcademicSession = async (
    id: string,
    payload: UpdateAcademicSessionPayload
) => {
    const existing = await prisma.academicSession.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError(httpCode.NOT_FOUND, "Academic session not found");
    }

    if (payload.name && payload.name.trim() !== existing.name) {
        const duplicate = await prisma.academicSession.findUnique({
            where: { name: payload.name.trim() },
        });
        if (duplicate) {
            throw new AppError(
                httpCode.CONFLICT,
                `Academic session "${payload.name.trim()}" already exists`
            );
        }
    }

    let startDate = existing.startDate;
    let endDate = existing.endDate;

    if (payload.startDate || payload.endDate || payload.name) {
        const parsed = parseSessionDates(
            payload.name ?? existing.name,
            payload.startDate ?? existing.startDate,
            payload.endDate ?? existing.endDate
        );
        startDate = parsed.startDate;
        endDate = parsed.endDate;
    }

    if (payload.isCurrent && !existing.isCurrent) {
        await prisma.academicSession.updateMany({
            where: { isCurrent: true },
            data: { isCurrent: false },
        });
    }

    const updateData: {
        name?: string;
        startDate?: Date;
        endDate?: Date;
        isCurrent?: boolean;
        isActive?: boolean;
    } = {
        startDate,
        endDate,
    };

    if (payload.name) updateData.name = payload.name.trim();
    if (typeof payload.isCurrent === "boolean") updateData.isCurrent = payload.isCurrent;
    if (typeof payload.isActive === "boolean") updateData.isActive = payload.isActive;

    return prisma.academicSession.update({
        where: { id },
        data: updateData,
    });
};

const deleteAcademicSession = async (id: string) => {
    const existing = await prisma.academicSession.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    routines: true,
                    sections: true,
                    teachingAssignments: true,
                },
            },
        },
    });

    if (!existing) {
        throw new AppError(httpCode.NOT_FOUND, "Academic session not found");
    }

    const activeReferences =
        existing._count.routines +
        existing._count.sections +
        existing._count.teachingAssignments;

    if (activeReferences > 0) {
        await prisma.academicSession.update({
            where: { id },
            data: {
                isActive: false,
                isCurrent: false,
            },
        });

        return {
            message: `Academic session "${existing.name}" is linked to active routines or records. It has been deactivated to preserve academic history.`,
            deactivated: true,
        };
    }

    await prisma.academicSession.delete({
        where: { id },
    });

    return {
        message: `Academic session "${existing.name}" deleted successfully.`,
        deactivated: false,
    };
};

export const academicSessionService = {
    createAcademicSession,
    getAllAcademicSessions,
    getActiveAcademicSessions,
    getCurrentAcademicSession,
    toggleSessionStatus,
    setCurrentAcademicSession,
    updateAcademicSession,
    deleteAcademicSession,
};
