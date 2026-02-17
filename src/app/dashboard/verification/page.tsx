"use client";

import React, { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldCheck, Upload, FileText, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function VerificationPage() {
  const { user } = useAuth();
  const { licenses, addLicense } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      addLicense({
        id: `lic-${Date.now()}`,
        name: file.name,
        uploadDate: new Date().toISOString().split("T")[0],
        type: "License Document",
      });
      setUploading(false);
      toast.success("Document uploaded successfully");
    }, 1000);

    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verification</h1>
        <p className="text-muted-foreground">
          Manage your depot verification status and license documents
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${
                user?.isVerified
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              {user?.isVerified ? (
                <ShieldCheck className="h-8 w-8" />
              ) : (
                <Clock className="h-8 w-8" />
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl font-semibold">{user?.depotName}</h2>
                {user?.isVerified && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {user?.isVerified
                  ? "Your depot has been verified and approved. Your verification badge is visible to all pharmacies."
                  : "Your verification is pending. Please upload all required documents below."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requirements</CardTitle>
          <CardDescription>
            Ensure all documents are up-to-date for continued verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Operating License", required: true, uploaded: true },
              { name: "Import Permit", required: true, uploaded: true },
              { name: "Tax Clearance Certificate", required: true, uploaded: false },
              { name: "Good Distribution Practice Certificate", required: false, uploaded: false },
              { name: "Insurance Certificate", required: false, uploaded: false },
            ].map((doc) => (
              <div
                key={doc.name}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  doc.uploaded
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-dashed"
                }`}
              >
                {doc.uploaded ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.required ? "Required" : "Optional"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Uploaded Documents</CardTitle>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{doc.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doc.uploadDate}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Approved
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
