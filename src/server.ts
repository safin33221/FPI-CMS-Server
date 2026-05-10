import app from "./app.js";
import { envConfig } from "./app/config/env.config.js";
import { prisma } from "./lib/prisma.js";

async function StartServer() {
    try {
        await prisma.$connect();
        console.log("Database Connected");
        const server = app.listen(envConfig.PORT, () => {
            console.log(`Server is running on port 5000`);
        })

        const shutdown = async (signal: string) => {
            console.log(`⚠️  ${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                try {
                    await prisma.$disconnect();
                    console.log("🛑 Database disconnected");
                    process.exit(0);
                } catch (err) {
                    console.error("❌ Error during shutdown", err);
                    process.exit(1);
                }
            });
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    } catch (error) {
        console.error("❌ Server startup failed", error);
        process.exit(1);
    }
}
(async () => {
    await StartServer();
})();