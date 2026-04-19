import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  currency: string;
  deliveryDetails?: string;
}

export async function sendOrderConfirmationEmail(
  data: OrderEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #EDE9FE;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #EDE9FE; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #EDE9FE; text-align: left;">${item.price} ${data.currency}</td>
        </tr>`
      )
      .join("");

    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Cairo', 'Tajawal', Arial, sans-serif; background: #F3F0FF; padding: 40px 20px; direction: rtl;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7C3AED, #A855F7); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">تأكيد الطلب ✓</h1>
          <p style="color: #EDE9FE; margin: 8px 0 0;">شكراً لك ${data.customerName}!</p>
        </div>
        
        <!-- Order Info -->
        <div style="padding: 32px;">
          <div style="background: #F3F0FF; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #6D28D9; font-weight: 700;">رقم الطلب: ${data.orderNumber}</p>
          </div>
          
          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; direction: rtl;">
            <thead>
              <tr style="background: #F3F0FF;">
                <th style="padding: 12px; text-align: right; color: #4C1D95;">المنتج</th>
                <th style="padding: 12px; text-align: center; color: #4C1D95;">الكمية</th>
                <th style="padding: 12px; text-align: left; color: #4C1D95;">السعر</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          
          <!-- Total -->
          <div style="margin-top: 24px; padding: 16px; background: #F3F0FF; border-radius: 12px; text-align: left;">
            <span style="float: right; color: #4C1D95; font-weight: 700;">المجموع:</span>
            <span style="color: #7C3AED; font-size: 20px; font-weight: 800;">${data.totalAmount} ${data.currency}</span>
          </div>
          
          ${
            data.deliveryDetails
              ? `
          <!-- Delivery Details -->
          <div style="margin-top: 24px; padding: 20px; background: #ECFDF5; border-radius: 12px; border-right: 4px solid #10B981;">
            <h3 style="color: #065F46; margin: 0 0 8px;">تفاصيل التسليم</h3>
            <p style="color: #047857; margin: 0; white-space: pre-wrap;">${data.deliveryDetails}</p>
          </div>`
              : ""
          }
          
          <!-- CTA -->
          <div style="margin-top: 32px; text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/orders" 
               style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #A855F7); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700;">
              عرض الطلب
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #F3F0FF; padding: 20px; text-align: center;">
          <p style="color: #6D28D9; margin: 0; font-size: 14px;">إذا كان لديك أي استفسار، تواصل معنا عبر الدعم الفني</p>
        </div>
      </div>
    </body>
    </html>`;

    const result = await resend.emails.send({
      from: `متجري <${process.env.RESEND_FROM_EMAIL || "noreply@example.com"}>`,
      to: data.customerEmail,
      subject: `تأكيد الطلب #${data.orderNumber}`,
      html,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error("Failed to send order email:", error);
    return { success: false, error: error.message };
  }
}
