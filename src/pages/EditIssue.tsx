
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import IssueForm from "@/components/issues/IssueForm";
import { useIssues } from "@/contexts/IssueContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const EditIssue = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIssue } = useIssues();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssue = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      try {
        const fetchedIssue = await getIssue(id);
        
        if (!fetchedIssue) {
          toast({
            variant: "destructive",
            title: "Issue not found",
            description: "The issue you're trying to edit doesn't exist.",
          });
          navigate("/");
          return;
        }

        // Check if user has permission to edit
        if (!user || (!isAdmin() && user.id !== fetchedIssue.reporterId)) {
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "You don't have permission to edit this issue.",
          });
          navigate("/");
          return;
        }

        setIssue(fetchedIssue);
      } catch (error) {
        console.error("Error fetching issue:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load the issue.",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id, navigate, getIssue, user, isAdmin, toast]);

  const handleSubmitSuccess = () => {
    toast({
      title: "Issue updated",
      description: "Your issue has been updated successfully.",
    });
    navigate(`/issue/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!issue) {
    return null;
  }

  const defaultValues = {
    title: issue.title,
    description: issue.description,
    category: issue.category,
    location: {
      latitude: issue.location.latitude,
      longitude: issue.location.longitude,
      address: issue.location.address,
    },
    photos: issue.photos || [],
    isPublic: issue.isPublic !== false,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Edit Issue</h1>
        <p className="text-muted-foreground">
          Update the details of your reported issue.
        </p>
      </div>
      <IssueForm
        issueId={id}
        defaultValues={defaultValues}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  );
};

export default EditIssue;
