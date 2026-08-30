import { IsString, MinLength, MaxLength, Matches, Length } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  @Matches(/^\+?[0-9]+$/, { message: 'Invalid phone number' })
  phone: string;
}

export class PhoneLoginDto {
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class PhoneSignupDto {
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class PhoneResetPasswordDto {
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsString()
  @MinLength(6)
  password: string;
}
