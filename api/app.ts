/**
 * 园区摆渡车追踪系统 API Server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import shuttleRoutes from './routes/shuttle.js'
import reminderRoutes from './routes/reminder.js'
import checkinRoutes from './routes/checkin.js'
import { vehicleTrackingService } from './services/vehicleTrackingService.js'
import { wechatPushService } from './services/wechatPushService.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/shuttle', shuttleRoutes)
app.use('/api/reminder', reminderRoutes)
app.use('/api/checkin', checkinRoutes)

vehicleTrackingService.start()
wechatPushService.start()

app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'Shuttle Tracking API - OK',
      timestamp: new Date().toISOString(),
    })
  },
)

app.use((_error: Error, _req: Request, res: Response): void => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
