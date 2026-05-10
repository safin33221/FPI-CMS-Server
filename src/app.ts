import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import router from './app/routes/index.route.js';


const app: Application = express();

app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));



// api routes
app.use("api/v2", router);

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


export default app;
