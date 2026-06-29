import type { DepartmentLookup } from "../modules/student-Import/studentImport.types.js";


const normalize = (
    value: string
) =>
    value
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();

export const findDepartment = (
    value: string,
    departments: DepartmentLookup[]
) => {
    const search =
        normalize(value);

    return departments.find(
        (department) => {

            const code =
                normalize(
                    department.code
                );

            const fullName =
                normalize(
                    department.name
                );

            const shortName =
                normalize(
                    department.name.replace(
                        /\s+TECHNOLOGY$/i,
                        ""
                    )
                );

            return (
                search === code ||
                search === fullName ||
                search === shortName
            );
        }
    );
};