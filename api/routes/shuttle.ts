import express, { type Request, type Response } from 'express'
import { dataStore } from '../store/dataStore.js'
import type { CrowdLevel } from '@shared/types'

const router = express.Router()

const stats = [
  { routeName: '园区环线A线', onTimeRate: 0.96, totalTrips: 432, avgDelay: 0.8 },
  { routeName: '东西主干B线', onTimeRate: 0.93, totalTrips: 360, avgDelay: 1.5 },
  { routeName: '地铁接驳C线', onTimeRate: 0.85, totalTrips: 248, avgDelay: 3.2 },
]

router.get('/routes', (_req: Request, res: Response) => {
  const routes = dataStore.getRoutes()
  res.json({
    success: true,
    data: routes,
  })
})

router.get('/routes/:id', (req: Request, res: Response) => {
  const route = dataStore.getRouteById(req.params.id)
  if (!route) {
    return res.status(404).json({ success: false, error: 'Route not found' })
  }
  res.json({
    success: true,
    data: route,
  })
})

router.get('/vehicles', (_req: Request, res: Response) => {
  const vehicles = dataStore.getVehicles()
  res.json({
    success: true,
    data: vehicles,
  })
})

router.get('/vehicles/:id', (req: Request, res: Response) => {
  const vehicle = dataStore.getVehicleById(req.params.id)
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' })
  }
  res.json({
    success: true,
    data: vehicle,
  })
})

router.post('/vehicles/report', (req: Request, res: Response) => {
  const { vehicleId, position, progress, stationIndex } = req.body
  if (!vehicleId || !position || progress === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: vehicleId, position, progress',
    })
  }
  const vehicle = dataStore.getVehicleById(vehicleId)
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' })
  }
  const actualStationIndex =
    stationIndex !== undefined ? stationIndex : vehicle.currentStationIndex
  dataStore.updateVehicleProgress(vehicleId, progress, position, actualStationIndex)
  res.json({
    success: true,
    message: '位置上报成功',
    data: { vehicleId, position, progress, timestamp: Date.now() },
  })
})

router.post('/vehicles/:id/crowd', (req: Request, res: Response) => {
  const { id } = req.params
  const { level } = req.body
  const vehicle = dataStore.getVehicleById(id)
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' })
  }
  const crowdLevel = level as CrowdLevel
  const votes = { ...vehicle.crowdVotes, [crowdLevel]: vehicle.crowdVotes[crowdLevel] + 1 }
  const total = votes.loose + votes.normal + votes.crowded
  let finalCrowdLevel: CrowdLevel = 'normal'
  if (total > 0) {
    const pL = votes.loose / total
    const pC = votes.crowded / total
    if (pL > pC && pL > 0.4) finalCrowdLevel = 'loose'
    else if (pC > pL && pC > 0.4) finalCrowdLevel = 'crowded'
  }
  dataStore.updateVehicleProgress(
    id,
    vehicle.progress,
    vehicle.position,
    vehicle.currentStationIndex
  )
  res.json({
    success: true,
    message: '反馈已记录',
    data: { vehicleId: id, level: finalCrowdLevel, votes },
  })
})

router.get('/stats/punctuality', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: stats,
  })
})

export default router
