// import {
// DepartmentLookup,
// ParsedStudentRow,
// PreviewStudent,
// SemesterLookup,
// } from "./studentImport.types.js";

import type {
    DepartmentLookup,
    ParsedStudentRow,
    PreviewStudent,
    SemesterLookup,
} from "./studentImport.types.js";

export const validateStudentRow = (
    rowNumber: number,
    student: ParsedStudentRow,
    departments: DepartmentLookup[],
    semesters: SemesterLookup[],
    existingRolls: Set<string>,
    existingRegistrations: Set<string>,
    existingPhones: Set<string>,
    importedRolls: Set<string>,
    importedRegistrations: Set<string>,
    importedPhones: Set<string>,
): PreviewStudent => {
    const errors: string[] = [];

    // Required Fields

    if (!student.fullName)
        errors.push("Full Name is required");

    if (!student.roll)
        errors.push("Roll is required");

    if (!student.registrationNo)
        errors.push(
            "Registration No is required"
        );

    if (!student.phone)
        errors.push("Phone is required");

    if (!student.gender)
        errors.push("Gender is required");

    if (!student.departmentCode)
        errors.push(
            "Department Code is required"
        );

    if (!student.semesterNumber)
        errors.push(
            "Semester is required"
        );

    if (!student.session)
        errors.push("Session is required");

    //--------------------------------------------------
    // Department Exists
    //--------------------------------------------------

    if (
        student.departmentCode &&
        !departments.some(
            (d) =>
                d.code.toUpperCase() ===
                student.departmentCode.toUpperCase()
        )
    ) {
        errors.push(
            "Department not found"
        );
    }

    //--------------------------------------------------
    // Semester Exists
    //--------------------------------------------------

    if (
        student.semesterNumber &&
        !semesters.some(
            (s) =>
                s.number ===
                student.semesterNumber
        )
    ) {
        errors.push(
            "Semester not found"
        );
    }

    //--------------------------------------------------
    // Existing Duplicate
    //--------------------------------------------------

    if (
        existingRolls.has(student.roll)
    ) {
        errors.push(
            "Roll already exists"
        );
    }

    if (
        existingRegistrations.has(
            student.registrationNo
        )
    ) {
        errors.push(
            "Registration No already exists"
        );
    }

    if (
        student.phone &&
        existingPhones.has(student.phone)
    ) {
        errors.push(
            "Phone already exists"
        );
    }

    //--------------------------------------------------
    // Duplicate Inside Excel
    //--------------------------------------------------

    if (
        importedRolls.has(student.roll)
    ) {
        errors.push(
            "Duplicate Roll in Excel"
        );
    } else {
        importedRolls.add(student.roll);
    }

    if (
        importedRegistrations.has(
            student.registrationNo
        )
    ) {
        errors.push(
            "Duplicate Registration No in Excel"
        );
    } else {
        importedRegistrations.add(
            student.registrationNo
        );
    }

    if (student.phone) {
        if (
            importedPhones.has(
                student.phone
            )
        ) {
            errors.push(
                "Duplicate Phone in Excel"
            );
        } else {
            importedPhones.add(
                student.phone
            );
        }
    }

    //--------------------------------------------------

    return {
        row: rowNumber,
        valid: errors.length === 0,
        data: student,
        errors,
    };
};