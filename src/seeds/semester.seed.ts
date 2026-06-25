import { prisma } from "../lib/prisma.js";

export const seedSemesters = async () => {
    const semesters = [
        {
            name: "1st Semester",
            number: 1,
        },
        {
            name: "2nd Semester",
            number: 2,
        },
        {
            name: "3rd Semester",
            number: 3,
        },
        {
            name: "4th Semester",
            number: 4,
        },
        {
            name: "5th Semester",
            number: 5,
        },
        {
            name: "6th Semester",
            number: 6,
        },
        {
            name: "7th Semester",
            number: 7,
        },
        {
            name: "8th Semester",
            number: 8,
        },
    ];
    for (const semester of semesters) {
        await prisma.semester.upsert({
            where: {
                number: semester.number,
            },
            update: {
                name: semester.name,
            },
            create: {
                name: semester.name,
                number: semester.number,
            },
        });
    }

    console.log("Semesters seeded successfully");
};