import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get('SMTP_FROM') || 'no-reply@apexportal.com';
    this.frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:3000';

    const host = this.config.get('SMTP_HOST');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASSWORD');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT') || 587,
        secure: this.config.get('SMTP_PORT') === 465,
        auth: { user, pass },
      });
      this.logger.log('SMTP transporter configured');
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console');
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    if (!this.transporter) {
      this.logger.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Password Reset — APEX Portal',
        html: this.buildResetEmail(resetUrl),
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${email}: ${err.message}`);
    }
  }

  private buildResetEmail(resetUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 56px; height: 56px; background: #0F5132; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 28px; font-weight: 900;">A</span>
          </div>
        </div>
        <h1 style="font-size: 18px; color: #0F172A; margin-bottom: 8px; text-transform: uppercase;">Password Reset</h1>
        <p style="color: #64748B; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
          A password reset was requested for your APEX Portal account. Click the button below to set a new password. This link expires in 1 hour.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${resetUrl}" style="display: inline-block; background: #0F5132; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
            Reset Password
          </a>
        </div>
        <p style="color: #94A3B8; font-size: 11px; line-height: 1.6;">
          If you did not request this reset, ignore this email. No changes have been made to your account.
        </p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <p style="color: #94A3B8; font-size: 10px; text-align: center;">
          APEX Portal — Unified Examination System
        </p>
      </div>
    `;
  }
}
