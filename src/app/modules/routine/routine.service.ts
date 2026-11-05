import { Prisma, Role, Weekday } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import AppError from "../../error/AppError.js";
import httpCode from "../../utils/httpStatus.js";

type RoutinePayload = {
    subjectAssignmentId?: string;
    teacherId?: string;
    roomId?: string;
    academicSessionId?: string;
    day?: Weekday;
    startTime?: string;
    endTime?: string;
};

const routineInclude = {
    subjectAssignment: {
        include: {
            subject: true,
            semester: true,
            department: true,
        },
    },
    teacher: {
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    profileImage: true,
                },
            },
        },
    },
    room: true,
    academicSession: true,
};

const isTime = (value: string | undefined): value is string =>
    Boolean(value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));

type ValidRoutinePayload = Required<Omit<RoutinePayload, "academicSessionId">> &
    Pick<RoutinePayload, "academicSessionId">;

const verifyPayload = (payload: RoutinePayload): ValidRoutinePayload => {
    if (
        !payload.subjectAssignmentId ||
        !payload.teacherId ||
        !payload.roomId ||
        !payload.day ||
        !isTime(payload.startTime) ||
        !isTime(payload.endTime)
    ) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "Subject, teacher, room, day, start time and end time are required"
        );
    }
    if (payload.startTime >= payload.endTime) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "End time must be later than start time"
        );
    }
    return payload as ValidRoutinePayload;
};

const getDepartmentId = async (userId: string) => {
    const teacher = await prisma.teacher.findUnique({
        where: { userId },
        select: { departmentId: true },
    });
    if (!teacher) {
        throw new AppError(
            httpCode.FORBIDDEN,
            "Department head profile not found"
        );
    }
    return teacher.departmentId;
};

const assertNoConflict = async (payload: Required<RoutinePayload>) => {
    const candidates = await prisma.classRoutine.findMany({
        where: {
            academicSessionId: payload.academicSessionId,
            day: payload.day,
            isActive: true,
            OR: [
                { teacherId: payload.teacherId },
                { roomId: payload.roomId },
                { subjectAssignmentId: payload.subjectAssignmentId },
            ],
        },
        include: {
            room: true,
            teacher: { include: { user: true } },
            subjectAssignment: {
                include: {
                    subject: true,
                    department: true,
                    semester: true,
                },
            },
        },
    });

    const conflict = candidates.find(
        (routine) =>
            payload.startTime < routine.endTime &&
            payload.endTime > routine.startTime
    );

    if (!conflict) return;

    if (conflict.teacherId === payload.teacherId) {
        throw new AppError(
            httpCode.CONFLICT,
            `Teacher conflict: Teacher ${conflict.teacher.user.name} already has a class scheduled in Room ${conflict.room.roomCode} for ${conflict.subjectAssignment.subject.name} (${conflict.startTime} - ${conflict.endTime})`
        );
    }

    if (conflict.roomId === payload.roomId) {
        throw new AppError(
            httpCode.CONFLICT,
            `Room conflict: Room ${conflict.room.roomCode} is already occupied by ${conflict.subjectAssignment.subject.name} (${conflict.subjectAssignment.department.name}, Semester ${conflict.subjectAssignment.semester.number}) from ${conflict.startTime} to ${conflict.endTime}`
        );
    }

    throw new AppError(
        httpCode.CONFLICT,
        `Subject conflict: ${conflict.subjectAssignment.subject.name} is already scheduled on ${conflict.day} from ${conflict.startTime} to ${conflict.endTime}`
    );
};

const createRoutine = async (
    rawPayload: RoutinePayload,
    user: { id: string; role: string }
) => {
    const validatedPayload = verifyPayload(rawPayload);
    let session = await prisma.academicSession.findFirst({
        where: validatedPayload.academicSessionId
            ? { id: validatedPayload.academicSessionId, isActive: true }
            : { isCurrent: true, isActive: true },
    });

    if (!session) {
        // Fallback to any active academic session
        session = await prisma.academicSession.findFirst({
            where: { isActive: true },
            orderBy: { startDate: "desc" },
        });
    }

    if (!session) {
        // Auto-provision current academic session if not initialized yet
        const currentYear = new Date().getFullYear();
        session = await prisma.academicSession.create({
            data: {
                name: `${currentYear}-${currentYear + 1}`,
                startDate: new Date(`${currentYear}-01-01`),
                endDate: new Date(`${currentYear}-12-31`),
                isCurrent: true,
                isActive: true,
            },
        });
    }

    const payload: Required<RoutinePayload> = {
        ...validatedPayload,
        academicSessionId: session.id,
    };

    let departmentId: string | undefined;
    if (user.role === Role.DEPARTMENT_HEAD) {
        departmentId = await getDepartmentId(user.id);
    }

    const [assignment, teacher, room] = await Promise.all([
        prisma.subjectAssignment.findFirst({
            where: {
                id: payload.subjectAssignmentId,
                ...(departmentId ? { departmentId } : {}),
            },
        }),
        prisma.teacher.findFirst({
            where: {
                id: payload.teacherId,
                ...(departmentId ? { departmentId } : {}),
            },
        }),
        prisma.room.findFirst({
            where: { id: payload.roomId, isActive: true },
        }),
    ]);

    if (!assignment || !teacher || !room) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "Invalid subject assignment, teacher, or room"
        );
    }

    const teaching = await prisma.teachingAssignment.findFirst({
        where: {
            teacherId: teacher.id,
            subjectAssignmentId: assignment.id,
            isActive: true,
        },
    });

    if (!teaching) {
        throw new AppError(
            httpCode.BAD_REQUEST,
            "Assign this teacher to the subject before scheduling a class"
        );
    }

    await assertNoConflict(payload);
    return prisma.classRoutine.create({
        data: payload,
        include: routineInclude,
    });
};

const getRoutines = async (
    user: { id: string; role: string },
    filter: {
        semesterId?: string | undefined;
        departmentId?: string | undefined;
        day?: Weekday | undefined;
    }
) => {
    const whereClause: Prisma.ClassRoutineWhereInput = { isActive: true };

    if (filter.day) {
        whereClause.day = filter.day;
    }

    if (user.role === Role.TEACHER) {
        const teacher = await prisma.teacher.findUnique({
            where: { userId: user.id },
        });
        if (!teacher) {
            throw new AppError(httpCode.NOT_FOUND, "Teacher profile not found");
        }
        whereClause.teacherId = teacher.id;
    } else if (user.role === Role.STUDENT) {
        const student = await prisma.student.findUnique({
            where: { userId: user.id },
        });
        if (!student) {
            throw new AppError(httpCode.NOT_FOUND, "Student profile not found");
        }
        whereClause.subjectAssignment = {
            departmentId: student.departmentId,
            semesterId: student.semesterId,
        };
    } else if (user.role === Role.DEPARTMENT_HEAD) {
        const departmentId = await getDepartmentId(user.id);
        whereClause.subjectAssignment = {
            departmentId,
            ...(filter.semesterId ? { semesterId: filter.semesterId } : {}),
        };
    } else {
        // ADMIN or PRINCIPAL
        if (filter.departmentId || filter.semesterId) {
            whereClause.subjectAssignment = {
                ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
                ...(filter.semesterId ? { semesterId: filter.semesterId } : {}),
            };
        }
    }

    return prisma.classRoutine.findMany({
        where: whereClause,
        include: routineInclude,
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });
};

const deleteRoutine = async (
    id: string,
    user: { id: string; role: string }
) => {
    let departmentId: string | undefined;
    if (user.role === Role.DEPARTMENT_HEAD) {
        departmentId = await getDepartmentId(user.id);
    }

    const routine = await prisma.classRoutine.findFirst({
        where: {
            id,
            ...(departmentId ? { subjectAssignment: { departmentId } } : {}),
        },
    });

    if (!routine) {
        throw new AppError(httpCode.NOT_FOUND, "Routine not found");
    }

    await prisma.classRoutine.delete({ where: { id } });
};

export const routineService = { createRoutine, getRoutines, deleteRoutine };
