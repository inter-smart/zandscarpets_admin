import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/schemas/forgotPasswordSchema";
import { formatCountdown, useCountdown } from "@/hooks/useCountdown";
import * as authApi from "@/services/auth/authApi";
import { ApiError } from "@/services/auth/authApi";

interface ResetPasswordStepProps {
  email: string;
  resetToken: string;
  /** How long the verified code allows the password to be set. */
  expiresInSeconds: number;
  onReset: () => void;
  /** Go back to the first step (token expired / invalid). */
  onRestart: () => void;
  onBack: () => void;
}

export function ResetPasswordStep({
  email,
  resetToken,
  expiresInSeconds,
  onReset,
  onRestart,
  onBack,
}: ResetPasswordStepProps) {
  const [serverError, setServerError] = useState("");
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const timer = useCountdown(expiresInSeconds);
  const timedOut = expiresInSeconds > 0 && timer.remaining === 0;
  const stale = timedOut || tokenInvalid;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordFormData) => {
    setServerError("");
    try {
      await authApi.resetPassword(email, resetToken, values.password);
      onReset();
    } catch (error) {
      if (error instanceof ApiError && error.code === "RESET_TOKEN_INVALID") {
        setTokenInvalid(true);
        return;
      }
      setServerError(
        error instanceof ApiError ? error.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Set a new password</DialogTitle>
        <DialogDescription>Choose a new password for your admin account.</DialogDescription>
      </DialogHeader>

      {stale ? (
        <Alert variant="destructive">
          <AlertDescription className="space-y-2">
            <p>
              {tokenInvalid
                ? "This reset session is no longer valid."
                : "The time to set your password has run out."}{" "}
              For security you need to verify a new code.
            </p>
            <button
              type="button"
              onClick={onRestart}
              className="font-medium underline underline-offset-4"
            >
              Start again
            </button>
          </AlertDescription>
        </Alert>
      ) : (
        expiresInSeconds > 0 && (
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              Code verified. Set your new password within{" "}
              <span className="font-mono font-medium tabular-nums">{formatCountdown(timer.remaining)}</span>.
            </span>
          </div>
        )
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="reset-password">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              autoComplete="new-password"
              className="pl-10 pr-10"
              {...form.register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {form.formState.errors.password ? (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Use 8 to 128 characters.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm-password">Confirm new password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="reset-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              className="pl-10 pr-10"
              {...form.register("confirmPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || stale}>
          {form.formState.isSubmitting ? "Resetting..." : "Reset password"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Cancel and back to sign in
          </button>
        </div>
      </form>
    </>
  );
}
