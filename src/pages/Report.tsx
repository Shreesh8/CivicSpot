
import React from "react";
import IssueForm from "@/components/issues/IssueForm";
import { useNavigate } from "react-router-dom";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";

const Report = () => {
  const navigate = useNavigate();

  const handleSubmitSuccess = () => {
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Report an Issue</h1>
        <p className="text-muted-foreground">
          Fill out the form below to report a community issue that needs attention.
        </p>
      </div>
      <EmailVerificationBanner />
      <IssueForm onSubmitSuccess={handleSubmitSuccess} />
    </div>
  );
};

export default Report;
