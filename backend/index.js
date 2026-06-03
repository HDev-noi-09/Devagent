import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
dotenv.config()
import { verifyConnection } from './pineconeClient.js'
import uploadRouter from './routes/upload.js'
import chatRouter from './routes/chat.js'
import resetRouter from './routes/reset.js'
const app=express()

app.use(cors({
  origin: 'http://localhost:5173'
}))

const PORT=process.env.PORT || 3000

app.use(express.json())
app.use('/api',uploadRouter)
app.use('/api', chatRouter)
app.use('/api',resetRouter)
app.get("/", (req, res) => {
  res.send("DevAgent backend is running...")
})


app.listen(PORT, async () => {
   await verifyConnection()
  console.log(`Server running successfully on port ${PORT}`)
})
