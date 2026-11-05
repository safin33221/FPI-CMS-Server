import { prisma } from "../../../lib/prisma.js";
import AppError from "../../error/AppError.js";
import httpCode from "../../utils/httpStatus.js";

interface CreateAcademicSessionPayload {
    name: string;
    startDate: string | Date;
    endDate: string | Date;
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

const createAcademicSession = async (payload: CreateAcademicSessionPayload) => {
    if (!payload.name || !payload.startDate || !payload.endDate) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "Session name, start date, and end date are required"
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

    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);

    if (endDate <= startDate) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "End date must be greater than start date"
        );
    }

    // If marked as current, deactivate all previous current flags
    if (payload.isCurrent) {
        await prisma.academicSession.updateMany({
            where: { isCurrent: true },
            data: { isCurrent: false },
        });
    }

    // If this is the very first session created, make it current by default
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

const getCurrentAcademicSession = async () => {
    let session = await prisma.academicSession.findFirst({
        where: {
            isCurrent: true,
            isActive: true,
        },
    });

    if (!session) {
        // Fallback to latest active session
        session = await prisma.academicSession.findFirst({
            where: { isActive: true },
            orderBy: { startDate: "desc" },
        });
    }

    return session;
};

const setCurrentAcademicSession = async (id: string) => {
    const existing = await prisma.academicSession.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError(httpCode.NOT_FOUND, "Academic session not found");
    }

    return prisma.$transaction(async (tx) => {
        await tx.academicSession.updateMany({
            where: { isCurrent: true },
            data: { isCurrent: false },
        });

        return tx.academicSession.update({
            where: { id },
            data: {
                isCurrent: true,
                isActive: true,
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

    const startDate = payload.startDate ? new Date(payload.startDate) : existing.startDate;
    const endDate = payload.endDate ? new Date(payload.endDate) : existing.endDate;

    if (endDate <= startDate) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "End date must be greater than start date"
        );
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
        // Safe deactivate instead of throwing hard database constraint error
        await prisma.academicSession.update({
            where: { id },
            data: {
                isActive: false,
                isCurrent: false,
            },
        });

        return {
            message: `Academic session "${existing.name}" is linked to existing routines/records. It has been deactivated instead of deleted to protect academic integrity.`,
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
    getCurrentAcademicSession,
    setCurrentAcademicSession,
    updateAcademicSession,
    deleteAcademicSession,
};
