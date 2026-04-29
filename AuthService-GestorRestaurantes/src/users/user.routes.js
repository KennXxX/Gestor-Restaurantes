import { Router } from 'express';
import {
  updateUserRole,
  getUserRoles,
  getUsersByRole,
  createAdminRestaurant,
} from './user.controller.js';

import { validateJWT } from '../../middlewares/validate-JWT.js';
import { findUserById } from '../../helpers/user-db.js';
import { User } from './user.model.js';
import { UserProfile, UserEmail } from './user.model.js';
import { UserRole, Role } from '../auth/role.model.js';
import { ADMIN_ROLE } from '../../helpers/role-constants.js';

const router = Router();

// POST /api/v1/users/admin-restaurant
router.post('/admin-restaurant', ...createAdminRestaurant);

// PUT /api/v1/users/:userId/role
router.put('/:userId/role', ...updateUserRole);

// GET /api/v1/users/:userId/roles
router.get('/:userId/roles', ...getUserRoles);

// GET /api/v1/users/by-role/:roleName
router.get('/by-role/:roleName', ...getUsersByRole);

// GET /api/v1/users/all
router.get('/all', validateJWT, async (req, res) => {
  // Verificar que el usuario sea admin
  const user = req.user;
  const roles = user.UserRoles?.map((ur) => ur.Role?.Name) || [];
  if (!roles.includes(ADMIN_ROLE)) {
    return res.status(403).json({ success: false, message: 'Acceso restringido solo para administradores.' });
  }

  // Obtener todos los usuarios con relaciones
  const users = await User.findAll({
    include: [
      { model: UserProfile, as: 'UserProfile' },
      { model: UserEmail, as: 'UserEmail' },
      {
        model: UserRole,
        as: 'UserRoles',
        include: [{ model: Role, as: 'Role' }],
      },
    ],
  });

  return res.status(200).json({ success: true, users });
});

export default router;
