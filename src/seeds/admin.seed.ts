
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";


export const seedAdmin = async () => {
    const email = "admin@fpi.edu.bd";

    const existingAdmin = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (existingAdmin) {
        console.log("Admin already exists");
        return;
    }

    const hashedPassword = await bcrypt.hash(
        "Admin@123",
        12
    );

    await prisma.user.create({
        data: {
            name: "Assistant Principal",
            email,
            password: hashedPassword,

            role: Role.ADMIN,

            isVerified: true,
            isActive: true,
        },
    });

    console.log("Admin created successfully");
};