import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">About CivicSpot</h1>
        <p className="text-lg text-muted-foreground">
          Empowering citizens to improve their communities through collaborative issue reporting and resolution.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              CivicSpot is dedicated to bridging the gap between citizens and local authorities by providing 
              a transparent, efficient platform for reporting and tracking community issues. Our mission is 
              to foster civic engagement and create more responsive, accountable governance at the local level.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Report Issues</h4>
                <p className="text-muted-foreground">
                  Citizens can easily report problems in their community, from potholes to broken streetlights, 
                  using our intuitive reporting system with photo documentation and precise location mapping.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Track Progress</h4>
                <p className="text-muted-foreground">
                  Monitor the status of reported issues in real-time as authorities review, prioritize, 
                  and work to resolve community problems.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Build Better Communities</h4>
                <p className="text-muted-foreground">
                  Together, we create a feedback loop that leads to more responsive governance and 
                  continuously improving neighborhoods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Interactive map-based issue reporting</li>
              <li>• Photo documentation for better issue description</li>
              <li>• Real-time status tracking</li>
              <li>• Category-based issue organization</li>
              <li>• Community engagement and transparency</li>
              <li>• Mobile-responsive design for on-the-go reporting</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Have questions or feedback about CivicSpot? We'd love to hear from you.
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p>Email: support@civicspot.com</p>
              <p>Phone: (555) 123-4567</p>
              <p>Address: 123 Civic Center, Community City, CC 12345</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;