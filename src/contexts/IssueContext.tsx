
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export type IssueCategory = 
  | "road_damage" 
  | "sanitation" 
  | "lighting" 
  | "graffiti" 
  | "sidewalk" 
  | "vegetation" 
  | "other";

export type IssueStatus = "open" | "in_progress" | "resolved";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photos: string[];
  reporterId: string;
  reporterName: string;
  createdAt: string;
  updatedAt: string;
}

interface IssueContextType {
  issues: Issue[];
  loading: boolean;
  addIssue: (issue: Omit<Issue, "id" | "createdAt" | "updatedAt">) => void;
  updateIssue: (id: string, updatedData: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  getIssue: (id: string) => Issue | undefined;
  filterIssues: (filters: { category?: IssueCategory; status?: IssueStatus }) => Issue[];
}

const IssueContext = createContext<IssueContextType | undefined>(undefined);

// Sample data for demonstration
const sampleIssues: Issue[] = [
  {
    id: "1",
    title: "Large pothole on Main Street",
    description: "There's a dangerous pothole in the middle of Main Street near the intersection with Oak Avenue. It's been growing for weeks and now it's about 2 feet wide.",
    category: "road_damage",
    status: "open",
    location: {
      latitude: 40.712776,
      longitude: -74.005974,
      address: "123 Main St, New York, NY 10001",
    },
    photos: ["https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800"],
    reporterId: "2",
    reporterName: "Regular User",
    createdAt: "2023-05-15T14:22:00Z",
    updatedAt: "2023-05-15T14:22:00Z",
  },
  {
    id: "2",
    title: "Broken streetlight",
    description: "Streetlight near the community park has been out for over a week, making the area unsafe at night.",
    category: "lighting",
    status: "in_progress",
    location: {
      latitude: 40.714776,
      longitude: -74.003974,
      address: "45 Park Ave, New York, NY 10002",
    },
    photos: ["https://images.unsplash.com/photo-1589463349208-93b2dd8af50a?w=800"],
    reporterId: "2",
    reporterName: "Regular User",
    createdAt: "2023-05-10T09:45:00Z",
    updatedAt: "2023-05-12T16:30:00Z",
  },
  {
    id: "3",
    title: "Overflowing trash bin",
    description: "The trash bin at the corner of Pine and 5th has been overflowing for days. It's attracting pests and creating an unpleasant smell.",
    category: "sanitation",
    status: "resolved",
    location: {
      latitude: 40.718776,
      longitude: -74.009974,
      address: "Corner of Pine St and 5th Ave, New York, NY 10003",
    },
    photos: ["https://images.unsplash.com/photo-1605600659453-128bfdb0912a?w=800"],
    reporterId: "2",
    reporterName: "Regular User",
    createdAt: "2023-05-05T11:15:00Z",
    updatedAt: "2023-05-07T08:20:00Z",
  },
  {
    id: "4",
    title: "Fallen tree blocking sidewalk",
    description: "A tree has fallen and is completely blocking the sidewalk on Cedar Street. Pedestrians are forced to walk in the road which is dangerous.",
    category: "vegetation",
    status: "in_progress",
    location: {
      latitude: 40.717776,
      longitude: -74.001974,
      address: "88 Cedar St, New York, NY 10006",
    },
    photos: ["https://images.unsplash.com/photo-1559333086-b0a56225a93c?w=800"],
    reporterId: "2",
    reporterName: "Regular User",
    createdAt: "2023-05-08T16:40:00Z",
    updatedAt: "2023-05-09T10:15:00Z",
  },
];

export const IssueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Load from localStorage or use sample data
    const savedIssues = localStorage.getItem("civicspot_issues");
    if (savedIssues) {
      setIssues(JSON.parse(savedIssues));
    } else {
      setIssues(sampleIssues);
      localStorage.setItem("civicspot_issues", JSON.stringify(sampleIssues));
    }
    setLoading(false);
  }, []);

  const addIssue = (issue: Omit<Issue, "id" | "createdAt" | "updatedAt">) => {
    const newIssue: Issue = {
      ...issue,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedIssues = [...issues, newIssue];
    setIssues(updatedIssues);
    localStorage.setItem("civicspot_issues", JSON.stringify(updatedIssues));
    
    toast({
      title: "Issue Reported",
      description: "Thank you for reporting this issue!",
    });
  };

  const updateIssue = (id: string, updatedData: Partial<Issue>) => {
    const index = issues.findIndex(issue => issue.id === id);
    
    if (index === -1) {
      toast({
        title: "Error",
        description: "Issue not found",
        variant: "destructive",
      });
      return;
    }

    const updatedIssue = {
      ...issues[index],
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    const updatedIssues = [...issues];
    updatedIssues[index] = updatedIssue;
    
    setIssues(updatedIssues);
    localStorage.setItem("civicspot_issues", JSON.stringify(updatedIssues));
    
    toast({
      title: "Issue Updated",
      description: "The issue has been updated successfully",
    });
  };

  const deleteIssue = (id: string) => {
    const updatedIssues = issues.filter(issue => issue.id !== id);
    
    if (updatedIssues.length === issues.length) {
      toast({
        title: "Error",
        description: "Issue not found",
        variant: "destructive",
      });
      return;
    }
    
    setIssues(updatedIssues);
    localStorage.setItem("civicspot_issues", JSON.stringify(updatedIssues));
    
    toast({
      title: "Issue Deleted",
      description: "The issue has been deleted successfully",
    });
  };

  const getIssue = (id: string) => {
    return issues.find(issue => issue.id === id);
  };

  const filterIssues = (filters: { category?: IssueCategory; status?: IssueStatus }) => {
    return issues.filter(issue => {
      if (filters.category && issue.category !== filters.category) {
        return false;
      }
      if (filters.status && issue.status !== filters.status) {
        return false;
      }
      return true;
    });
  };

  const value = {
    issues,
    loading,
    addIssue,
    updateIssue,
    deleteIssue,
    getIssue,
    filterIssues,
  };

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>;
};

export const useIssues = () => {
  const context = useContext(IssueContext);
  if (context === undefined) {
    throw new Error("useIssues must be used within an IssueProvider");
  }
  return context;
};
