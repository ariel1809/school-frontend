import { useAuthStore } from '@/store/auth';

/**
 * Shared RBAC types and UI-side access helpers.
 *
 * The backend is the real authority (every endpoint is guarded and the anti-escalation
 * rules live in user-service). These helpers only drive the UI — hide buttons that would
 * 403, and pre-disable choices the actor isn't allowed to make — for a clean experience.
 */

export type Permission = {
  id: string;
  code: string;
  displayName: string;
  description?: string;
  category?: string;
};

export type Role = {
  id: string;
  code: string;
  displayName: string;
  description?: string;
  system: boolean;
  permissions: Permission[];
};

export type RoleRef = { id: string; code: string; displayName: string };

export type ManagedUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  enabled: boolean;
  roles: RoleRef[];
};

export const SUPER_ADMIN = 'SUPER_ADMIN';

const CATEGORY_LABEL: Record<string, string> = {
  users: 'Utilisateurs',
  roles: 'Rôles',
  permissions: 'Permissions',
  audit: 'Audit',
  config: 'Configuration',
  academic: 'Académique',
  students: 'Élèves',
  classrooms: 'Classes',
  teachers: 'Enseignants',
  billing: 'Facturation',
};

export function categoryLabel(category?: string): string {
  if (!category) return 'Autres';
  return CATEGORY_LABEL[category] ?? category;
}

export function groupByCategory(permissions: Permission[]): Array<[string, Permission[]]> {
  const byCategory = new Map<string, Permission[]>();
  permissions.forEach((p) => {
    const cat = p.category || 'autres';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(p);
  });
  return Array.from(byCategory.entries()).sort(([a], [b]) => categoryLabel(a).localeCompare(categoryLabel(b)));
}

/**
 * Reactive snapshot of what the current actor may do, mirroring the backend rules so the
 * UI stays consistent with what the API will accept.
 */
export function useRbacAccess() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];
  const myPermissions = user?.permissions ?? [];

  const isSuperAdmin = roles.includes(SUPER_ADMIN);
  const has = (perm: string) => myPermissions.includes(perm);
  const adminish = isSuperAdmin || roles.includes('ADMIN');

  return {
    isSuperAdmin,
    myPermissions,
    // Roles
    canCreateRole: adminish || has('ROLE_CREATE'),
    canUpdateRole: adminish || has('ROLE_UPDATE'),
    canDeleteRole: adminish || has('ROLE_DELETE'),
    // Permission catalog — creation/edition reserved to SUPER_ADMIN
    canReadPermissions: adminish || has('PERMISSION_READ') || has('ROLE_READ'),
    canManagePermissionCatalog: isSuperAdmin,
    // Users
    canCreateUser: adminish || has('USER_CREATE'),
    canUpdateUser: adminish || has('USER_UPDATE'),
    canDeleteUser: adminish || has('USER_DELETE'),
    canAssignRoles: adminish || has('USER_ASSIGN_ROLES'),
    /** A permission is grantable only if the actor holds it (super admin bypasses). */
    canGrantPermission: (code: string) => isSuperAdmin || myPermissions.includes(code),
    /** A role is assignable only if the actor may grant every permission it carries (and SUPER_ADMIN is reserved). */
    canAssignRole: (role: Role | { code: string; permissions?: Permission[] }) => {
      if (isSuperAdmin) return true;
      if (role.code === SUPER_ADMIN) return false;
      return (role.permissions ?? []).every((p) => myPermissions.includes(p.code));
    },
  };
}