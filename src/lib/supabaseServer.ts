// lib/supabaseServer.ts
// Supabase clients for API routes only. Never import this from client components:
// SUPABASE_SERVICE_ROLE_KEY bypasses row-level security.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdminPermissionKey, AdminSession, sessionFromAdminRecord, hasPermission } from './adminPermissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const serverAuthOptions = { auth: { persistSession: false, autoRefreshToken: false } };

/** Service-role client. Throws if the key isn't configured. */
export function getServiceSupabase(): SupabaseClient {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server.');
  }
  return createClient(supabaseUrl, serviceRoleKey, serverAuthOptions);
}

/** Client for reading public catalog data: service role when available, otherwise anon. */
export function getCatalogSupabase(): SupabaseClient {
  if (!supabaseUrl || !(serviceRoleKey || anonKey)) {
    throw new Error('Supabase is not configured on the server.');
  }
  return createClient(supabaseUrl, serviceRoleKey || anonKey, serverAuthOptions);
}

/**
 * Confirms the request comes from a signed-in, active admin who holds `permission`.
 * The caller sends its Supabase access token as `Authorization: Bearer <token>`.
 */
export async function requireAdmin(
  request: Request,
  permission: AdminPermissionKey
): Promise<{ session: AdminSession } | { error: string; status: number }> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { error: 'Not signed in.', status: 401 };

  const db = getServiceSupabase();
  const { data: userData, error: userError } = await db.auth.getUser(token);
  const email = userData?.user?.email?.toLowerCase();
  if (userError || !email) return { error: 'Your session has expired. Please sign in again.', status: 401 };

  const { data: record } = await db
    .from('admin_users')
    .select('id, email, full_name, role, is_active, permissions')
    .eq('email', email)
    .maybeSingle();

  if (!record || !record.is_active) return { error: 'Not an active administrator.', status: 403 };

  const session = sessionFromAdminRecord(record, 'supabase');
  if (!hasPermission(session, permission)) {
    return { error: 'You do not have permission to do this.', status: 403 };
  }
  return { session };
}

/** Supabase has no lookup-by-email in the admin API, so page through users. */
export async function findAuthUserByEmail(db: SupabaseClient, email: string) {
  const target = email.trim().toLowerCase();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < perPage) return null;
  }
}
