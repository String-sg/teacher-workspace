import { cn, Input, Typography } from '@flow/core';
import React, { type FormEvent, useEffect, useState } from 'react';

// TODO: change image
import loginImage from '~/assets/a_female_teacher_sitting_in_the_desk_and_focusing.png';
import Button from '~/components/Button';

// TODO: temp, to remove after integration
const randomPrefix = () => Math.random().toString(36).substring(2, 10);

const useCountdown = (initialValue: number) => {
  const [countdown, setCountdown] = useState(initialValue);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const reset = () => setCountdown(initialValue);

  return { countdown, reset };
};

const LoginView: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [otpPrefix, setOtpPrefix] = useState('e3myWwd5-');

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();

    const isValidEmail = email.endsWith('@schools.gov.sg');
    setEmailError(!isValidEmail);

    if (isValidEmail) {
      setStep('otp');

      setOtpPrefix(randomPrefix() + '-');
    }
  };

  const handleOtpSubmit = (e: FormEvent) => {
    e.preventDefault();

    // TODO: API call to verify OTP and sign in
    console.log('Sign in with OTP:', otp);
    setOtpError(true);
  };

  const handleResendOTP = (reset: () => void) => {
    // TODO: API call to resend OTP
    console.log('Resending OTP to:', email);
    reset();

    setOtpPrefix(randomPrefix() + '-');
  };

  return (
    <div className="container m-auto flex flex-1 flex-col-reverse items-center justify-center gap-lg p-md lg:flex-row lg:gap-41.5">
      <div>
        <div className="min-h-0 max-w-125.5 rounded-3xl border border-slate-7 px-xl py-4xl shadow-xs">
          {step === 'email' ? (
            <EmailForm
              email={email}
              setEmail={setEmail}
              invalid={emailError}
              onSubmit={handleEmailSubmit}
            />
          ) : (
            <OtpForm
              otp={otp}
              prefix={otpPrefix}
              setOtp={setOtp}
              invalid={otpError}
              onSubmit={handleOtpSubmit}
              onResend={handleResendOTP}
              email={email}
            />
          )}
        </div>
      </div>
      <img src={loginImage} alt="Login illustration" />
    </div>
  );
};

export { LoginView as Component };

const EmailForm = ({
  email,
  setEmail,
  invalid,
  onSubmit,
}: {
  email: string;
  setEmail: (email: string) => void;
  invalid?: boolean;
  onSubmit: (e: FormEvent) => void;
}) => (
  <form onSubmit={onSubmit}>
    <Typography variant="title-md" className="text-slate-12">
      Sign in to Teacher Workspace
    </Typography>
    <Typography variant="body-md" className="mt-sm mb-md text-slate-11">
      Enter your @schools.gov.sg email to receive a one-time password.
    </Typography>

    <div className="flex items-baseline gap-2.5">
      <div className="flex w-full flex-col gap-xs">
        <Input
          placeholder="e.g. name@schools.gov.sg"
          // TODO: to see if we prefer to have this or not (it triggers native checks)
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn('rounded-xl has-[[aria-invalid=true]]:border-crimson-9')}
          aria-invalid={invalid}
          required
          autoFocus
        />
        {invalid && (
          <Typography variant="body-md" className="text-crimson-11" id="email-error" role="alert">
            Use your @schools.gov.sg email
          </Typography>
        )}
      </div>
      <Button variant="default" type="submit">
        Continue
      </Button>
    </div>
  </form>
);

const OtpForm = ({
  email,
  otp,
  prefix,
  setOtp,
  invalid,
  onResend,
  onSubmit,
}: {
  otp: string;
  prefix: string;
  setOtp: (otp: string) => void;
  email: string;
  onSubmit: (e: FormEvent) => void;
  onResend: (reset: () => void) => void;
  invalid?: boolean;
}) => {
  const { countdown, reset } = useCountdown(60);

  return (
    <form onSubmit={onSubmit}>
      <Typography variant="title-md" className="text-slate-12">
        Enter your one-time password (OTP)
      </Typography>
      <Typography variant="body-md" className="mt-sm text-slate-11">
        We sent a one-time password to <span className="font-semibold">{email}</span>. Enter the
        characters that follow the prefix shown.
      </Typography>

      <div className={cn('my-2.5 flex gap-2.5', invalid ? 'items-baseline' : 'items-center')}>
        <Typography variant="body-md" className="text-slate-11" aria-label="OTP prefix">
          {prefix}
        </Typography>
        <div className="flex w-full flex-col gap-xs">
          <Input
            placeholder="123123"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className={cn('rounded-xl has-[[aria-invalid=true]]:border-crimson-9')}
            aria-invalid={invalid}
            required
            autoFocus
          />
          {invalid && (
            <Typography variant="body-md" className="text-crimson-11" id="otp-error" role="alert">
              Invalid OTP. Try again or resend.
            </Typography>
          )}
        </div>

        <Button type="submit" variant="default">
          Sign in
        </Button>
      </div>

      <div className="mt-lg flex flex-col gap-xs">
        <Typography variant="body-md" className="text-slate-11" id="otp-help">
          It may take a moment to arrive.
        </Typography>
        <Button
          type="button"
          variant="ghost"
          disabled={countdown > 0}
          onClick={() => onResend(reset)}
          className="hover:bg-unset inline-block p-0 text-blue-9 hover:text-blue-10 disabled:text-slate-10"
          aria-live="polite"
        >
          <Typography variant="body-md">
            Didn&apos;t receive? Resend OTP {countdown > 0 ? `(${countdown})` : ''}
          </Typography>
        </Button>
      </div>
    </form>
  );
};
