import fs from "fs";
import path from "path";
import multer from "multer";

const uploadRoot = path.join(process.cwd(), "uploads");

const ensureDir = (folder: string) => {
    const dir = path.join(uploadRoot, folder);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true,
        });
    }

    return dir;
};

export const createUploader = (
    fieldName: string,
    folder: "excel" | "images" | "documents"
) => {
    const storage = multer.diskStorage({
        destination(req, file, cb) {
            cb(null, ensureDir(folder));
        },

        filename(req, file, cb) {
            const ext = path.extname(file.originalname);

            const unique =
                `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

            cb(null, `${unique}${ext}`);
        },
    });

    const upload = multer({
        storage,

        limits: {
            fileSize: 10 * 1024 * 1024, // 10 MB
        },

        fileFilter(req, file, cb) {
            if (folder === "excel") {
                const allowed = [
                    ".xlsx",
                    ".xls",
                    ".csv",
                ];

                const ext = path
                    .extname(file.originalname)
                    .toLowerCase();

                if (!allowed.includes(ext)) {
                    return cb(
                        new Error(
                            "Only Excel or CSV files are allowed."
                        )
                    );
                }
            }

            if (folder === "images") {
                if (
                    !file.mimetype.startsWith("image/")
                ) {
                    return cb(
                        new Error(
                            "Only image files are allowed."
                        )
                    );
                }
            }

            cb(null, true);
        },
    });

    return upload.single(fieldName);
};