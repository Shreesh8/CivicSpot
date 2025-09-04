import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              By accessing and using CivicSpot, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Purpose</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              CivicSpot is designed to facilitate communication between citizens and local 
              authorities regarding community issues. The platform serves as a tool for 
              reporting, tracking, and resolving municipal problems in a transparent manner.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Responsibilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Accurate Reporting</h4>
                <p className="text-muted-foreground">
                  Users must provide truthful, accurate information when reporting issues. 
                  False or misleading reports may result in account suspension.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Appropriate Content</h4>
                <p className="text-muted-foreground">
                  All content must be appropriate for public viewing. Users must not post 
                  offensive, discriminatory, or inappropriate material.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Respect for Privacy</h4>
                <p className="text-muted-foreground">
                  When taking photos or providing location information, users must respect 
                  the privacy of others and avoid capturing private property without consent.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prohibited Uses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You may not use CivicSpot for:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Submitting false or fraudulent reports</li>
              <li>• Harassing or threatening individuals or groups</li>
              <li>• Posting content that violates local laws or regulations</li>
              <li>• Attempting to overwhelm the system with spam or duplicate reports</li>
              <li>• Using the platform for commercial advertising</li>
              <li>• Violating the privacy or rights of others</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Moderation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              CivicSpot reserves the right to review, moderate, or remove content that 
              violates these terms or is deemed inappropriate. We may also suspend or 
              terminate accounts that repeatedly violate our guidelines.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              CivicSpot serves as a communication platform between citizens and authorities. 
              We do not guarantee the resolution of reported issues and are not responsible 
              for the actions or inactions of local authorities in response to reports.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Users retain ownership of content they submit but grant CivicSpot a license 
              to use, display, and share this content for the purpose of facilitating 
              issue resolution and platform operation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Users will be 
              notified of significant changes, and continued use of the platform 
              constitutes acceptance of updated terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us at 
              legal@civicspot.com or (555) 123-4567.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;