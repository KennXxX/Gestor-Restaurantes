import { Router } from 'express'
import {
	getAdminStatistics,
	getRestaurantStatistics,
	exportAdminStatisticsPDF,
	exportAdminStatisticsExcel
} from './statistics.controller.js'
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js'

const router = Router()

router.get('/admin/overview', validateJWT, isAdmin, getAdminStatistics)
router.get('/admin/report/pdf', validateJWT, isAdmin, exportAdminStatisticsPDF)
router.get('/admin/report/excel', validateJWT, isAdmin, exportAdminStatisticsExcel)
router.get('/:restaurantId', validateJWT, isAdmin, getRestaurantStatistics)

export default router