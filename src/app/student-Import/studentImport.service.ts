import xlsx from "xlsx";

import {
    mapExcelRow,
} from "./studentImport.utils.js";

import {
    validateStudentRow,
} from "./studentImport.validation.js";


import { REQUIRED_HEADERS } from "./studentImport.constants.js";
import type {
    ImportPreviewResponse,
    PreviewStudent,
    DepartmentLookup,
    SemesterLookup,
    RawExcelRow,
} from "./studentImport.types.js";
import ApiError from "../error/ApiError.js";
import httpCode from "../utils/httpStatus.js";
import { prisma } from "../../lib/prisma.js";


const validateHeaders = (
    sheet: xlsx.WorkSheet
) => {
    const rows = xlsx.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
    });

    const headers =
        rows[0] as string[];


    if (!headers?.length) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "Excel file is empty."
        );
    }

    const missingHeaders =
        REQUIRED_HEADERS.filter(
            (header) =>
                !headers.includes(
                    header
                )
        );

    if (
        missingHeaders.length > 0
    ) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            `Missing Excel columns: ${missingHeaders.join(
                ", "
            )}`
        );
    }
};


const generatePreview = async ({
    rows,
    departments,
    semesters,

    existingRolls,
    existingRegistrations,
    existingPhones,

    importedRolls,
    importedRegistrations,
    importedPhones,
}: {
    rows: RawExcelRow[];

    departments: DepartmentLookup[];

    semesters: SemesterLookup[];

    existingRolls: Set<string>;

    existingRegistrations: Set<string>;

    existingPhones: Set<string>;

    importedRolls: Set<string>;

    importedRegistrations: Set<string>;

    importedPhones: Set<string>;
}): Promise<ImportPreviewResponse> => {

    const students: PreviewStudent[] = [];

    let validRows = 0;

    let invalidRows = 0;

    for (const [index, row] of rows.entries()) {

        //------------------------------------
        // Map Excel Row
        //------------------------------------

        const student =
            mapExcelRow(row);

        //------------------------------------
        // Validate
        //------------------------------------

        const preview =
            validateStudentRow(
                index + 2,
                student,

                departments,
                semesters,

                existingRolls,
                existingRegistrations,
                existingPhones,

                importedRolls,
                importedRegistrations,
                importedPhones
            );

        //------------------------------------

        if (preview.valid) {
            validRows++;
        } else {
            invalidRows++;
        }

        students.push(preview);
    }

    //------------------------------------

    return {
        totalRows: rows.length,

        validRows,

        invalidRows,

        students,
    };
};



const previewImport = async (
    filePath: string,
    fileId: string
) => {
    //------------------------------------
    // Read Workbook
    //------------------------------------

    const workbook = xlsx.readFile(filePath);

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "No worksheet found."
        );
    }

    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "Worksheet not found."
        );
    }


    //------------------------------------
    // Validate Header
    //------------------------------------

    validateHeaders(sheet);


    //------------------------------------
    // Parse Rows
    //------------------------------------

    const rows =
        xlsx.utils.sheet_to_json<
            RawExcelRow
        >(sheet, {
            defval: "",
        });

    //------------------------------------
    // Load Lookups
    //------------------------------------

    const [
        departments,
        semesters,
        students,
    ] = await Promise.all([
        prisma.department.findMany({
            select: {
                id: true,
                code: true,
                name: true,
            },
        }),

        prisma.semester.findMany({
            select: {
                id: true,
                number: true,
                name: true,
            },
        }),

        prisma.student.findMany({
            select: {
                roll: true,
                registrationNo: true,
                phone: true,
            },
        }),
    ]);

    //------------------------------------
    // Existing Lookup Sets
    //------------------------------------

    const existingRolls =
        new Set(
            students.map(
                (s) => s.roll
            )
        );

    const existingRegistrations =
        new Set(
            students.map(
                (s) =>
                    s.registrationNo
            )
        );

    const existingPhones =
        new Set(
            students
                .filter(
                    (s) => s.phone
                )
                .map(
                    (s) => s.phone!
                )
        );

    //------------------------------------
    // Excel Duplicate Sets
    //------------------------------------

    const importedRolls =
        new Set<string>();

    const importedRegistrations =
        new Set<string>();

    const importedPhones =
        new Set<string>();

    //------------------------------------
    // Next Part
    //------------------------------------

    const preview = await generatePreview({
        rows,

        departments:
            departments as DepartmentLookup[],

        semesters:
            semesters as SemesterLookup[],

        existingRolls,

        existingRegistrations,

        existingPhones,

        importedRolls,

        importedRegistrations,

        importedPhones,
    });

    return {
        fileId,
        ...preview,
    };
};


const commitImport = async (
    filePath: string
) => {

    //--------------------------------------
    // Read Workbook
    //--------------------------------------

    const workbook =
        xlsx.readFile(filePath);

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "No worksheet found."
        );
    }

    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "Worksheet not found."
        );
    }

    const rows =
        xlsx.utils.sheet_to_json<RawExcelRow>(
            sheet,
            {
                defval: "",
            }
        );

    //--------------------------------------
    // Lookup
    //--------------------------------------

    const [
        departments,
        semesters,
    ] = await Promise.all([
        prisma.department.findMany(),

        prisma.semester.findMany(),
    ]);

    const departmentMap =
        new Map(
            departments.map((d) => [
                d.code.toUpperCase(),
                d.id,
            ])
        );

    const semesterMap =
        new Map(
            semesters.map((s) => [
                s.number,
                s.id,
            ])
        );

    //--------------------------------------

    let imported = 0;

    await prisma.$transaction(
        async (tx) => {

            for (const row of rows) {

                const student =
                    mapExcelRow(row);

                const departmentId =
                    departmentMap.get(
                        student.departmentCode.toUpperCase()
                    );

                const semesterId =
                    semesterMap.get(
                        student.semesterNumber
                    );

                if (
                    !departmentId ||
                    !semesterId
                ) {
                    continue;
                }

                await tx.student.create({
                    data: {

                        name:
                            student.fullName,

                        roll:
                            student.roll,

                        registrationNo:
                            student.registrationNo,

                        phone:
                            student.phone,

                        gender:
                            student.gender,

                        session:
                            student.session,

                        departmentId,

                        semesterId,
                    },
                });

                imported++;
            }
        }
    );

    return {
        imported,
    };
};
import path from "path";
import fs from "fs";

const getPreview = async (
    fileId: string
) => {
    const filePath = path.join(
        process.cwd(),
        "uploads",
        "excel",
        fileId
    );

    if (!fs.existsSync(filePath)) {
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Import file not found."
        );
    }

    return previewImport(
        filePath,
        fileId
    );
};
export const studentImportService = {
    previewImport,
    commitImport,
    getPreview

};

