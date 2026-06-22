import express, { type Request, type Response } from 'express'
import { dataStore } from '../store/dataStore.js'

const router = express.Router()

const MOCK_USER_ID = 'user_demo_001'

router.post('/qrcode/generate', (req: Request, res: Response) => {
  const { vehicleId, stationId } = req.body
  if (!vehicleId || !stationId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: vehicleId, stationId',
    })
  }

  const vehicle = dataStore.getVehicleById(vehicleId)
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' })
  }

  try {
    const { token, tripId, expiresAt } = dataStore.generateQRToken(vehicleId, stationId)
    const route = dataStore.getRouteById(vehicle.routeId)
    const trip = dataStore.getActiveTrip(vehicleId)

    res.json({
      success: true,
      data: {
        token,
        tripId,
        expiresAt,
        vehicleId,
        routeId: vehicle.routeId,
        routeName: route?.name ?? '',
        stationId,
        stationName: route?.stations.find((s) => s.id === stationId)?.name ?? '',
        passengerCount: trip?.passengerCount ?? 0,
        qrData: JSON.stringify({
          token,
          vehicleId,
          routeId: vehicle.routeId,
          tripId,
          timestamp: Date.now(),
        }),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate QR code'
    res.status(500).json({ success: false, error: msg })
  }
})

router.post('/checkin', (req: Request, res: Response) => {
  const { token, userId } = req.body
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: token',
    })
  }

  const actualUserId = userId || MOCK_USER_ID
  const record = dataStore.checkIn(actualUserId, token)

  if (!record) {
    return res.status(400).json({
      success: false,
      error: '二维码已过期或无效',
    })
  }

  const vehicle = dataStore.getVehicleById(record.vehicleId)
  const route = dataStore.getRouteById(record.routeId)
  const station = route?.stations.find((s) => s.id === record.stationId)

  res.json({
    success: true,
    message: '签到成功',
    data: {
      ...record,
      vehiclePlate: vehicle?.plateNumber ?? '',
      routeName: route?.name ?? '',
      stationName: station?.name ?? '',
      crowdLevel: vehicle?.crowdLevel ?? 'normal',
      passengerCount: dataStore.getActiveTrip(record.vehicleId)?.passengerCount ?? 0,
    },
  })
})

router.get('/records', (req: Request, res: Response) => {
  const { userId, vehicleId, routeId, date } = req.query
  const records = dataStore.getCheckInRecords({
    userId: userId as string | undefined,
    vehicleId: vehicleId as string | undefined,
    routeId: routeId as string | undefined,
    date: date as string | undefined,
  })

  res.json({
    success: true,
    data: records,
  })
})

router.get('/stats', (req: Request, res: Response) => {
  const { date, routeId } = req.query
  const targetDate = (date as string) || new Date().toISOString().split('T')[0]
  const stats = dataStore.getRideStats(targetDate, routeId as string | undefined)

  res.json({
    success: true,
    data: stats,
  })
})

router.get('/active/:userId', (req: Request, res: Response) => {
  const { userId } = req.params
  const record = dataStore.getUserActiveCheckIn(userId || MOCK_USER_ID)

  if (!record) {
    return res.json({
      success: true,
      data: null,
    })
  }

  const vehicle = dataStore.getVehicleById(record.vehicleId)
  const route = dataStore.getRouteById(record.routeId)
  const station = route?.stations.find((s) => s.id === record.stationId)
  const trip = dataStore.getActiveTrip(record.vehicleId)

  res.json({
    success: true,
    data: {
      ...record,
      vehiclePlate: vehicle?.plateNumber ?? '',
      routeName: route?.name ?? '',
      stationName: station?.name ?? '',
      crowdLevel: vehicle?.crowdLevel ?? 'normal',
      passengerCount: trip?.passengerCount ?? 0,
    },
  })
})

router.get('/trip/:vehicleId', (req: Request, res: Response) => {
  const { vehicleId } = req.params
  const trip = dataStore.getActiveTrip(vehicleId)

  if (!trip) {
    return res.json({
      success: true,
      data: null,
    })
  }

  const vehicle = dataStore.getVehicleById(vehicleId)
  const route = dataStore.getRouteById(trip.routeId)

  res.json({
    success: true,
    data: {
      ...trip,
      vehiclePlate: vehicle?.plateNumber ?? '',
      routeName: route?.name ?? '',
    },
  })
})

export default router
