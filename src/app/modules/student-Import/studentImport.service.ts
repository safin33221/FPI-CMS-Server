import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { mapExcelRow } from "./studentImport.utils.js";
import { validateStudentRow } from "./studentImport.validation.js";
import { REQUIRED_HEADERS } from "./studentImport.constants.js";
import type {
    ImportPreviewResponse,
    PreviewStudent,
    DepartmentLookup,
    SemesterLookup,
    RawExcelRow,
} from "./studentImport.types.js";
import ApiError from "../../error/ApiError.js";
import httpCode from "../../utils/httpStatus.js";
import { prisma } from "../../../lib/prisma.js";
import { findDepartment } from "../../utils/studentImport.utils.js";

const validateHeaders = (sheet: xlsx.WorkSheet) => {
    const rows = xlsx.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
    });

    const headers = rows[0] as string[];

    if (!headers?.length) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            "Excel file is empty."
        );
    }

    const missingHeaders = REQUIRED_HEADERS.filter(
        (header) => !headers.includes(header)
    );

    if (missingHeaders.length > 0) {
        throw new ApiError(
            httpCode.BAD_REQUEST,
            `Missing Excel columns: ${missingHeaders.join(", ")}`
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
        const student = mapExcelRow(row);

        const preview = validateStudentRow(
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

        if (preview.valid) {
            validRows++;
        } else {
            invalidRows++;
        }

        students.push(preview);
    }

    return {
        totalRows: rows.length,
        validRows,
        invalidRows,
        students,
    };
};

const previewImport = async (filePath: string, fileId: string) => {
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

    validateHeaders(sheet);

    const rows = xlsx.utils.sheet_to_json<RawExcelRow>(sheet, {
        defval: "",
    });

    const [departments, semesters, dbStudents] = await Promise.all([
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
    // Existing Lookup Sets (Sanitized & Stringified)
    // 💡 Fixes the "Data না থাকলেও already exist দেখায়" issue
    //------------------------------------

    const existingRolls = new Set(
        dbStudents
            .map((s) => String(s.roll ?? "").trim())
            .filter((roll) => roll !== "")
    );

    const existingRegistrations = new Set(
        dbStudents
            .map((s) => String(s.registrationNo ?? "").trim())
            .filter((reg) => reg !== "")
    );

    const existingPhones = new Set(
        dbStudents
            .map((s) => String(s.phone ?? "").trim())
            .filter((phone) => phone !== "")
    );

    //------------------------------------
    // In-Memory Trackers for Duplicate Rows within Excel
    //------------------------------------

    const importedRolls = new Set<string>();
    const importedRegistrations = new Set<string>();
    const importedPhones = new Set<string>();

    const preview = await generatePreview({
        rows,
        departments: departments as DepartmentLookup[],
        semesters: semesters as SemesterLookup[],
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

const getPreview = async (fileId: string) => {
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

    return previewImport(filePath, fileId);
};

const commitImport = async (fileId: string) => {
    // 💡 Vercel Support: Vercel-এ /tmp/uploads এবং Local-এ uploads ফোল্ডার চেক করবে
    const uploadRoot = process.env.VERCEL
        ? path.join("/tmp", "uploads")
        : path.join(process.cwd(), "uploads");

    const filePath = path.join(uploadRoot, "excel", fileId);

    if (!fs.existsSync(filePath)) {
        throw new ApiError(
            httpCode.NOT_FOUND,
            "Import file not found."
        );
    }

    //--------------------------------------
    // Read Workbook
    //--------------------------------------

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

    validateHeaders(sheet);

    const rows = xlsx.utils.sheet_to_json<RawExcelRow>(sheet, {
        defval: "",
    });

    //--------------------------------------
    // Load Lookups
    //--------------------------------------

    const [departments, semesters] = await Promise.all([
        prisma.department.findMany(),
        prisma.semester.findMany(),
    ]);

    const semesterMap = new Map(
        semesters.map((semester) => [semester.number, semester.id])
    );

    //--------------------------------------
    // Prepare Data for Bulk Insertion
    //--------------------------------------

    const studentsToCreate: Array<{
        name: string;
        roll: string;
        registrationNo: string;
        phone: string | null;
        session: string;
        departmentId: string;
        semesterId: string;
    }> = [];

    for (const row of rows) {
        const student = mapExcelRow(row);

        const department = findDepartment(
            student.departmentCode,
            departments
        );

        const semesterId = semesterMap.get(
            student.semesterNumber
        );

        if (!department || !semesterId) {
            continue;
        }

        const rollStr = String(student.roll ?? "").trim();
        const regStr = String(student.registrationNo ?? "").trim();

        // Roll বা Registration না থাকলে স্কিপ করবে
        if (!rollStr || !regStr) {
            continue;
        }

        studentsToCreate.push({
            name: student.fullName,
            roll: rollStr,
            registrationNo: regStr,
            phone: student.phone ? String(student.phone).trim() : null,
            session: student.session,
            departmentId: department.id,
            semesterId,
        });
    }

    //--------------------------------------
    // Batch Insert (Prevents Transaction Timeout)
    //--------------------------------------

    let importedCount = 0;

    if (studentsToCreate.length > 0) {
        const result = await prisma.student.createMany({
            data: studentsToCreate,
            skipDuplicates: true, // DB Level ডুপ্লিকেট রোল/রেজিস্ট্রেশন থাকলে ক্র্যাশ না করে স্কিপ করবে
        });

        importedCount = result.count;
    }

    // (Optional) প্রসেস শেষে ফাইলটি ডিলিট করে দিতে পারেন
    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        console.error("Failed to delete temp file:", error);
    }

    return {
        imported: importedCount,
        skipped: rows.length - importedCount,
        total: rows.length,
    };
};

export const studentImportService = {
    previewImport,
    commitImport,
    getPreview,
};