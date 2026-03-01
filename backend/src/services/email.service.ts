import { Resend } from 'resend';

// Initialize Resend with API key (will be undefined if not set)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Store name for emails
const STORE_NAME = process.env.STORE_NAME || 'Our Store';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@resend.dev'; // Use resend.dev for testing

// In development/testing with Resend free tier, all emails must go to your verified email
// Set this to your Resend-verified email address
const DEV_EMAIL_OVERRIDE = process.env.DEV_EMAIL_OVERRIDE || 'fazlul0127@gmail.com';

// TODO: When you verify a domain with Resend and want emails to go to actual customers:
// 1. Verify your domain at https://resend.com/domains
// 2. Change FROM_EMAIL to use your verified domain (e.g., 'noreply@yourdomain.com')
// 3. Set ENABLE_REAL_EMAILS to true below
const ENABLE_REAL_EMAILS = process.env.ENABLE_REAL_EMAILS === 'true' || process.env.NODE_ENV === 'production'; // Auto-enabled in production

// Helper to get the actual recipient (overrides to your email when ENABLE_REAL_EMAILS is false)
function getRecipientEmail(originalEmail: string): string {
  if (ENABLE_REAL_EMAILS) {
    return originalEmail;
  }
  console.log(`[EMAIL] Redirecting email from ${originalEmail} to ${DEV_EMAIL_OVERRIDE}`);
  return DEV_EMAIL_OVERRIDE;
}

interface OrderEmailData {
  orderNumber: string;
  email: string;
  customerName: string;
  items: Array<{
    productTitle: string;
    variantTitle?: string | null;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
}

interface ShippingEmailData {
  orderNumber: string;
  email: string;
  customerName: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Escape HTML entities to prevent XSS attacks
 * Handles null/undefined by returning empty string
 */
function escapeHtml(text: string | null | undefined): string {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Safely format a date string, returning null if invalid
 */
function formatDateSafe(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (!isFinite(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
  if (!resend) {
    console.log('[EMAIL] Resend not configured - skipping order confirmation email');
    console.log('[EMAIL] Would send to:', data.email);
    return false;
  }

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
          ${escapeHtml(item.productTitle)}${item.variantTitle ? ` - ${escapeHtml(item.variantTitle)}` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">
          ${formatCurrency(item.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join('');

  const addressHtml = data.shippingAddress
    ? `
    <div style="margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; color: #666;">
        Shipping Address
      </h3>
      <p style="margin: 0; line-height: 1.6;">
        ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
        ${data.shippingAddress.line1}<br>
        ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
        ${data.shippingAddress.country}
      </p>
    </div>
  `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="background: #000; color: #fff; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px;">
          ${STORE_NAME}
        </h1>
      </div>
      
      <!-- Content -->
      <div style="background: #fff; padding: 32px; border: 2px solid #000; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 900;">
          Order Confirmed! 🎉
        </h2>
        <p style="margin: 0 0 24px 0; color: #666;">
          Thank you for your order, ${data.customerName}!
        </p>
        
        <div style="background: #FFEB3B; padding: 16px; border: 2px solid #000; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; font-weight: bold;">
            Order #${data.orderNumber}
          </p>
        </div>
        
        <!-- Order Items -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #000;">Item</th>
              <th style="padding: 12px; text-align: center; font-weight: bold; border-bottom: 2px solid #000;">Qty</th>
              <th style="padding: 12px; text-align: right; font-weight: bold; border-bottom: 2px solid #000;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <!-- Totals -->
        <div style="border-top: 2px solid #000; padding-top: 16px;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 4px 0;">Subtotal</td>
              <td style="padding: 4px 0; text-align: right;">${formatCurrency(data.subtotal)}</td>
            </tr>
            ${data.discount > 0 ? `
            <tr style="color: #16a34a;">
              <td style="padding: 4px 0;">Discount</td>
              <td style="padding: 4px 0; text-align: right;">-${formatCurrency(data.discount)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 4px 0;">Shipping</td>
              <td style="padding: 4px 0; text-align: right;">${data.shippingCost === 0 ? 'FREE' : formatCurrency(data.shippingCost)}</td>
            </tr>
            ${data.tax > 0 ? `
            <tr>
              <td style="padding: 4px 0;">Tax</td>
              <td style="padding: 4px 0; text-align: right;">${formatCurrency(data.tax)}</td>
            </tr>
            ` : ''}
            <tr style="font-weight: bold; font-size: 18px;">
              <td style="padding: 12px 0; border-top: 2px solid #000;">Total</td>
              <td style="padding: 12px 0; border-top: 2px solid #000; text-align: right;">${formatCurrency(data.total)}</td>
            </tr>
          </table>
        </div>
        
        ${addressHtml}
        
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          We'll send you another email when your order ships.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding: 24px; color: #666; font-size: 12px;">
        <p style="margin: 0;">
          © ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.
        </p>
      </div>
      
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: getRecipientEmail(data.email),
      subject: `Order Confirmed - #${data.orderNumber}`,
      html,
    });

    if (error) {
      console.error('[EMAIL] Failed to send order confirmation:', error);
      return false;
    }

    console.log('[EMAIL] Order confirmation sent to:', data.email);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending order confirmation:', error);
    return false;
  }
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotification(data: ShippingEmailData): Promise<boolean> {
  if (!resend) {
    console.log('[EMAIL] Resend not configured - skipping shipping notification email');
    console.log('[EMAIL] Would send to:', data.email);
    return false;
  }

  const trackingHtml = data.trackingNumber
    ? `
    <div style="background: #FFEB3B; padding: 20px; border: 2px solid #000; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; font-weight: bold;">Tracking Information</h3>
      ${data.carrier ? `<p style="margin: 0 0 8px 0;"><strong>Carrier:</strong> ${data.carrier}</p>` : ''}
      <p style="margin: 0 0 8px 0;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
      ${data.trackingUrl ? `
      <a href="${data.trackingUrl}" style="display: inline-block; margin-top: 12px; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 8px;">
        Track Your Package →
      </a>
      ` : ''}
    </div>
  `
    : '';

  const formattedDeliveryDate = formatDateSafe(data.estimatedDelivery);
  const estimatedDeliveryHtml = formattedDeliveryDate
    ? `
    <p style="margin: 16px 0; padding: 16px; background: #f5f5f5; border-radius: 8px;">
      <strong>Estimated Delivery:</strong> ${formattedDeliveryDate}
    </p>
  `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="background: #000; color: #fff; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px;">
          ${STORE_NAME}
        </h1>
      </div>
      
      <!-- Content -->
      <div style="background: #fff; padding: 32px; border: 2px solid #000; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 900;">
          Your Order Has Shipped! 📦
        </h2>
        <p style="margin: 0 0 24px 0; color: #666;">
          Great news, ${data.customerName}! Your order is on its way.
        </p>
        
        <div style="background: #f5f5f5; padding: 16px; border: 2px solid #000; border-radius: 8px;">
          <p style="margin: 0; font-weight: bold;">
            Order #${data.orderNumber}
          </p>
        </div>
        
        ${trackingHtml}
        ${estimatedDeliveryHtml}
        
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          If you have any questions about your order, please don't hesitate to contact us.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding: 24px; color: #666; font-size: 12px;">
        <p style="margin: 0;">
          © ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.
        </p>
      </div>
      
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: getRecipientEmail(data.email),
      subject: `Your Order Has Shipped - #${data.orderNumber}`,
      html,
    });

    if (error) {
      console.error('[EMAIL] Failed to send shipping notification:', error);
      return false;
    }

    console.log('[EMAIL] Shipping notification sent to:', data.email);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending shipping notification:', error);
    return false;
  }
}

interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Email where contact form messages are sent
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'fazlul0127@gmail.com';

/**
 * Send contact form message to store email
 */
export async function sendContactMessage(data: ContactEmailData): Promise<boolean> {
  if (!resend) {
    console.log('[EMAIL] Resend not configured - skipping contact email');
    console.log('[EMAIL] Would send contact message from:', data.email);
    return false;
  }

  const subjectLabels: Record<string, string> = {
    order: '📦 Order Inquiry',
    product: '🛍️ Product Question',
    shipping: '🚚 Shipping & Delivery',
    returns: '↩️ Returns & Exchanges',
    feedback: '💬 Feedback',
    other: '📝 General Inquiry',
  };

  const subjectLabel = subjectLabels[data.subject] || subjectLabels.other;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="background: #FACC15; color: #000; padding: 24px; text-align: center; border: 4px solid #000; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px;">
          📬 New Contact Message
        </h1>
      </div>
      
      <!-- Content -->
      <div style="background: #fff; padding: 32px; border: 4px solid #000; border-top: none; border-radius: 0 0 8px 8px;">
        
        <!-- Category Badge -->
        <div style="background: #000; color: #fff; display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin-bottom: 24px;">
          ${subjectLabel}
        </div>
        
        <!-- Sender Info -->
        <div style="background: #f5f5f5; padding: 16px; border: 2px solid #000; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${escapeHtml(data.name)}</p>
          <p style="margin: 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}" style="color: #000;">${escapeHtml(data.email)}</a></p>
        </div>
        
        <!-- Message -->
        <div style="background: #fff; padding: 20px; border: 2px solid #000; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; color: #666;">
            Message
          </h3>
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.8;">
${escapeHtml(data.message)}
          </p>
        </div>
        
        <!-- Reply Button -->
        <div style="margin-top: 24px; text-align: center;">
          <a href="mailto:${escapeHtml(data.email)}?subject=Re: ${escapeHtml(data.subject)}" 
             style="display: inline-block; padding: 14px 28px; background: #EF4444; color: #fff; text-decoration: none; font-weight: bold; border: 4px solid #000; border-radius: 8px; box-shadow: 4px 4px 0px #000;">
            Reply to ${escapeHtml(data.name)} →
          </a>
        </div>
        
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding: 24px; color: #666; font-size: 12px;">
        <p style="margin: 0;">
          Received via ${STORE_NAME} Contact Form
        </p>
      </div>
      
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: getRecipientEmail(CONTACT_EMAIL),
      replyTo: data.email,
      subject: `[Contact] ${subjectLabel} from ${data.name}`,
      html,
    });

    if (error) {
      console.error('[EMAIL] Failed to send contact message:', error);
      return false;
    }

    console.log('[EMAIL] Contact message sent from:', data.email);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending contact message:', error);
    return false;
  }
}

// Resend audience ID for newsletter subscribers
const NEWSLETTER_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '';

/**
 * Subscribe email to newsletter using Resend Contacts API
 * Requires RESEND_AUDIENCE_ID environment variable
 */
export async function subscribeToNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  if (!resend) {
    console.log('[EMAIL] Resend not configured - skipping newsletter subscription');
    return { success: true, message: 'Thank you for subscribing!' };
  }

  if (!NEWSLETTER_AUDIENCE_ID) {
    console.log('[EMAIL] RESEND_AUDIENCE_ID not set - newsletter subscription not available');
    console.log('[EMAIL] Would subscribe:', email);
    // Return success to not block user experience, but log the issue
    return { success: true, message: 'Thank you for subscribing!' };
  }

  try {
    const { data, error } = await resend.contacts.create({
      email,
      audienceId: NEWSLETTER_AUDIENCE_ID,
      unsubscribed: false,
    });

    if (error) {
      // Check if already subscribed (common case)
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('[EMAIL] Newsletter: Email already subscribed:', email);
        return { success: true, message: 'You are already subscribed!' };
      }
      console.error('[EMAIL] Failed to subscribe to newsletter:', error);
      return { success: false, message: 'Failed to subscribe. Please try again.' };
    }

    console.log('[EMAIL] Newsletter subscription added:', email, data);
    return { success: true, message: 'Successfully subscribed to our newsletter!' };
  } catch (error) {
    console.error('[EMAIL] Error subscribing to newsletter:', error);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}

export const emailService = {
  sendOrderConfirmation,
  sendShippingNotification,
  sendContactMessage,
  subscribeToNewsletter,
};
