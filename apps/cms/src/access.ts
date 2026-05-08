import type { Access, FieldAccess } from "payload/types";

type Role = "super_admin" | "admin" | "catalog" | "orders" | "support" | "viewer";

const has = (user: any, ...roles: Role[]) =>
  !!user && roles.includes(user.role as Role);

// ── Collection-level helpers ──────────────────────────────────────────────────

/** Only logged-in users who manage catalog can write; public can read */
export const catalogAccess = {
  read: (() => true) as Access,
  create: (({ req: { user } }) => has(user, "super_admin", "admin", "catalog")) as Access,
  update: (({ req: { user } }) => has(user, "super_admin", "admin", "catalog")) as Access,
  delete: (({ req: { user } }) => has(user, "super_admin", "admin", "catalog")) as Access,
};

/** Orders: admins + orders role can write; support is read-only */
export const ordersAccess = {
  read: (({ req: { user } }) =>
    has(user, "super_admin", "admin", "orders", "support")) as Access,
  create: (({ req: { user } }) =>
    has(user, "super_admin", "admin", "orders")) as Access,
  update: (({ req: { user } }) =>
    has(user, "super_admin", "admin", "orders")) as Access,
  delete: (({ req: { user } }) => has(user, "super_admin", "admin")) as Access,
};

/** Support tickets: support + orders + admin can read/write */
export const supportAccess = {
  read: (({ req: { user } }) =>
    has(user, "super_admin", "admin", "orders", "support")) as Access,
  create: (({ req: { user } }) =>
    has(user, "super_admin", "admin", "orders", "support")) as Access,
  update: (({ req: { user } }) =>
    has(user, "super_admin", "admin", "orders", "support")) as Access,
  delete: (({ req: { user } }) =>
    has(user, "super_admin", "admin")) as Access,
};

/** Users: only super_admin can manage other users */
export const usersAccess = {
  read: (({ req: { user } }) => has(user, "super_admin")) as Access,
  create: (({ req: { user } }) => has(user, "super_admin")) as Access,
  update: (({ req: { user } }) => has(user, "super_admin")) as Access,
  delete: (({ req: { user } }) => has(user, "super_admin")) as Access,
};

// ── Admin panel sidebar visibility ────────────────────────────────────────────

export const hiddenUnless =
  (...roles: Role[]) =>
  ({ user }: { user: any }) =>
    !has(user, ...roles);

// ── Field-level: prevent viewers from writing any field ───────────────────────
export const fieldReadOnly: FieldAccess = ({ req: { user } }) =>
  !has(user, "super_admin", "admin", "catalog", "orders", "support");
