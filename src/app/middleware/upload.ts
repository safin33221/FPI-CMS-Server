import fs from "fs";
import path from "path";
import multer from "multer";
import type { RequestHandler } from "express";


const uploadRoot = process.env.VERCEL
    ? "/tmp/uploads"
    : path.join(process.cwd(), "uploads");


const ensureDir = (folder: string): string => {
    const dir = path.join(uploadRoot, folder);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true,
        });
    }

    return dir;
};


const generateFileName = (originalName: string): string => {
    const ext = path.extname(originalName).toLowerCase();

    const uniqueName = `${Date.now()}-${crypto.randomUUID()}`;

    return `${uniqueName}${ext}`;
};


export const createUploader = (
    fieldName: string,
    folder: "excel" | "images" | "documents"
): RequestHandler => {

    const storage = multer.diskStorage({

        destination(req, file, cb) {
            cb(null, ensureDir(folder));
        },


        filename(req, file, cb) {
            cb(
                null,
                generateFileName(file.originalname)
            );
        },

    });


    const upload = multer({

        storage,


        limits: {
            fileSize: 10 * 1024 * 1024,
        },


        fileFilter(req, file, cb) {

            const ext = path
                .extname(file.originalname)
                .toLowerCase();


            if (folder === "excel") {

                const allowed = [
                    ".xlsx",
                    ".xls",
                    ".csv",
                ];


                if (!allowed.includes(ext)) {
                    return cb(
                        new Error(
                            "Only Excel or CSV files are allowed."
                        )
                    );
                }
            }


            if (folder === "images") {

                if (!file.mimetype.startsWith("image/")) {

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