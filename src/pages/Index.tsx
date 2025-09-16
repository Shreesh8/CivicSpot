
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIssues } from "@/contexts/IssueContext";
import { MapPin, Users, CheckCircle, Clock, Plus, ArrowRight } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const { issues } = useIssues();

  const stats = {
    total: issues.length,
    resolved: issues.filter(issue => issue.status === 'resolved').length,
    inProgress: issues.filter(issue => issue.status === 'in_progress').length,
    open: issues.filter(issue => issue.status === 'open').length,
  };

  const successRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Empower Your <span className="text-primary">Community</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Report civic issues, track progress, and work together to make your neighborhood a better place to live.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to="/report">
                  <Button size="lg" className="text-lg px-8 py-6">
                    <Plus className="h-5 w-5 mr-2" />
                    Report an Issue
                  </Button>
                </Link>
              ) : (
                <Link to="/signup">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Get Started
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              )}
              <Link to="/map">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  <MapPin className="h-5 w-5 mr-2" />
                  View Map
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Issues</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.resolved}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-amber-500 mb-2">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-500 mb-2">{stats.open}</div>
                <div className="text-sm text-muted-foreground">Open</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How CivicSpot Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to make a difference in your community
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Report Issues</CardTitle>
                <CardDescription>
                  Spot a problem? Take a photo, add location details, and submit your report in seconds.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Follow your reports and see real-time updates as local authorities work to resolve issues.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>See Results</CardTitle>
                <CardDescription>
                  Watch as your community improves with each resolved issue and successful collaboration.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of citizens who are actively improving their communities through CivicSpot.
          </p>
          {user ? (
            <Link to="/report">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-6">
                <Plus className="h-5 w-5 mr-2" />
                Report Your First Issue
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="secondary" size="lg" className="text-lg px-8 py-6">
                  Sign Up Now
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Already have an account?
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
