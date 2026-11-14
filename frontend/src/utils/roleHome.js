export const ROLE_HOME_MAP = {
  STUDENT: '/student',
  TEACHER: '/teacher',
  ADMIN: '/admin',
  SUPER_ADMIN: '/super',
};

/**
 * Returns the canonical home path for a given user role, or '/' for guests.
 */
export function getRoleHome(role) {
  return ROLE_HOME_MAP[role] || '/';
}
