import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { can } from "@/lib/authorization";
import prisma from "@/lib/prisma";

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "AIRPORT_ADMIN";
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.active ? "ACTIVE" : "INACTIVE",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_USERS")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(
      { users: users.map(serializeUser) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Gagal mengambil akun administrator" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_USERS")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    password?: string;
    role?: "SUPER_ADMIN" | "AIRPORT_ADMIN";
  } | null;

  if (!body?.name || !body?.email || !body?.password) {
    return NextResponse.json({ error: "Nama, email, dan kata sandi wajib diisi" }, { status: 400 });
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();
  const password = body.password;
  const role = body.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "AIRPORT_ADMIN";

  if (name.length < 2) return NextResponse.json({ error: "Nama minimal 2 karakter" }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Kata sandi minimal 8 karakter" }, { status: 400 });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah digunakan oleh akun lain" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          role,
          passwordHash,
          active: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "CREATE_ADMIN_USER",
          entityType: "User",
          entityId: email,
          after: { name, email, role },
        },
      });

      return user;
    });

    return NextResponse.json({ user: serializeUser(newUser) }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Gagal membuat akun administrator" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_USERS")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    active?: boolean;
    name?: string;
    email?: string;
    password?: string;
    role?: "SUPER_ADMIN" | "AIRPORT_ADMIN";
  } | null;

  if (!body?.id) return NextResponse.json({ error: "Data akun tidak valid" }, { status: 400 });

  try {
    const existing = await prisma.user.findUnique({ where: { id: body.id } });
    if (!existing) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

    // Jangan izinkan mengubah status akun sendiri agar admin tidak terkunci
    if (body.id === session.user.id && body.active === false) {
      return NextResponse.json({ error: "Anda tidak dapat menonaktifkan akun yang sedang digunakan" }, { status: 422 });
    }

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();

    if (body.name !== undefined && (!name || name.length < 2)) {
      return NextResponse.json({ error: "Nama minimal 2 karakter" }, { status: 400 });
    }
    if (body.email !== undefined && (!email || !/^\S+@\S+\.\S+$/.test(email))) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }
    if (body.password && body.password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
    }

    // Jika ganti email, pastikan email belum dipakai
    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json({ error: "Email sudah digunakan oleh akun lain" }, { status: 409 });
      }
    }

    const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : undefined;
    const role = body.role && session.user.role === "SUPER_ADMIN" ? body.role : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      const account = await tx.user.update({
        where: { id: body.id },
        data: {
          ...(typeof body.active === "boolean" ? { active: body.active } : {}),
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          ...(passwordHash ? { passwordHash } : {}),
          ...(role ? { role } : {}),
        },
      });

      const action = typeof body.active === "boolean"
        ? (body.active ? "USER_ACTIVATE" : "USER_DEACTIVATE")
        : "USER_UPDATE";

      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action,
          entityType: "User",
          entityId: account.email,
          before: { name: existing.name, email: existing.email, active: existing.active, role: existing.role },
          after: { name: account.name, email: account.email, active: account.active, role: account.role },
        },
      });

      return account;
    });

    return NextResponse.json({ user: serializeUser(updated) });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Gagal memperbarui akun" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
  if (!can(session.user.role, "MANAGE_USERS")) return NextResponse.json({ error: "Anda tidak memiliki akses" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "ID akun diperlukan" }, { status: 400 });
  if (body.id === session.user.id) return NextResponse.json({ error: "Akun yang sedang digunakan tidak dapat dihapus" }, { status: 422 });

  try {
    const existing = await prisma.user.findUnique({ where: { id: body.id } });
    if (!existing) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

    // Jangan izinkan menghapus Super Admin jika hanya tersisa satu
    if (existing.role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
      if (superAdminCount <= 1) {
        return NextResponse.json({ error: "Tidak dapat menghapus Super Admin terakhir pada sistem" }, { status: 422 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "USER_DELETE",
          entityType: "User",
          entityId: existing.email,
          before: { name: existing.name, email: existing.email, role: existing.role, active: existing.active },
        },
      });
      await tx.user.delete({ where: { id: existing.id } });
    });

    return NextResponse.json({ deletedId: existing.id });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Gagal menghapus akun" }, { status: 500 });
  }
}
