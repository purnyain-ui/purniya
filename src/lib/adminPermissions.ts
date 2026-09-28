// lib/adminPermissions.ts
// Central place for admin RBAC logic — used by the login page and admin layout.

export type AdminPermissionKey =
  | 'dashboard'
  | 'home'
  | 'products'
  | 'categories'
  | 'attributes'
  | 'orders'
  | 'inventory'
  | 'payments'
  | 'customers'
  | 'shipping'
  | 'returns'
  | 'coupons'
  | 'banners'
  | 'reports'
  | 'management';

export const ALL_ADMIN_PERMISSIONS: AdminPermissionKey[] = [
  'dashboard',
  'home',
  'products',
  'categories',
  'attributes',
  'orders',
  'inventory',
  'payments',
  'customers',
  'shipping',
  'returns',
  'coupons',
  'banners',
  'reports',
  'management',
];

export interface AdminSession {
  id?: string;
  email: string;
  fullName: string;
  role: string;
  permissions: AdminPermissionKey[];
  loginTime: string;
  authMethod: 'supabase' | 'local' | 'dev';
}

export const SUPER_ADMIN_ROLE = 'Super Administrator';

/** True if this role has unrestricted access regardless of the permissions array. */
export function isSuperAdmin(role: string | null | undefined): boolean {
  if (!role) return false;
  return role.trim().toLowerCase() === SUPER_ADMIN_ROLE.toLowerCase();
}

/** True if the session can access a given permission key. */
export function hasPermission(
  session: AdminSession | null,
  key: AdminPermissionKey
): boolean {
  if (!session) return false;
  if (isSuperAdmin(session.role)) return true;
  return Array.isArray(session.permissions) && session.permissions.includes(key);
}

/** Reads the stored admin session from localStorage. Returns null if absent/invalid. */
export function readAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('purnya_admin_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      id: parsed.id,
      email: parsed.email ?? '',
      fullName: parsed.fullName ?? parsed.full_name ?? '',
      role: parsed.role ?? '',
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
      loginTime: parsed.loginTime ?? '',
      authMethod: parsed.authMethod ?? 'local',
    };
  } catch {
    return null;
  }
}

export function writeAdminSession(session: AdminSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('purnya_admin_authenticated', 'true');
  localStorage.setItem('purnya_admin_session', JSON.stringify(session));
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('purnya_admin_authenticated');
  localStorage.removeItem('purnya_admin_session');
}

/** True if there is currently an active administrator session */
export function hasActiveAdminSession(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    localStorage.getItem('purnya_admin_authenticated') === 'true' &&
    readAdminSession() !== null
  );
}

/** True if an email corresponds to an active or known administrator account */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (clean === 'admin@purnya.com') return true;
  const session = readAdminSession();
  if (session && session.email?.trim().toLowerCase() === clean) {
    return true;
  }
  return false;
}


/** Maps a pathname like /admin/products/123 to the permission key that guards it. */
export function permissionKeyForPath(pathname: string): AdminPermissionKey | null {
  if (pathname === '/admin') return 'dashboard';
  const map: { prefix: string; key: AdminPermissionKey }[] = [
    { prefix: '/admin/home', key: 'home' },
    { prefix: '/admin/products', key: 'products' },
    { prefix: '/admin/categories', key: 'categories' },
    { prefix: '/admin/attributes', key: 'attributes' },
    { prefix: '/admin/orders', key: 'orders' },
    { prefix: '/admin/inventory', key: 'inventory' },
    { prefix: '/admin/payments', key: 'payments' },
    { prefix: '/admin/customers', key: 'customers' },
    { prefix: '/admin/shipping', key: 'shipping' },
    { prefix: '/admin/returns', key: 'returns' },
    { prefix: '/admin/coupons', key: 'coupons' },
    { prefix: '/admin/banners', key: 'banners' },
    { prefix: '/admin/reports', key: 'reports' },
    { prefix: '/admin/management', key: 'management' },
  ];
  const match = map.find((m) => pathname.startsWith(m.prefix));
  return match ? match.key : null;
}

// Accept both a JSON array and a JSON-encoded array from the saved session.
export function normalizePermissions(value: unknown): string[] {
  if (typeof value === 'string') {
    try {
      return normalizePermissions(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export function getProductAccess(session: AdminSession | null) {
  const permissions = normalizePermissions(session?.permissions);
  // A scoped permission must never grant access to every category.
  const all = Boolean(session && isSuperAdmin(session.role)) || permissions.includes('products');
  const categoryIds = Array.from(
    new Set(
      permissions
        .filter((permission) => permission.startsWith('products:'))
        .map((permission) => permission.slice('products:'.length).trim())
        .filter(Boolean)
    )
  );
  return { all, categoryIds, visible: all || categoryIds.length > 0 };
}

export function getInventoryAccess(session: AdminSession | null) {
  const permissions = normalizePermissions(session?.permissions);
  const all = Boolean(session && isSuperAdmin(session.role)) || permissions.includes('inventory');
  const categoryIds = Array.from(
    new Set(
      permissions
        .filter((permission) => permission.startsWith('inventory:'))
        .map((permission) => permission.slice('inventory:'.length).trim())
        .filter(Boolean)
    )
  );
  return { all, categoryIds, visible: all || categoryIds.length > 0 };
}