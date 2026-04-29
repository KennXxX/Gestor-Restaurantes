import jwt from 'jsonwebtoken'

export const validateJWT = (req, res, next) => {
  try {
    let token = req.header('x-token') || req.header('authorization') || req.query.token

    if (!token) {
      return res.status(401).json({ success: false, message: 'No hay token en la petición' })
    }

    token = token.replace(/^Bearer\s+/, '')

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    })

    const userId = decoded.sub || decoded.uid || decoded.id || decoded.userId

    req.adminId = decoded.sub || decoded.uid || null
    req.userRole = decoded.role || decoded.rol || decoded.roleName || null
    req.userId = userId
    req.user = decoded

    next()
  } catch (error) {
    let message = 'Token inválido'
    if (error.name === 'TokenExpiredError') message = 'Token expirado'

    return res.status(401).json({ success: false, message, error: error.message })
  }
}

export const isAdmin = (req, res, next) => {
  if (req.userRole !== 'ADMIN_ROLE') {
    return res.status(403).json({ success: false, message: 'No tienes permisos para esta acción' })
  }
  next()
}
