import bcrypt from "bcrypt"
import { prisma } from "../../../lib/prisma.js"
import AppError from "../../error/AppError.js"
import httpCode from "../../utils/httpStatus.js"
import { generateTokens } from "../../utils/generateToken.js"

const registerStudent = async (data: {
    studentId: string
    email: string
    password: string
}) => {

    // 1. Verify student exists
    const existingStudent =
        await prisma.student.findUnique({
            where: {
                id: data.studentId,
            },
            select: {
                id: true,
                name: true,
                roll: true,
                registrationNo: true,
            },
        })

    if (!existingStudent) {
        throw new AppError(httpCode.NOT_FOUND, "Student not found")
    }

    // 2. Check already registered
    const existingUser =
        await prisma.user.findFirst({
            where: {
                student: {
                    roll: existingStudent.roll,
                    registrationNo: existingStudent.registrationNo,
                },
            },
        })

    if (existingUser) {
        return new AppError(httpCode.FORBIDDEN, "Student account already registered")
    }

    // 3. Check duplicate email
    const existingEmail =
        await prisma.user.findUnique({
            where: {
                email: data.email,
            },
        })

    if (existingEmail) {
        throw new AppError(httpCode.FORBIDDEN, "Email already in use")
    }

    // 4. Ensure required student data exists
    const loginId = existingStudent.roll
    if (!loginId) {
        throw new AppError(httpCode.BAD_REQUEST, "Student roll is missing")
    }

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // 6. Create user account
    const user = await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: existingStudent.name,
            role: "STUDENT",
            loginId,
            student: {
                connect: {
                    id: data.studentId,
                },
            },
        },
        select: {
            id: true,
            email: true,
            student: {
                select: {
                    id: true,
                    name: true,
                    roll: true,
                    registrationNo: true,
                },
            },
        },
    })

    // `student` is guaranteed to exist because we connected it; use non-null assertion
    const studentData = user.student!

    return {
        success: true,
        message: "Student registered successfully",
        userId: user.id,
        email: user.email,
        studentId: studentData.id,
        name: studentData.name,
        roll: studentData.roll,
        registrationNo: studentData.registrationNo,
    }
}


const login = async (data: {
    identifier: string;
    password: string;
}) => {
    const identifier = data.identifier.trim();

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                {
                    email: {
                        equals: identifier,
                        mode: "insensitive",
                    },
                },
                {
                    phone: identifier,
                },
                {
                    loginId: {
                        equals: identifier,
                        mode: "insensitive",
                    },
                },
            ],

            isActive: true,

        },

        select: {
            id: true,
            loginId: true,
            email: true,
            phone: true,
            password: true,
            role: true,

            student: {
                select: {
                    id: true,
                    roll: true,
                },
            },
        },
    });

    //----------------------------------------
    // Invalid Credentials
    //----------------------------------------

    if (!user || !user.password) {
        throw new AppError(
            httpCode.UNAUTHORIZED,
            "Invalid credentials"
        );
    }

    //----------------------------------------
    // Verify Password
    //----------------------------------------

    const isPasswordMatched =
        await bcrypt.compare(
            data.password,
            user.password
        );

    if (!isPasswordMatched) {
        throw new AppError(
            httpCode.UNAUTHORIZED,
            "Invalid credentials"
        );
    }

    //----------------------------------------
    // Generate Tokens
    //----------------------------------------

    const tokens = generateTokens({
        id: user.id,
        role: user.role,
    });

    //----------------------------------------

    const { password, ...safeUser } = user;

    return {
        user: safeUser,
        ...tokens,
    };
};

export const authService = {
    registerStudent,
    login
}