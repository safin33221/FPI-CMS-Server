import { prisma } from "../lib/prisma.js";

export const seedDepartments = async () => {
    const departments = [
        {
            name: "Computer Technology",
            code: "CMT",
        },
        {
            name: "Civil Technology",
            code: "CVT",
        },
        {
            name: "Electrical Technology",
            code: "ET",
        },
        {
            name: "Mechanical Technology",
            code: "MT",
        },
        {
            name: "Power Technology",
            code: "PT",
        },
        {
            name: "Electronics Technology",
            code: "ECT",
        },
        {
            name: "RAC Technology",
            code: "RACT",
        },
        {
            name: "Automobile Technology",
            code: "AT",
        },
        {
            name: "Food Technology",
            code: "FT",
        },
        {
            name: "Architecture Technology",
            code: "ARCH",
        },
    ];

    for (const department of departments) {
        await prisma.department.upsert({
            where: {
                code: department.code,
            },
            update: {
                name: department.name,
            },
            create: {
                name: department.name,
                code: department.code,
            },
        });
    }

    console.log("Departments seeded successfully");
};