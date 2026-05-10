import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';


const app: Application = express();

app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));

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
