import { Weekday } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import AppError from "../../error/AppError.js";
import httpCode from "../../utils/httpStatus.js";

type RoutinePayload = { subjectAssignmentId?: string; teacherId?: string; roomId?: string; academicSessionId?: string; day?: Weekday; startTime?: string; endTime?: string };
const routineInclude = { subjectAssignment: { include: { subject: true, semester: true, department: true } }, teacher: { include: { user: true } }, room: true, academicSession: true };
const isTime = (value: string | undefined): value is string => Boolean(value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
type ValidRoutinePayload = Required<Omit<RoutinePayload, "academicSessionId">> & Pick<RoutinePayload, "academicSessionId">;
const verifyPayload = (payload: RoutinePayload): ValidRoutinePayload => {
    if (!payload.subjectAssignmentId || !payload.teacherId || !payload.roomId || !payload.day || !isTime(payload.startTime) || !isTime(payload.endTime)) throw new AppError(httpCode.BAD_REQUEST, "Subject, teacher, room, day, start time and end time are required");
    if (payload.startTime >= payload.endTime) throw new AppError(httpCode.BAD_REQUEST, "End time must be later than start time");
    return payload as ValidRoutinePayload;
};
const getDepartmentId = async (userId: string) => {
    const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { departmentId: true } });
    if (!teacher) throw new AppError(httpCode.FORBIDDEN, "Department head profile not found");
    return teacher.departmentId;
};
const assertNoConflict = async (payload: Required<RoutinePayload>) => {
    const candidates = await prisma.classRoutine.findMany({ where: { academicSessionId: payload.academicSessionId, day: payload.day, isActive: true, OR: [{ teacherId: payload.teacherId }, { roomId: payload.roomId }, { subjectAssignmentId: payload.subjectAssignmentId }] }, include: { room: true, subjectAssignment: { include: { subject: true } } } });
    const conflict = candidates.find((routine) => payload.startTime < routine.endTime && payload.endTime > routine.startTime);
    if (!conflict) return;
    const type = conflict.teacherId === payload.teacherId ? "Teacher" : conflict.roomId === payload.roomId ? "Room" : "Subject";
    throw new AppError(httpCode.CONFLICT, `${type} conflict: ${conflict.subjectAssignment.subject.name} is already scheduled in ${conflict.room.roomCode} from ${conflict.startTime} to ${conflict.endTime}`);
};
const createRoutine = async (rawPayload: RoutinePayload, userId: string) => {
    const validatedPayload = verifyPayload(rawPayload);
    const departmentId = await getDepartmentId(userId);
    const session = await prisma.academicSession.findFirst({ where: validatedPayload.academicSessionId ? { id: validatedPayload.academicSessionId, isActive: true } : { isCurrent: true, isActive: true } });
    if (!session) throw new AppError(httpCode.BAD_REQUEST, "A current academic session is required before scheduling a class");
    const payload: Required<RoutinePayload> = { ...validatedPayload, academicSessionId: session.id };
    const [assignment, teacher, room] = await Promise.all([prisma.subjectAssignment.findFirst({ where: { id: payload.subjectAssignmentId, departmentId } }), prisma.teacher.findFirst({ where: { id: payload.teacherId, departmentId } }), prisma.room.findFirst({ where: { id: payload.roomId, isActive: true } })]);
    if (!assignment || !teacher || !room || !session) throw new AppError(httpCode.BAD_REQUEST, "Invalid subject assignment, teacher, room, or academic session");
    const teaching = await prisma.teachingAssignment.findFirst({ where: { teacherId: teacher.id, subjectAssignmentId: assignment.id, isActive: true } });
    if (!teaching) throw new AppError(httpCode.BAD_REQUEST, "Assign this teacher to the subject before scheduling a class");
    await assertNoConflict(payload);
    return prisma.classRoutine.create({ data: payload, include: routineInclude });
};
const getRoutines = async (userId: string, semesterId?: string) => {
    const departmentId = await getDepartmentId(userId);
    return prisma.classRoutine.findMany({ where: { subjectAssignment: { departmentId, ...(semesterId ? { semesterId } : {}) }, isActive: true }, include: routineInclude, orderBy: [{ day: "asc" }, { startTime: "asc" }] });
};
const deleteRoutine = async (id: string, userId: string) => {
    const departmentId = await getDepartmentId(userId);
    const routine = await prisma.classRoutine.findFirst({ where: { id, subjectAssignment: { departmentId } } });
    if (!routine) throw new AppError(httpCode.NOT_FOUND, "Routine not found");
    await prisma.classRoutine.delete({ where: { id } });
};
export const routineService = { createRoutine, getRoutines, deleteRoutine };
