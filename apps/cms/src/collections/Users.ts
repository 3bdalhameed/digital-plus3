import { CollectionConfig } from "payload/types";
import { usersAccess } from "../access";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    group: "Settings",
    // Only super_admin sees the Users section in the sidebar
    hidden: ({ user }) => (user as any)?.role !== "super_admin",
  },
  access: usersAccess,
  fields: [
    {
      name: "name",
      label: "الاسم",
      type: "text",
      required: true,
    },
    {
      name: "role",
      label: "الصلاحية",
      type: "select",
      required: true,
      defaultValue: "viewer",
      options: [
        { label: "🔑 مدير عام  (كل الصلاحيات + إدارة المستخدمين)", value: "super_admin" },
        { label: "⚙️  مدير  (كل الصلاحيات)", value: "admin" },
        { label: "🎧 دعم فني  (تذاكر + عرض الطلبات)", value: "support" },
        { label: "👁️  مشاهد  (قراءة فقط)", value: "viewer" },
        { label: "📦 مدير الكتالوج  (منتجات + تصنيفات + صور)", value: "catalog" },
        { label: "🛒 مدير الطلبات  (طلبات + عملاء)", value: "orders" },
      ],
      admin: { position: "sidebar" },
    },
  ],
  timestamps: true,
};
