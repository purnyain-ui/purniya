import { NextRequest, NextResponse } from 'next/server';
import { ALL_ADMIN_PERMISSIONS, AdminPermissionKey } from '../../../../lib/adminPermissions';
import { findAuthUserByEmail, getServiceSupabase, requireAdmin } from '../../../../lib/supabaseServer';

// Admin accounts: a Supabase Auth login (who you are) plus an admin_users row
// (what you may do). Only this route writes admin_users, using the service role.

const ADMIN_COLUMNS = 'id, full_name, email, role, permissions, is_active, created_at';
const MIN_PASSWORD_LENGTH = 8;

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// Plain keys like 'orders', plus category-scoped 'products:<id>' / 'inventory:<id>'.
function cleanPermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is string =>
      typeof p === 'string' &&
      (ALL_ADMIN_PERMISSIONS.includes(p as AdminPermissionKey) || /^(products|inventory):[\w-]+$/.test(p))
  );
}

function readAdminFields(body: any) {
  return {
    fullName: typeof body?.full_name === 'string' ? body.full_name.trim() : '',
    email: typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '',
    role: typeof body?.role === 'string' && body.role.trim() ? body.role.trim() : 'Sub Administrator',
    permissions: cleanPermissions(body?.permissions),
    password: typeof body?.password === 'string' ? body.password : '',
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req, 'management');
    if ('error' in auth) return fail(auth.error, auth.status);

    const db = getServiceSupabase();
    const { data, error } = await db
      .from('admin_users')
      .select(ADMIN_COLUMNS)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, admins: data || [] });
  } catch (err: any) {
    console.error('Admin users list error:', err);
    return fail(err?.message || 'Failed to load admin users.', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req, 'management');
    if ('error' in auth) return fail(auth.error, auth.status);

    const { fullName, email, role, permissions, password } = readAdminFields(await req.json());
    if (!fullName || !email.includes('@')) return fail('Name and a valid email are required.', 400);
    if (password.length < MIN_PASSWORD_LENGTH) {
      return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 400);
    }

    const db = getServiceSupabase();
    const { data: existing } = await db.from('admin_users').select('id').eq('email', email).maybeSingle();
    if (existing) return fail('An admin with this email already exists.', 409);

    // Create their login. If the email already has one (e.g. they shop on the
    // store), keep it and its password rather than overwrite someone's account.
    let createdAuthUserId: string | null = null;
    let note: string | undefined;
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) {
      const existingUser = await findAuthUserByEmail(db, email);
      if (!existingUser) throw createError;
      note = 'This email already had a login, so its existing password was kept. They sign in with that password.';
    } else {
      createdAuthUserId = created.user?.id ?? null;
    }

    const { data, error } = await db
      .from('admin_users')
      .insert([{ full_name: fullName, email, role, permissions, is_active: true }])
      .select(ADMIN_COLUMNS)
      .single();
    if (error) {
      // Don't leave behind a login we just created for an admin that doesn't exist.
      if (createdAuthUserId) await db.auth.admin.deleteUser(createdAuthUserId);
      throw error;
    }

    return NextResponse.json({ success: true, admin: data, note });
  } catch (err: any) {
    console.error('Admin user create error:', err);
    return fail(err?.message || 'Failed to create admin user.', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req, 'management');
    if ('error' in auth) return fail(auth.error, auth.status);

    const body = await req.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    const { fullName, email, role, permissions, password } = readAdminFields(body);
    if (!id) return fail('Missing admin id.', 400);
    if (!fullName || !email.includes('@')) return fail('Name and a valid email are required.', 400);
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 400);
    }

    const db = getServiceSupabase();
    const { data: current, error: currentError } = await db
      .from('admin_users')
      .select('id, email')
      .eq('id', id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) return fail('No matching admin was found (refresh and try again).', 404);

    const emailChanged = current.email.toLowerCase() !== email;
    if (emailChanged) {
      const { data: clash } = await db.from('admin_users').select('id').eq('email', email).maybeSingle();
      if (clash) return fail('Another admin already uses this email.', 409);
    }

    // Keep their login in step with the new email / password.
    let note: string | undefined;
    if (emailChanged || password) {
      const authUser = await findAuthUserByEmail(db, current.email);
      if (authUser) {
        const { error } = await db.auth.admin.updateUserById(authUser.id, {
          ...(emailChanged ? { email, email_confirm: true } : {}),
          ...(password ? { password } : {}),
        });
        if (error) throw error;
      } else if (password) {
        const { error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
        if (error) throw error;
      } else {
        note = 'This admin has no login yet. Set a password to create one.';
      }
    }

    const { data, error } = await db
      .from('admin_users')
      .update({ full_name: fullName, email, role, permissions })
      .eq('id', id)
      .select(ADMIN_COLUMNS)
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, admin: data, note });
  } catch (err: any) {
    console.error('Admin user update error:', err);
    return fail(err?.message || 'Failed to update admin user.', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req, 'management');
    if ('error' in auth) return fail(auth.error, auth.status);

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return fail('Missing admin id.', 400);
    if (id === auth.session.id) return fail("You can't remove your own admin access.", 400);

    // Removing the admin_users row revokes admin access. Their Supabase login
    // is left alone because the same login may also be a customer account.
    const db = getServiceSupabase();
    const { error } = await db.from('admin_users').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin user delete error:', err);
    return fail(err?.message || 'Failed to delete admin user.', 500);
  }
}
