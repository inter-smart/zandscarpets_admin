import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { emailSchema, type EmailFormData } from "@/schemas/forgotPasswordSchema";
import { formatCountdown, useCountdown } from "@/hooks/useCountdown";
import * as authApi from "@/services/auth/authApi";
import { ApiError } from "@/services/auth/authApi";
import type { OtpSession } from "../ForgotPasswordDialog";

interface RequestEmailStepProps {
  onSent: (email: string, session: OtpSession) => void;
  onBack: () => void;
}

export function RequestEmailStep({ onSent, onBack }: RequestEmailStepProps) {
  const [serverError, setServerError] = useState("");
  // Set when the server says a code was already sent moments ago.
  const [recentlySent, setRecentlySent] = useState(false);
  const cooldown = useCountdown(0);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: EmailFormData) => {
    setServerError("");
    setRecentlySent(false);
    try {
      const result = await authApi.forgotPassword(values.email);
      onSent(values.email, result);
    } catch (error) {
      if (error instanceof ApiError && error.code === "OTP_COOLDOWN") {
        const details = error.details as { cooldownSeconds?: number } | undefined;
        cooldown.restart(details?.cooldownSeconds ?? 0);
        setRecentlySent(true);
        return;
      }
      if (error instanceof ApiError && error.code === "EMAIL_NOT_FOUND") {
        form.setError("email", { type: "server", message: error.message });
        return;
      }
      setServerError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    }
  };

  const waiting = cooldown.remaining > 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reset your password</DialogTitle>
        <DialogDescription>
          Enter the email address of your admin account. We'll email you a 6-digit verification code.
        </DialogDescription>
      </DialogHeader>

      <div className="flex gap-2 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Password reset is only available for <strong>admin accounts</strong>. If you're not an admin,
          ask your administrator to reset it for you.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {recentlySent && (
          <Alert>
            <AlertDescription className="space-y-2">
              <p>
                A code was already sent to this address a moment ago.
                {waiting ? ` You can request another in ${formatCountdown(cooldown.remaining)}.` : " You can request another now."}
              </p>
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => onSent(form.getValues("email"), {})}
              >
                I already have a code
              </button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="pl-10"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || waiting}>
          {form.formState.isSubmitting
            ? "Sending..."
            : waiting
              ? `Try again in ${formatCountdown(cooldown.remaining)}`
              : "Send verification code"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </form>
    </>
  );
}
