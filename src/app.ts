import express, { type Application, type Request, type Response } from 'express'



const app: Application = express()
const port = 5000

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})



export default app
