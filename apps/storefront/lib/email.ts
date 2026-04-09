/**
 * Email sending via Resend
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface OrderConfirmationEmailParams {
  to: string
  customerName: string
  orderNumber: string
  items: Array<{
    name: string
    quantity: number
    price: number
    currency: string
    deliveryData?: Record<string, any>
  }>
  totalAmount: number
  currency: string
  orderUrl: string
}

export async function sendOrderConfirmationEmail(
  params: OrderConfirmationEmailParams,
) {
  const itemsList = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #f0e8ff;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #f0e8ff; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #f0e8ff; text-align: left;">${item.price} ${item.currency}</td>
        </tr>`,
    )
    .join('')

  const deliverySection = params.items
    .filter((i) => i.deliveryData)
    .map(
      (item) =>
        `<div style="background: #f3f0ff; padding: 16px; border-radius: 8px; margin: 8px 0; border-right: 4px solid #7C3AED;">
          <strong>${item.name}</strong><br>
          ${Object.entries(item.deliveryData || {})
            .map(([k, v]) => `<span style="color: #6D28D9;">${k}:</span> <code>${v}</code>`)
            .join('<br>')}
        </div>`,
    )
    .join('')

  const { data, error } = await resend.emails.send({
    from: 'متجري <no-reply@your-domain.com>',
    to: params.to,
    subject: `✅ تأكيد طلبك رقم ${params.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: 'Cairo', 'Segoe UI', sans-serif; background: #f3f0ff; margin: 0; padding: 0; direction: rtl; }
        </style>
      </head>
      <body>
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(124,58,237,0.1);">
          <div style="background: linear-gradient(135deg, #7C3AED, #A855F7); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">تم تأكيد طلبك! 🎉</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px;">
              مرحباً <strong>${params.customerName}</strong>،<br>
              شكراً لطلبك. تم استلام دفعتك بنجاح.
            </p>
            <div style="background: #f9f7ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; color: #7C3AED;"><strong>رقم الطلب:</strong> ${params.orderNumber}</p>
            </div>
            <h3 style="color: #4C1D95;">تفاصيل الطلب</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #7C3AED; color: white;">
                  <th style="padding: 8px; text-align: right;">المنتج</th>
                  <th style="padding: 8px; text-align: center;">الكمية</th>
                  <th style="padding: 8px; text-align: left;">السعر</th>
                </tr>
              </thead>
              <tbody>${itemsList}</tbody>
            </table>
            <div style="text-align: left; margin-top: 16px; padding: 16px; background: #f9f7ff; border-radius: 8px;">
              <strong style="color: #7C3AED; font-size: 18px;">المجموع: ${params.totalAmount} ${params.currency}</strong>
            </div>
            ${
              deliverySection
                ? `<h3 style="color: #4C1D95;">بيانات التسليم الرقمي</h3>${deliverySection}`
                : ''
            }
            <div style="text-align: center; margin-top: 32px;">
              <a href="${params.orderUrl}"
                 style="background: linear-gradient(135deg, #7C3AED, #A855F7); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                عرض تفاصيل الطلب
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px; text-align: center;">
              إذا واجهت أي مشكلة، تواصل معنا عبر قسم الدعم.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  })

  if (error) {
    console.error('[Email] Failed to send order confirmation:', error)
    throw error
  }

  return data
}
