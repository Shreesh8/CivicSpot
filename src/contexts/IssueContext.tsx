
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { logger } from "@/lib/logger";

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
  reporterEmail?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper to convert DB format to app format
const dbToIssue = (dbIssue: any): Issue => ({
  id: dbIssue.id,
  title: dbIssue.title,
  description: dbIssue.description,
  category: dbIssue.category as IssueCategory,
  status: dbIssue.status as IssueStatus,
  location: {
    latitude: dbIssue.location_latitude,
    longitude: dbIssue.location_longitude,
    address: dbIssue.location_address,
  },
  photos: dbIssue.photos || [],
  reporterId: dbIssue.reporter_id,
  reporterName: dbIssue.reporter_name,
  reporterEmail: dbIssue.reporter_email,
  isPublic: dbIssue.is_public,
  createdAt: dbIssue.created_at,
  updatedAt: dbIssue.updated_at,
});

// Helper to convert app format to DB format
const issueToDb = (issue: Partial<Issue>) => ({
  title: issue.title,
  description: issue.description,
  category: issue.category,
  status: issue.status,
  location_latitude: issue.location?.latitude,
  location_longitude: issue.location?.longitude,
  location_address: issue.location?.address,
  photos: issue.photos,
  reporter_id: issue.reporterId,
  reporter_name: issue.reporterName,
  reporter_email: issue.reporterEmail,
  is_public: issue.isPublic,
});

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

export const IssueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchIssues();
  }, [user]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setIssues(data.map(dbToIssue));
      }
    } catch (error: any) {
      logger.error('Error fetching issues:', error);
      toast({
        title: "Error loading issues",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addIssue = async (issue: Omit<Issue, "id" | "createdAt" | "updatedAt">) => {
    try {
      const dbIssue = issueToDb(issue);
      
      const { data, error } = await supabase
        .from('issues')
        .insert([dbIssue])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newIssue = dbToIssue(data);
        setIssues([newIssue, ...issues]);
        
        toast({
          title: "Issue Reported",
          description: "Thank you for reporting this issue!",
        });
      }
    } catch (error: any) {
      logger.error('Error adding issue:', error);
      toast({
        title: "Error reporting issue",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateIssue = async (id: string, updatedData: Partial<Issue>) => {
    try {
      const dbUpdate = issueToDb(updatedData);
      
      const { data, error } = await supabase
        .from('issues')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updatedIssue = dbToIssue(data);
        setIssues(issues.map(issue => issue.id === id ? updatedIssue : issue));
        
        toast({
          title: "Issue Updated",
          description: "The issue has been updated successfully",
        });
      }
    } catch (error: any) {
      logger.error('Error updating issue:', error);
      toast({
        title: "Error updating issue",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteIssue = async (id: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIssues(issues.filter(issue => issue.id !== id));
      
      toast({
        title: "Issue Deleted",
        description: "The issue has been deleted successfully",
      });
    } catch (error: any) {
      logger.error('Error deleting issue:', error);
      toast({
        title: "Error deleting issue",
        description: error.message,
        variant: "destructive",
      });
    }
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
