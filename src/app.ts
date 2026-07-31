import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import router from './app/routes/index.route.js';
import notFound from './app/middleware/notFound.js';
import globalErrorHandler from './app/middleware/globalErrorHandler.js';
import cookieParser from 'cookie-parser';


const app: Application = express();


app.use(cookieParser())
app.use(express.json());
// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Include if using Vite locally
  process.env.FRONTEND_URL,
  "https://fpi-cms.vercel.app" // Add your deployed frontend URL via environment variable
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed array or matches a Vercel preview URL pattern
      const isAllowed = allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.urlencoded({ extended: true }));



// api routes
app.use("/api/v2", router);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is running successfully',
    data: {
      name: 'FPI Campus Management System',
      version: '1.0.0'
    }
  });
});
app.use(globalErrorHandler);
app.use(notFound)


export default app;
