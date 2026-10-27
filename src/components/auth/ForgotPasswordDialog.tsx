import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { ForgotPasswordResult } from "@/services/auth/authApi";
import { RequestEmailStep } from "./steps/RequestEmailStep";
import { VerifyOtpStep } from "./steps/VerifyOtpStep";
import { ResetPasswordStep } from "./steps/ResetPasswordStep";

type Step = "email" | "otp" | "reset";

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

// A reset can be started from "I already have a code" when a code was sent recently, in which
// case the server numbers for the live code are unknown, so they are optional.
export type OtpSession = Partial<ForgotPasswordResult>;

// One controlled dialog drives the whole forgot-password → OTP → reset-password flow. Esc and
// outside-click are ignored so a mis-click can't drop a half-finished reset; each step has an
// explicit "Back to sign in" link instead.
export function ForgotPasswordDialog({ open, onClose }: ForgotPasswordDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpSession, setOtpSession] = useState<OtpSession>({});
  const [resetToken, setResetToken] = useState("");
  const [resetExpiresIn, setResetExpiresIn] = useState(0);

  const resetFlow = () => {
    setStep("email");
    setEmail("");
    setOtpSession({});
    setResetToken("");
    setResetExpiresIn(0);
  };

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const handleComplete = () => {
    toast({
      title: "Password reset",
      description: "Your password has been reset successfully. Please log in with your new password.",
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* not closable by Esc / outside click */ }}>
      <DialogContent
        hideCloseButton
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {step === "email" && (
          <RequestEmailStep
            onBack={handleClose}
            onSent={(sentEmail, session) => {
              setEmail(sentEmail);
              setOtpSession(session);
              setStep("otp");
            }}
          />
        )}

        {step === "otp" && (
          <VerifyOtpStep
            email={email}
            session={otpSession}
            onBack={handleClose}
            onChangeEmail={resetFlow}
            onVerified={(token, expiresInSeconds) => {
              setResetToken(token);
              setResetExpiresIn(expiresInSeconds);
              setStep("reset");
            }}
          />
        )}

        {step === "reset" && (
          <ResetPasswordStep
            email={email}
            resetToken={resetToken}
            expiresInSeconds={resetExpiresIn}
            onReset={handleComplete}
            onRestart={resetFlow}
            onBack={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
