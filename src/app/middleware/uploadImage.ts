import { upload } from "./upload.js";

export const uploadImage =
    upload.single("image");