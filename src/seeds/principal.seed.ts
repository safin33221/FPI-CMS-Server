import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

export async function seedPrincipal() {
    const adminEmail = "principal@fpi.edu.bd";

    const existingPrincipal =
        await prisma.user.findUnique({
            where: {
                email: adminEmail,
            },
        });

    if (existingPrincipal) {
        console.log(
            "Principal account already exists"
        );
        return;
    }

    const hashedPassword =
        await bcrypt.hash(
            "Admin@123",
            12
        );

    await prisma.user.create({
        data: {
            loginId: "10001",

            name: "Principal",

            email: adminEmail,

            password: hashedPassword,

            role: Role.PRINCIPAL,

            isVerified: true,
            isActive: true,

            mustChangePassword: false,
        },
    });

    console.log(
        "Principal account created"
    );
}