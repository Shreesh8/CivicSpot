
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIssues } from "@/contexts/IssueContext";
import IssueDetail from "@/components/issues/IssueDetail";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";

const IssuePage = () => {
  const { id } = useParams<{ id: string }>();
  const { getIssue, loading } = useIssues();
  const navigate = useNavigate();

  const issue = id ? getIssue(id) : undefined;

  useEffect(() => {
    if (!loading && id && !issue) {
      navigate("/not-found", { replace: true });
    }
  }, [issue, loading, id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!issue) {
    return null; // Will be redirected by the above useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4" />
          <span>Issue #{issue.id}</span>
        </div>
      </div>

      <IssueDetail issue={issue} />
    </div>
  );
};

export default IssuePage;
