import { CollectionConfig } from "payload/types";

/**
 * Simple folder taxonomy for the Media library. Admins create a
 * MediaFolder doc for each category they want ("Products", "Banners",
 * "Logos", ...) and Media items get a `folder` relationship pointing at
 * one of them. The Media list view surfaces the folder as a column and
 * a filter so a store manager can narrow down thousands of uploads to
 * the ones they care about.
 *
 * Kept intentionally flat -- no nested folders. If we ever need
 * subfolders, add a `parent` self-relationship and render breadcrumbs
 * in the admin.
 */
export const MediaFolders: CollectionConfig = {
  slug: "media-folders",
  labels: { singular: "مجلد وسائط", plural: "مجلدات الوسائط" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "description"],
    group: "الإعدادات",
    hidden: ({ user }: { user: any }) =>
      !["super_admin", "admin", "catalog"].includes(user?.role),
  },
  access: {
    read: () => true,
    create: ({ req: { user } }: any) =>
      ["super_admin", "admin", "catalog"].includes(user?.role),
    update: ({ req: { user } }: any) =>
      ["super_admin", "admin", "catalog"].includes(user?.role),
    delete: ({ req: { user } }: any) =>
      ["super_admin", "admin"].includes(user?.role),
  },
  fields: [
    {
      name: "name",
      label: "اسم المجلد",
      type: "text",
      required: true,
      admin: { description: "مثال: المنتجات، البانرات، الشعارات، المدونة" },
    },
    {
      name: "description",
      label: "وصف (اختياري)",
      type: "text",
      admin: { description: "ملاحظة قصيرة لتذكير الفريق بمحتوى المجلد" },
    },
  ],
};
