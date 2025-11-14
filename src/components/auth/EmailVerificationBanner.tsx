import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const EmailVerificationBanner: React.FC = () => {
  const { user, resendVerificationEmail } = useAuth();
  const [isSending, setIsSending] = React.useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setIsSending(true);
    try {
      await resendVerificationEmail();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Email Verification Required</span>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm">
            Please verify your email address to report issues. Check your inbox for the verification link.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isSending}
            className="shrink-0"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : "Resend Email"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
