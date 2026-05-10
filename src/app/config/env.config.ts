import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const get = (key: string, fallback?: string): string => {
    const value = process.env[key];
    if (!value && fallback === undefined) throw new Error(`Missing env: ${key}`);
    return value ?? fallback!;
};

const num = (key: string, fallback?: number): number => {
    const val = process.env[key];
    if (!val && fallback !== undefined) return fallback;
    const n = Number(val);
    if (isNaN(n)) throw new Error(`Env ${key} must be a number`);
    return n;
};

export const envConfig = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: num("PORT", 3000),
    JWT_SECRET: get("JWT_SECRET", "default_secret_change_me"),
};