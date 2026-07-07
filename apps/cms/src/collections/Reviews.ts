import { CollectionConfig } from "payload/types";

/**
 * Product reviews. Rows are inserted either by:
 *   1. The customer clicking "قيّم المنتج" on their order page.
 *   2. The 7-day auto-rate job when the customer never got around to
 *      leaving a review (defaults to 5 stars, source = "auto").
 *
 * (order, product, customer) is unique — no duplicate reviews per line
 * item. Enforced by a partial unique index in runMigrations.
 */
export const Reviews: CollectionConfig = {
  slug: "reviews",
  labels: { singular: "تقييم", plural: "التقييمات" },
  admin: {
    useAsTitle: "id",
    defaultColumns: ["product", "customer", "rating", "source", "createdAt"],
    group: "الطلبات",
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req: { user } }: any) =>
      ["super_admin", "admin"].includes(user?.role),
    delete: ({ req: { user } }: any) =>
      ["super_admin", "admin"].includes(user?.role),
  },
  fields: [
    {
      name: "product",
      label: "المنتج",
      type: "relationship",
      relationTo: "products",
      required: true,
      index: true,
    },
    {
      name: "order",
      label: "الطلب",
      type: "relationship",
      relationTo: "orders",
      required: true,
      index: true,
    },
    {
      name: "customer",
      label: "العميل",
      type: "relationship",
      relationTo: "customers",
      required: true,
      index: true,
    },
    {
      name: "rating",
      label: "التقييم (1-5)",
      type: "number",
      required: true,
      min: 1,
      max: 5,
      defaultValue: 5,
    },
    {
      name: "comment",
      label: "التعليق",
      type: "textarea",
    },
    {
      name: "source",
      label: "المصدر",
      type: "select",
      required: true,
      defaultValue: "customer",
      options: [
        { label: "من العميل", value: "customer" },
        { label: "تلقائي (بعد 7 أيام)", value: "auto" },
      ],
    },
  ],
};
