import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from "fs";
import { uploadController } from '../controllers/uploadController.js'

const router = express.Router()


const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.originalname.endsWith('.zip')
    ) {
      cb(null, true)
    } else {
      cb(new Error('Only ZIP files are allowed'), false)
    }
  }
})

router.post('/upload', 
     (req, res, next) => {
  console.log("Route hit")
  console.log("Headers:", req.headers['content-type'])
  next()
     },
    upload.single('project'), uploadController)

export default router