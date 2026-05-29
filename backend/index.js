import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
import { verifyConnection } from './pineconeClient.js'
import uploadRouter from './routes/upload.js'
import chatRouter from './routes/chat.js'
import resetRouter from './routes/reset.js'
const app=express()

const PORT=process.env.PORT || 3000

app.use(express.json())
app.use('/uploadfile',uploadRouter)
app.use('/apichat', chatRouter)
app.use('/resetapi',resetRouter)
app.get("/", (req, res) => {
  res.send("DevAgent backend is running...")
})


app.listen(PORT, async () => {
   await verifyConnection()
  console.log(`Server running successfully on port ${PORT}`)
})
