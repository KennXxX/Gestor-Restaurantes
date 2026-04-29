import { Role } from '../src/auth/role.model.js';
import { User, UserProfile, UserEmail } from '../src/users/user.model.js';
import { UserRole } from '../src/auth/role.model.js';
import {
  USER_ROLE,
  ADMIN_ROLE,
  ADMIN_RESTAURANT_ROLE,
} from './role-constants.js';
import { generateUserId } from './uuid-generator.js';
import { hashPassword } from '../utils/password-utils.js';

export const seedData = async () => {
  // Crear roles si no existen
  const roles = [ADMIN_ROLE, USER_ROLE, ADMIN_RESTAURANT_ROLE];
  for (const name of roles) {
    await Role.findOrCreate({
      where: { Name: name },
      defaults: { Id: generateUserId(), Name: name },
    });
  }

  // Verificar si ya existe algún usuario
  const userCount = await User.count();
  if (userCount === 0) {
    const adminRole = await Role.findOne({ where: { Name: ADMIN_ROLE } });
    if (adminRole) {
      const userId = generateUserId();
      const profileId = generateUserId();
      const emailId = generateUserId();
      const userRoleId = generateUserId();
      const password = await hashPassword('Admin1234!');

      // Crear usuario admin
      const adminUser = await User.create({
        Id: userId,
        Name: 'Admin',
        Email: 'admin@gestor.local',
        Password: password,
        IsActive: true,
      });

      await UserProfile.create({
        Id: profileId,
        UserId: userId,
        Imagen: '',
        Phone: '39539423',
      });

      await UserEmail.create({
        Id: emailId,
        UserId: userId,
        EmailVerified: true,
        EmailVerificationToken: null,
        EmailVerificationTokenExpiry: null,
      });

      await UserRole.create({
        Id: userRoleId,
        UserId: userId,
        RoleId: adminRole.Id,
      });
    }
  }
};
