
import React from "react";
import { Issue, IssueStatus, useIssues } from "@/contexts/IssueContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  MapPin,
  Calendar,
  User,
  Clock,
  Edit,
  Trash,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface IssueDetailProps {
  issue: Issue;
}

const IssueDetail: React.FC<IssueDetailProps> = ({ issue }) => {
  const { user, isAdmin } = useAuth();
  const { updateIssue, deleteIssue } = useIssues();
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP");
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "p");
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Open
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="outline"
            className="bg-civic-yellow text-black flex items-center gap-1"
          >
            <Loader2 className="h-3 w-3 animate-spin" /> In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="bg-civic-green text-white flex items-center gap-1"
          >
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const canEdit = user && (isAdmin() || user.id === issue.reporterId);

  const handleStatusUpdate = (newStatus: IssueStatus) => {
    updateIssue(issue.id, { status: newStatus });
    toast({
      title: "Status Updated",
      description: `Issue status changed to ${newStatus.replace("_", " ")}`,
    });
  };

  const handleDelete = () => {
    deleteIssue(issue.id);
    toast({
      title: "Issue Deleted",
      description: "The issue has been deleted successfully",
    });
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{issue.title}</h1>
        <div>{getStatusBadge(issue.status)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Description */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-700 dark:text-gray-300">
                {issue.description}
              </p>
            </CardContent>
          </Card>

          {/* Issue Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 mr-2" />
                <span>
                  {issue.location.address
                    ? issue.location.address
                    : `${issue.location.latitude.toFixed(
                        6
                      )}, ${issue.location.longitude.toFixed(6)}`}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Reported on {formatDate(issue.createdAt)}</span>
              </div>

              {issue.createdAt !== issue.updatedAt && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Last updated on {formatDate(issue.updatedAt)}</span>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <User className="h-4 w-4 mr-2" />
                <span>Reported by {issue.reporterName}</span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          {isAdmin() && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium mb-4">Admin Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={issue.status === "open" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusUpdate("open")}
                    disabled={issue.status === "open"}
                  >
                    Mark as Open
                  </Button>
                  <Button
                    variant={
                      issue.status === "in_progress" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={issue.status === "in_progress"}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    variant={issue.status === "resolved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusUpdate("resolved")}
                    disabled={issue.status === "resolved"}
                  >
                    Mark Resolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit/Delete Actions */}
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/edit-issue/${issue.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the issue and remove it from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Photos */}
          {issue.photos.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium mb-4">Photos</h3>
                <div className="grid grid-cols-1 gap-4">
                  {issue.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Issue photo ${index + 1}`}
                      className="w-full h-auto rounded-md"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map Preview */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium mb-4">Location</h3>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                <iframe
                  title="Issue Location"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    issue.location.longitude - 0.002
                  }%2C${issue.location.latitude - 0.002}%2C${
                    issue.location.longitude + 0.002
                  }%2C${
                    issue.location.latitude + 0.002
                  }&layer=mapnik&marker=${issue.location.latitude}%2C${
                    issue.location.longitude
                  }`}
                ></iframe>
              </div>
            </CardContent>
          </Card>

          {/* Category Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="mr-4">
                  <Badge className="bg-primary">{formatCategory(issue.category)}</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>Reported: {formatDate(issue.createdAt)}</div>
                  <div>Time: {formatTime(issue.createdAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
