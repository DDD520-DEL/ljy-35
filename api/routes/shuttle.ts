import express, { type Request, type Response } from 'express'

const router = express.Router()

const routes = [
  {
    id: 'route-a',
    name: '园区环线A线',
    shortName: 'A线',
    color: '#0EA5E9',
    stations: 9,
  },
  {
    id: 'route-b',
    name: '东西主干B线',
    shortName: 'B线',
    color: '#14B8A6',
    stations: 5,
  },
  {
    id: 'route-c',
    name: '地铁接驳C线',
    shortName: 'C线',
    color: '#8B5CF6',
    stations: 5,
  },
]

const stats = [
  { routeName: '园区环线A线', onTimeRate: 0.96, totalTrips: 432, avgDelay: 0.8 },
  { routeName: '东西主干B线', onTimeRate: 0.93, totalTrips: 360, avgDelay: 1.5 },
  { routeName: '地铁接驳C线', onTimeRate: 0.85, totalTrips: 248, avgDelay: 3.2 },
]

router.get('/routes', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: routes,
  })
})

router.get('/routes/:id', (req: Request, res: Response) => {
  const route = routes.find((r) => r.id === req.params.id)
  if (!route) {
    return res.status(404).json({ success: false, error: 'Route not found' })
  }
  res.json({
    success: true,
    data: route,
  })
})

router.post('/vehicles/report', (req: Request, res: Response) => {
  const { vehicleId, position, progress } = req.body
  res.json({
    success: true,
    message: '位置上报成功',
    data: { vehicleId, position, progress, timestamp: Date.now() },
  })
})

router.post('/vehicles/:id/crowd', (req: Request, res: Response) => {
  const { id } = req.params
  const { level } = req.body
  res.json({
    success: true,
    message: '反馈已记录',
    data: { vehicleId: id, level },
  })
})

router.get('/stats/punctuality', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: stats,
  })
})

export default router
