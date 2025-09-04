import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Personal Information</h4>
              <p className="text-muted-foreground">
                We collect information you provide when creating an account, including your name, 
                email address, and any optional profile information you choose to share.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Issue Reports</h4>
              <p className="text-muted-foreground">
                When you report issues, we collect the description, category, location data, 
                and any photos you attach. This information is used to facilitate resolution 
                by relevant authorities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Usage Information</h4>
              <p className="text-muted-foreground">
                We automatically collect certain information about your use of the platform, 
                including IP address, browser type, and usage patterns to improve our services.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Process and manage issue reports</li>
              <li>• Communicate with you about reported issues</li>
              <li>• Improve platform functionality and user experience</li>
              <li>• Ensure platform security and prevent misuse</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Information Sharing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We share your information only in the following circumstances:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• With local authorities when you submit public issue reports</li>
              <li>• When required by law or legal process</li>
              <li>• To protect the rights and safety of users and the public</li>
              <li>• With service providers who assist in platform operations (under strict confidentiality agreements)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or destruction. 
              However, no method of transmission over the internet is 100% secure.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Rights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Access and review your personal information</li>
              <li>• Correct inaccurate or incomplete data</li>
              <li>• Delete your account and associated data</li>
              <li>• Object to certain uses of your information</li>
              <li>• Request data portability</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, contact us at privacy@civicspot.com
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes by posting the new Privacy Policy on this page and updating 
              the "Last updated" date.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;