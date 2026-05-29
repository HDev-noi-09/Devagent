import express from 'express'
import { resetController } from '../controllers/resetController.js'

const router = express.Router()

router.delete('/reset', resetController)

export default router