import bcrypt from "bcrypt";
import {
    AdmissionStatus,
    Role,
    StudentStatus,
} from "@prisma/client";

import { prisma } from "../../../lib/prisma.js";
import AppError from "../../error/AppError.js";
import httpCode from "../../utils/httpStatus.js";
import { generateLoginCredentials } from "../../utils/generateTempCredential.js";

interface ConfirmAdmissionPayload {
    feeVerified: boolean;
    documentVerified: boolean;
    remarks?: string;
}

const confirmAdmission = async (
    studentId: string,
    confirmedById: string,
    payload: ConfirmAdmissionPayload
) => {
    if (!payload.remarks && !payload.feeVerified && !payload.documentVerified) {
        throw new AppError(httpCode.NOT_FOUND, "missing ")
    }
    return prisma.$transaction(
        async (tx) => {
            //-----------------------------------
            // Find Student
            //-----------------------------------

            const student = await tx.student.findUnique({
                where: {
                    id: studentId,
                },
            });

            if (!student) {
                throw new AppError(
                    httpCode.NOT_FOUND,
                    "Student not found"
                );
            }

            //-----------------------------------
            // Already admitted?
            //-----------------------------------

            if (student.userId) {
                throw new AppError(
                    httpCode.BAD_REQUEST,
                    "Student is already admitted."
                );
            }

            //-----------------------------------
            // Generate Credentials
            //-----------------------------------

            const { loginId, tempPassword } =
                await generateLoginCredentials(
                    tx,
                    "STUDENT"
                );

            const hashedPassword = await bcrypt.hash(
                tempPassword,
                10
            );

            //-----------------------------------
            // Create User
            //-----------------------------------

            const user = await tx.user.create({
                data: {
                    name: student.name,
                    email: `${loginId}@pending.local`,
                    loginId,
                    password: hashedPassword,
                    role: Role.STUDENT,
                    phone: student.phone,
                    mustChangePassword: true,
                    isVerified: false,
                },
            });

            //-----------------------------------
            // Update Student
            //-----------------------------------

            await tx.student.update({
                where: {
                    id: student.id,
                },
                data: {
                    userId: user.id,
                    status: StudentStatus.ACTIVE,
                },
            });

            //-----------------------------------
            // Create / Update Admission
            //-----------------------------------

            await tx.admission.upsert({
                where: {
                    studentId: student.id,
                },

                update: {
                    isFeeVerified: payload.feeVerified,
                    isDocumentVerified:
                        payload.documentVerified,
                    remarks: payload.remarks ?? null,
                    status: AdmissionStatus.CONFIRMED,
                    confirmedById,
                    confirmedAt: new Date(),
                },

                create: {
                    studentId: student.id,

                    isFeeVerified: payload.feeVerified,
                    isDocumentVerified:
                        payload.documentVerified,
                    remarks: payload.remarks ?? null,

                    status: AdmissionStatus.CONFIRMED,

                    confirmedById,
                    confirmedAt: new Date(),
                },
            });

            //-----------------------------------

            return {
                loginId,
                tempPassword,
                studentName: student.name,
            };
        },
        {
            maxWait: 20000,
            timeout: 20000,
        }
    );
};

export const AdmissionServices = {
    confirmAdmission,
};