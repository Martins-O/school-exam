import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return;
    }

    await this.resetTokenRepo.delete({ email });

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    await this.resetTokenRepo.save({
      email,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await this.emailService.sendPasswordResetEmail(email, rawToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const resetToken = await this.resetTokenRepo.findOne({
      where: { token: hashedToken },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Token already used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    const user = await this.usersService.findByEmail(resetToken.email);
    if (!user) {
      throw new BadRequestException('User no longer exists');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.usersService.updatePassword(user.id, hashedPassword);

    resetToken.usedAt = new Date();
    await this.resetTokenRepo.save(resetToken);
  }
}
