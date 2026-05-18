import bcrypt from "bcrypt"
import { prisma } from "../../../lib/prisma.js"
import ApiError from "../../error/ApiError.js"
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
        throw new ApiError(httpCode.NOT_FOUND, "Student not found")
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
        return new ApiError(httpCode.FORBIDDEN, "Student account already registered")
    }

    // 3. Check duplicate email
    const existingEmail =
        await prisma.user.findUnique({
            where: {
                email: data.email,
            },
        })

    if (existingEmail) {
        throw new ApiError(httpCode.FORBIDDEN, "Email already in use")
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // 5. Create user account
    const user = await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: existingStudent.name,
            role: "STUDENT",
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


const login = async (data: { email: string, password: string }) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
        select: {
            id: true,
            password: true,
            role: true,
            student: {
                select: {
                    roll: true
                }
            }
        }

    })


    //Check User exist
    if (!user) {
        throw new ApiError(httpCode.NOT_FOUND, "User not found with this email")
    }

    const isPasswordMatched = await bcrypt.compare(
        data.password,
        user.password
    );

    if (!isPasswordMatched) {
        throw new ApiError(httpCode.FORBIDDEN, "Invalid password");
    }

    const tokens = generateTokens(user);
    const { password, ...safeUser } = user
    return {
        user: safeUser,
        ...tokens,
    };

}
export const authService = {
    registerStudent,
    login
}