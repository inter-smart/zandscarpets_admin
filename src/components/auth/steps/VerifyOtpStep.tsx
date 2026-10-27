import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { otpSchema, type OtpFormData } from "@/schemas/forgotPasswordSchema";
import { formatCountdown, useCountdown } from "@/hooks/useCountdown";
import * as authApi from "@/services/auth/authApi";
import { ApiError } from "@/services/auth/authApi";
import type { OtpSession } from "../ForgotPasswordDialog";

interface VerifyOtpStepProps {
  email: string;
  session: OtpSession;
  onVerified: (resetToken: string, expiresInSeconds: number) => void;
  onBack: () => void;
  onChangeEmail: () => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function VerifyOtpStep({
  email,
  session,
  onVerified,
  onBack,
  onChangeEmail,
}: VerifyOtpStepProps) {
  const [serverError, setServerError] = useState("");
  const [maxAttempts, setMaxAttempts] = useState(session.maxAttempts ?? 0);
  const [lockoutSeconds, setLockoutSeconds] = useState(session.lockoutSeconds ?? 0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // 0 when unknown (user arrived via "I already have a code").
  const [hasExpiry, setHasExpiry] = useState((session.expiresInSeconds ?? 0) > 0);

  const resend = useCountdown(session.cooldownSeconds ?? 0);
  const expiry = useCountdown(session.expiresInSeconds ?? 0);
  const expired = hasExpiry && expiry.remaining === 0;
  const locked = maxAttemptsReached || expired;

  const form = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const handleResend = async () => {
    setServerError("");
    setIsResending(true);
    try {
      const result = await authApi.forgotPassword(email);
      setMaxAttemptsReached(false);
      setRemainingAttempts(null);
      setMaxAttempts(result.maxAttempts);
      setLockoutSeconds(result.lockoutSeconds);
      setHasExpiry(true);
      expiry.restart(result.expiresInSeconds);
      resend.restart(result.cooldownSeconds);
      form.reset({ otp: "" });
    } catch (error) {
      if (error instanceof ApiError && error.code === "OTP_COOLDOWN") {
        const details = error.details as { cooldownSeconds?: number } | undefined;
        if (typeof details?.cooldownSeconds === "number") {
          resend.restart(details.cooldownSeconds);
        }
      }
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Failed to resend code. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (values: OtpFormData) => {
    setServerError("");
    try {
      const { resetToken, expiresInSeconds } = await authApi.verifyOtp(email, values.otp);
      onVerified(resetToken, expiresInSeconds);
    } catch (error) {
      if (error instanceof ApiError && error.code === "OTP_MAX_ATTEMPTS") {
        const details = error.details as { cooldownSeconds?: number } | undefined;
        setMaxAttemptsReached(true);
        setRemainingAttempts(0);
        setServerError("Too many incorrect attempts. This code is no longer valid.");
        // The code is dead server-side now; resend is locked behind the longer cooldown.
        resend.restart(details?.cooldownSeconds ?? 0);
        return;
      }

      if (error instanceof ApiError && error.code === "OTP_INVALID") {
        const details = error.details as { remainingAttempts?: number } | undefined;
        if (typeof details?.remainingAttempts === "number") {
          setRemainingAttempts(details.remainingAttempts);
        }
      }

      setServerError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.",
      );
      form.reset({ otp: "" });
    }
  };

  const attemptsLeft = remainingAttempts ?? (maxAttempts > 0 ? maxAttempts : null);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Enter verification code</DialogTitle>
        <DialogDescription>
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>. Check your spam folder if you
          don't see it.
        </DialogDescription>
      </DialogHeader>

      {/* Live status: how long the code lasts and how many guesses are left */}
      <div className="space-y-1.5 rounded-md border bg-muted/50 p-3 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          {!hasExpiry ? (
            <span className="text-muted-foreground">Use the most recent code we emailed you.</span>
          ) : expired ? (
            <span className="font-medium text-destructive">This code has expired.</span>
          ) : (
            <span>
              Code expires in{" "}
              <span className="font-mono font-medium tabular-nums">{formatCountdown(expiry.remaining)}</span>
            </span>
          )}
        </div>
        {!locked && attemptsLeft !== null && (
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              {plural(attemptsLeft, "attempt")} left
              {lockoutSeconds > 0 &&
                ` — after that you'll wait ${formatCountdown(lockoutSeconds)} before requesting a new code`}
              .
            </span>
          </div>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {locked && (
          <Alert>
            <AlertDescription>
              {resend.remaining > 0
                ? `Request a new code in ${formatCountdown(resend.remaining)}.`
                : "Request a new code below to continue."}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Controller
            control={form.control}
            name="otp"
            render={({ field }) => (
              <InputOTP
                maxLength={6}
                value={field.value}
                onChange={field.onChange}
                disabled={locked}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            )}
          />
        </div>
        {form.formState.errors.otp && (
          <p className="text-center text-sm text-destructive">
            {form.formState.errors.otp.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting || locked}
        >
          {form.formState.isSubmitting ? "Verifying..." : "Verify code"}
        </Button>

        <div className="space-y-2 text-center text-sm text-muted-foreground">
          {resend.remaining > 0 ? (
            <p>Didn't get it? You can resend in {formatCountdown(resend.remaining)}.</p>
          ) : (
            <p>
              Didn't get it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            </p>
          )}
          <p className="space-x-3">
            <button type="button" onClick={onChangeEmail} className="underline-offset-4 hover:underline">
              Use a different email
            </button>
            <button type="button" onClick={onBack} className="underline-offset-4 hover:underline">
              Back to sign in
            </button>
          </p>
        </div>
      </form>
    </>
  );
}
