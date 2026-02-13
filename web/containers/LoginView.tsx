import { Input, Typography } from '@flow/core';
import { X } from '@flow/icons';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import loginImage from '~/assets/a_female_teacher_sitting_in_the_desk_and_focusing.png';
import Button from '~/components/Button';

// TODO: temp, to remove after integration
const randomPrefix = () => Math.random().toString(36).substring(2, 10);

const useCountdown = (initialValue: number, shouldStart: boolean) => {
  const [countdown, setCountdown] = useState(initialValue);

  useEffect(() => {
    if (shouldStart && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, shouldStart]);

  const reset = () => setCountdown(initialValue);

  return { countdown, reset };
};

const COUNTDOWN_TIME_IN_SECONDS = 60;
const INVALID_OTP_MESSAGE = 'Invalid OTP. Try again or resend.';

const Step = {
  Email: 'email',
  OTP: 'otp',
} as const;

type Step = (typeof Step)[keyof typeof Step];

const LoginView: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.Email);
  const { countdown, reset } = useCountdown(COUNTDOWN_TIME_IN_SECONDS, step === Step.OTP);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [otpPrefix, setOtpPrefix] = useState('e3myWwd5-');

  const emailForm = useForm<{ email: string }>({
    mode: 'onSubmit',
    defaultValues: {
      email: '',
    },
  });

  const otpForm = useForm<{ otp: string }>({
    mode: 'onSubmit',
    defaultValues: {
      otp: '',
    },
  });

  const handleEmailSubmit = emailForm.handleSubmit((data) => {
    setSubmittedEmail(data.email);
    setStep(Step.OTP);
    setOtpPrefix(randomPrefix() + '-');
  });

  const handleOtpSubmit = otpForm.handleSubmit((data) => {
    // TODO: API call to verify OTP and sign in
    console.log('Sign in with OTP:', data.otp);

    // Simulate OTP verification error for now
    otpForm.setError('otp', {
      type: 'manual',
      message: INVALID_OTP_MESSAGE,
    });
  });

  const handleResendOTP = () => {
    // TODO: API call to resend OTP
    console.log('Resending OTP to:', submittedEmail);
    reset();
    otpForm.clearErrors('otp');
    setOtpPrefix(randomPrefix() + '-');
  };

  return (
    <div className="relative flex min-h-svh flex-1 flex-col bg-slate-1">
      <div className="sticky top-0 z-10 flex h-16 w-full items-center justify-between bg-slate-1 px-lg py-sm">
        <Typography variant="label-md-strong">Sign in</Typography>

        <a
          href="/"
          className="rounded-full border border-slate-6 bg-slate-2 p-xs text-slate-11 hover:bg-slate-3"
        >
          <X size="16" absoluteStrokeWidth />
        </a>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col-reverse items-center justify-center gap-lg p-md lg:flex-row">
        <div className="w-full max-w-136 rounded-3xl border border-slate-7 px-xl py-4xl shadow-xs">
          {step === Step.Email ? (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-md">
              <div className="flex flex-col gap-sm">
                <Typography variant="title-md" className="text-slate-12">
                  Sign in to Teacher Workspace
                </Typography>
                <Typography variant="body-md" className="text-slate-11">
                  Enter your @schools.gov.sg email to receive a one-time password.
                </Typography>
              </div>

              <div className="flex flex-col items-baseline gap-2.5 lg:flex-row">
                <div className="flex w-full flex-col gap-xs">
                  <Input
                    placeholder="e.g. name@schools.gov.sg"
                    type="email"
                    className="rounded-xl has-aria-invalid:border-crimson-9"
                    aria-invalid={!!emailForm.formState.errors.email}
                    autoFocus
                    {...emailForm.register('email', {
                      required: 'Use your @schools.gov.sg email',
                      pattern: {
                        value: /^[^\s@]+@schools\.gov\.sg$/,
                        message: 'Use your @schools.gov.sg email',
                      },
                    })}
                  />

                  {emailForm.formState.errors.email && (
                    <Typography variant="body-md" className="text-crimson-11">
                      {emailForm.formState.errors.email.message}
                    </Typography>
                  )}
                </div>

                <Button variant="default" type="submit" className="w-full lg:w-auto">
                  Continue
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-md">
              <div className="flex flex-col gap-sm">
                <Typography variant="title-md" className="text-slate-12">
                  Enter your one-time password (OTP)
                </Typography>
                <Typography variant="body-md" className="text-slate-11">
                  We sent a one-time password to&nbsp;
                  <span className="font-semibold">{submittedEmail}</span>. Enter the characters that
                  follow the prefix shown.
                </Typography>
              </div>

              <div className="flex flex-col gap-2.5 lg:flex-row">
                <div className="flex flex-grow items-baseline gap-sm">
                  <Typography variant="body-md" className="text-slate-11" aria-label="OTP prefix">
                    {otpPrefix}
                  </Typography>

                  <div className="flex w-full flex-col gap-xs">
                    <Input
                      placeholder="123123"
                      type="text"
                      inputMode="numeric"
                      aria-invalid={!!otpForm.formState.errors.otp}
                      autoFocus
                      {...otpForm.register('otp', { required: INVALID_OTP_MESSAGE })}
                    />

                    {otpForm.formState.errors.otp && (
                      <Typography variant="body-md" className="text-crimson-11">
                        {otpForm.formState.errors.otp.message}
                      </Typography>
                    )}
                  </div>
                </div>

                <Button type="submit" variant="default" className="lg:self-baseline">
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
                  onClick={handleResendOTP}
                  className="bg-unset hover:bg-unset active:bg-unset inline-block p-0 text-blue-9 hover:text-blue-10 disabled:text-slate-10"
                  aria-live="polite"
                >
                  <Typography variant="body-md">
                    Didn&apos;t receive? Resend OTP {countdown > 0 ? `(${countdown})` : ''}
                  </Typography>
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="lg:px-xl">
          <img src={loginImage} alt="Login illustration" />
        </div>
      </div>
    </div>
  );
};

export { LoginView as Component };
