import { Router } from 'express'
import { getStatistics, exportStatisticsPDF } from './statistics.controller.js'
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js'

const router = Router()

router.get('/:restaurantId', validateJWT, isAdmin, getStatistics)
router.get('/:restaurantId/pdf', validateJWT, isAdmin, exportStatisticsPDF)

export default router