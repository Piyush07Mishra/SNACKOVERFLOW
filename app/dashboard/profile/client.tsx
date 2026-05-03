"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileText, Lock, DollarSign, Landmark, Trash2, Plus, Download, Upload, Image, File, X, User as UserIcon } from "lucide-react";
import { calculateSalaryComponents, getTotalEarnings, getNetSalary } from "@/lib/salaryCalculations";
import { generatePDFFromHTML } from "@/lib/pdfGenerator";

interface SalaryComponent {
  name: string;
  computationType: "Fixed" | "Percentage";
  value: number;
  calculatedValue: number;
  basisComponent?: string;
}

interface SalaryConfig {
  pfRate: number;
  professionalTax: number;
}

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  role: string;
  jobPosition: string;
  mobileNumber: string;
  company: string;
  department: string;
  manager: string;
  location: string;
  dateOfBirth: string;
  residingAddress: string;
  nationality: string;
  personalEmail: string;
  gender: string;
  maritalStatus: string;
  wageType?: string;
  basicSalary: number;
  salaryComponents?: SalaryComponent[];
  salaryConfig?: SalaryConfig;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
    panNo: string;
    uanNo: string;
  };
  adminPermissions?: {
    canApproveLeaves: boolean;
    canApprovePay: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
  };
  profileImage?: string;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  }>;
}

interface AdminAccessData {
  canApproveLeaves: boolean;
  canApprovePay: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
}

interface ProfileClientProps {
  initialData: ProfileData;
  isAdmin: boolean;
  canEditSalary: boolean;
  canEditRole?: boolean;
  canEditProfile?: boolean;
  isOtherUserProfile?: boolean;
  userRole: string;
}

export function ProfileClient({ 
  initialData, 
  isAdmin, 
  canEditSalary, 
  canEditRole = false, 
  canEditProfile = true,
  isOtherUserProfile = false,
  userRole 
}: ProfileClientProps) {
  const [profileData, setProfileData] = useState<ProfileData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [salaryComponents, setSalaryComponents] = useState<SalaryComponent[]>(
    (initialData.salaryComponents || []).map((comp) => ({
      ...comp,
      calculatedValue: comp.calculatedValue ?? 0,
    }))
  );
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig>(
    initialData.salaryConfig || { pfRate: 12, professionalTax: 200 }
  );
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserAccess, setSelectedUserAccess] = useState<AdminAccessData>({
    canApproveLeaves: false,
    canApprovePay: false,
    canManageUsers: false,
    canViewReports: false,
  });

  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [documentName, setDocumentName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminUsers();
    }
  }, [isAdmin]);

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleProfileChange = (field: string, value: any) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBankDetailsChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileData,
          salaryComponents,
          salaryConfig,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setProfileData(updated);
        setSalaryComponents(updated.salaryComponents || []);
        setSalaryConfig(updated.salaryConfig || { pfRate: 12, professionalTax: 200 });
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Error saving profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);
    try {
      const response = await fetch(`/api/admin/access/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUserAccess(data);
      }
    } catch (error) {
      console.error("Error fetching user access:", error);
    }
  };

  const handleAccessChange = (field: string, value: boolean) => {
    setSelectedUserAccess((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateComponents = () => {
    const calculated = calculateSalaryComponents(
      salaryComponents,
      profileData.basicSalary
    );
    setSalaryComponents(calculated);
  };

  useEffect(() => {
    // Recalculate whenever wage changes
    if (profileData.basicSalary > 0) {
      calculateComponents();
    }
  }, [profileData.basicSalary]);

  const handleAddComponent = () => {
    const newComponent: SalaryComponent = {
      name: "",
      computationType: "Fixed",
      value: 0,
      calculatedValue: 0,
      basisComponent: "",
    };
    setSalaryComponents([...salaryComponents, newComponent]);
  };

  const handleUpdateComponent = (index: number, field: string, value: any) => {
    const updated = [...salaryComponents];
    (updated[index] as any)[field] = value;
    setSalaryComponents(updated);
  };

  const handleDeleteComponent = (index: number) => {
    setSalaryComponents(salaryComponents.filter((_, i) => i !== index));
  };

  const handleSalaryConfig = (field: string, value: number) => {
    setSalaryConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveUserAccess = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/access/${selectedUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPermissions: selectedUserAccess }),
      });

      if (response.ok) {
        toast.success("Access permissions updated successfully!");
      } else {
        toast.error("Failed to update access permissions");
      }
    } catch (error) {
      console.error("Error saving access:", error);
      toast.error("Error saving access permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadProfile = async () => {
    try {
      await generatePDFFromHTML("profile-content", `${profileData.name}-profile.pdf`);
      toast.success("Profile downloaded successfully!");
    } catch (error) {
      console.error("Error downloading profile:", error);
      toast.error("Failed to download profile");
    }
  };

  // File upload functions
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setProfileImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select an image file");
      }
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFile(file);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImageFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', profileImageFile);
      formData.append('type', 'profile');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Update profile data with new image path
        setProfileData(prev => ({
          ...prev,
          profileImage: data.filePath
        }));
        
        // Save to database
        await saveProfile();
        toast.success("Profile image uploaded successfully!");
        setProfileImageFile(null);
        setProfileImagePreview("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast.error("Failed to upload profile image");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadDocument = async () => {
    if (!documentFile || !documentName || !documentType) {
      toast.error("Please fill all document fields");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('type', 'document');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add document to profile
        const newDocument = {
          id: Date.now().toString(),
          name: documentName,
          type: documentType,
          filePath: data.filePath,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.fileType,
          uploadedAt: new Date().toISOString()
        };

        setProfileData(prev => ({
          ...prev,
          documents: [...(prev.documents || []), newDocument]
        }));

        // Save to database
        await saveProfile();
        toast.success("Document uploaded successfully!");
        setDocumentFile(null);
        setDocumentName("");
        setDocumentType("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      setProfileData(prev => ({
        ...prev,
        documents: prev.documents?.filter(doc => doc.id !== documentId) || []
      }));
      
      await saveProfile();
      toast.success("Document deleted successfully!");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isOtherUserProfile ? `${profileData.name}'s Profile` : "My Profile"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isOtherUserProfile 
              ? "View and manage employee information and settings" 
              : "Manage your personal and professional information"}
          </p>
        </div>
        
        {isOtherUserProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm">
                <span className="font-semibold">Email:</span> {profileData.email}
              </span>
              {canEditRole && (
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                  You can change this employee's role
                </span>
              )}
              {canEditSalary && !canEditRole && (
                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                  You can edit salary information
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={handleDownloadProfile}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download Profile
        </Button>
      </div>

      <div id="profile-content" className="space-y-6">
        <Tabs defaultValue="resume" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resume" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resume
          </TabsTrigger>
          <TabsTrigger value="private" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Private Info
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="uploads" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Uploads
          </TabsTrigger>
        </TabsList>

        {/* Resume Tab */}
        <TabsContent value="resume">
          <Card>
            <CardHeader>
              <CardTitle>Resume Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    disabled={!canEditProfile}
                    className={!canEditProfile ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profileData.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Job Position</Label>
                  <Input
                    value={profileData.jobPosition}
                    onChange={(e) => handleProfileChange("jobPosition", e.target.value)}
                    disabled={!canEditProfile}
                    className={!canEditProfile ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input
                    value={profileData.mobileNumber}
                    onChange={(e) => handleProfileChange("mobileNumber", e.target.value)}
                    disabled={!canEditProfile}
                    className={!canEditProfile ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={profileData.company}
                    onChange={(e) => handleProfileChange("company", e.target.value)}
                    disabled={!canEditProfile}
                    className={!canEditProfile ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={profileData.department}
                    onChange={(e) => handleProfileChange("department", e.target.value)}
                    disabled={!canEditProfile}
                    className={!canEditProfile ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <Input
                    value={profileData.manager}
                    onChange={(e) => handleProfileChange("manager", e.target.value)}
                    disabled={!canEditProfile}
                    className={!canEditProfile ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={profileData.location}
                    onChange={(e) => handleProfileChange("location", e.target.value)}
                    disabled={!canEditProfile}
                    className={!canEditProfile ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                {canEditRole && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      User Role
                      {isOtherUserProfile && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin Only</span>}
                    </Label>
                    <Select value={profileData.role} onValueChange={(value) => handleProfileChange("role", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="HR_Officer">HR Officer</SelectItem>
                        <SelectItem value="Payroll_Officer">Payroll Officer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Button onClick={saveProfile} disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Private Info Tab */}
        <TabsContent value="private">
          <Card>
            <CardHeader>
              <CardTitle>Private Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={
                      profileData.dateOfBirth
                        ? new Date(profileData.dateOfBirth).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => handleProfileChange("dateOfBirth", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Residing Address</Label>
                  <Input
                    value={profileData.residingAddress}
                    onChange={(e) => handleProfileChange("residingAddress", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input
                    value={profileData.nationality}
                    onChange={(e) => handleProfileChange("nationality", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Personal Email</Label>
                  <Input
                    type="email"
                    value={profileData.personalEmail}
                    onChange={(e) => handleProfileChange("personalEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={profileData.gender} onValueChange={(value) => handleProfileChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  <Input
                    value={profileData.maritalStatus}
                    onChange={(e) => handleProfileChange("maritalStatus", e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={saveProfile} disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary">
          <div className="space-y-4">
            {/* Info Card */}
            <Card className={canEditSalary ? "border-blue-200 bg-blue-50/50" : "border-green-200 bg-green-50/50"}>
              <CardContent className="pt-6">
                <p className={canEditSalary ? "text-sm text-blue-700" : "text-sm text-green-700"}>
                  {canEditSalary 
                    ? isOtherUserProfile
                      ? "📝 You have permission to edit this employee's salary configuration"
                      : "📝 You can edit salary components and configuration" 
                    : "👁️ You can view your salary structure. Contact HR or Admin to make changes."}
                </p>
              </CardContent>
            </Card>

            {/* Wage Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Wage Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Wage Type</Label>
                    <Select value={profileData.wageType || "Fixed"} onValueChange={(value) => handleProfileChange("wageType", value)} disabled={!canEditSalary}>
                      <SelectTrigger disabled={!canEditSalary} className={!canEditSalary ? "bg-muted cursor-not-allowed" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                        <SelectItem value="Variable">Variable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Wage Amount (₹)</Label>
                    <Input
                      type="number"
                      value={profileData.basicSalary}
                      onChange={(e) => handleProfileChange("basicSalary", Number(e.target.value))}
                      disabled={!canEditSalary}
                      className={!canEditSalary ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salary Components */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Salary Components</CardTitle>
                  {canEditSalary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddComponent}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Component
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {salaryComponents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No salary components defined yet.</p>
                ) : (
                  <div className="space-y-3">
                    {canEditSalary ? (
                      // Edit Mode for Admin/Payroll
                      salaryComponents.map((component, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                            <div className="space-y-2">
                              <Label>Component Name</Label>
                              <Input
                                value={component.name}
                                onChange={(e) => handleUpdateComponent(index, "name", e.target.value)}
                                placeholder="e.g., Basic, HRA, DA"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Computation Type</Label>
                              <Select value={component.computationType} onValueChange={(value) => handleUpdateComponent(index, "computationType", value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Fixed">Fixed Amount</SelectItem>
                                  <SelectItem value="Percentage">Percentage</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>{component.computationType === "Fixed" ? "Amount (₹)" : "Percentage (%)"}</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={component.value}
                                onChange={(e) => handleUpdateComponent(index, "value", Number(e.target.value))}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Calculated Value (₹)</Label>
                              <Input
                                type="number"
                                value={component.calculatedValue || 0}
                                disabled
                                className="bg-muted"
                              />
                            </div>
                          </div>
                          {component.computationType === "Percentage" && (
                            <div className="mb-3">
                              <Label>Basis Component (if % of another component)</Label>
                              <Select value={component.basisComponent || ""} onValueChange={(value) => handleUpdateComponent(index, "basisComponent", value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select basis component (leave empty for % of wage)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Wage</SelectItem>
                                  {salaryComponents.map((comp, i) => (
                                    i !== index && comp.name && (
                                      <SelectItem key={i} value={comp.name}>
                                        {comp.name}
                                      </SelectItem>
                                    )
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteComponent(index)}
                              className="gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      // View Mode for Employees
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {salaryComponents.map((component, index) => (
                          <div
                            key={index}
                            className="border border-blue-200 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/50"
                          >
                            <h3 className="font-semibold text-sm mb-2">{component.name}</h3>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Type:</span>
                                <span>{component.computationType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Value:</span>
                                <span>{component.value}{component.computationType === "Percentage" ? "%" : "₹"}</span>
                              </div>
                              <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-blue-700 dark:text-blue-300">
                                <span>Calculated:</span>
                                <span>₹{(component.calculatedValue || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Salary Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Deductions Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PF Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={salaryConfig.pfRate}
                      onChange={(e) => handleSalaryConfig("pfRate", Number(e.target.value))}
                      disabled={!canEditSalary}
                      className={!canEditSalary ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Professional Tax (₹)</Label>
                    <Input
                      type="number"
                      value={salaryConfig.professionalTax}
                      onChange={(e) => handleSalaryConfig("professionalTax", Number(e.target.value))}
                      disabled={!canEditSalary}
                      className={!canEditSalary ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salary Breakdown */}
            {salaryComponents.length > 0 && profileData.basicSalary > 0 && (
              <Card className="bg-blue-50/50">
                <CardHeader>
                  <CardTitle>Salary Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">Earnings</h3>
                        <div className="space-y-2">
                          {salaryComponents.map((comp, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{comp.name}:</span>
                              <span className="font-medium">₹{(comp.calculatedValue || 0).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                            <span>Total Earnings:</span>
                            <span>₹{getTotalEarnings(salaryComponents).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3">Deductions</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>PF ({salaryConfig.pfRate}%):</span>
                            <span className="font-medium">₹{((salaryConfig.pfRate / 100) * getTotalEarnings(salaryComponents)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Professional Tax:</span>
                            <span className="font-medium">₹{salaryConfig.professionalTax.toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                            <span>Total Deductions:</span>
                            <span>₹{(((salaryConfig.pfRate / 100) * getTotalEarnings(salaryComponents)) + salaryConfig.professionalTax).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4 mt-4 flex justify-between text-lg font-bold bg-white dark:bg-slate-900 p-3 rounded">
                      <span>Net Salary:</span>
                      <span className="text-green-600">
                        ₹{getNetSalary(getTotalEarnings(salaryComponents), ((salaryConfig.pfRate / 100) * getTotalEarnings(salaryComponents)) + salaryConfig.professionalTax).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {canEditSalary && (
              <Button onClick={saveProfile} disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Salary Configuration"}
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-4">
            {/* Bank Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={profileData.bankDetails.bankName}
                      onChange={(e) => handleBankDetailsChange("bankName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={profileData.bankDetails.accountNumber}
                      onChange={(e) => handleBankDetailsChange("accountNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input
                      value={profileData.bankDetails.ifscCode}
                      onChange={(e) => handleBankDetailsChange("ifscCode", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch Name</Label>
                    <Input
                      value={profileData.bankDetails.branchName}
                      onChange={(e) => handleBankDetailsChange("branchName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN Number</Label>
                    <Input
                      value={profileData.bankDetails.panNo}
                      onChange={(e) => handleBankDetailsChange("panNo", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UAN Number</Label>
                    <Input
                      value={profileData.bankDetails.uanNo}
                      onChange={(e) => handleBankDetailsChange("uanNo", e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={saveProfile} disabled={isSaving} className="w-full">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Admin Access Control Card */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Access Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <Select value={selectedUserId} onValueChange={handleUserSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {adminUsers.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedUserId && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canApproveLeaves"
                          checked={selectedUserAccess.canApproveLeaves}
                          onCheckedChange={(checked) =>
                            handleAccessChange("canApproveLeaves", checked as boolean)
                          }
                        />
                        <Label htmlFor="canApproveLeaves" className="font-normal cursor-pointer">
                          Can Approve Leaves
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canApprovePay"
                          checked={selectedUserAccess.canApprovePay}
                          onCheckedChange={(checked) =>
                            handleAccessChange("canApprovePay", checked as boolean)
                          }
                        />
                        <Label htmlFor="canApprovePay" className="font-normal cursor-pointer">
                          Can Approve Payroll
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canManageUsers"
                          checked={selectedUserAccess.canManageUsers}
                          onCheckedChange={(checked) =>
                            handleAccessChange("canManageUsers", checked as boolean)
                          }
                        />
                        <Label htmlFor="canManageUsers" className="font-normal cursor-pointer">
                          Can Manage Users
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="canViewReports"
                          checked={selectedUserAccess.canViewReports}
                          onCheckedChange={(checked) =>
                            handleAccessChange("canViewReports", checked as boolean)
                          }
                        />
                        <Label htmlFor="canViewReports" className="font-normal cursor-pointer">
                          Can View Reports
                        </Label>
                      </div>

                      <Button onClick={saveUserAccess} disabled={isSaving} className="w-full">
                        {isSaving ? "Saving..." : "Save Access Permissions"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Uploads Tab */}
        <TabsContent value="uploads">
          <div className="space-y-6">
            {/* Profile Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Profile Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  {/* Current Profile Image */}
                  <div className="relative">
                    {profileData.profileImage ? (
                      <img 
                        src={profileData.profileImage} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
                        <UserIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        disabled={isUploading}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploading ? "Uploading..." : "Choose Image"}
                      </Button>
                    </div>

                    {profileImagePreview && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Preview:</p>
                        <img 
                          src={profileImagePreview} 
                          alt="Preview" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={uploadProfileImage}
                            disabled={isUploading}
                            size="sm"
                            className="gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            {isUploading ? "Uploading..." : "Upload"}
                          </Button>
                          <Button
                            onClick={() => {
                              setProfileImageFile(null);
                              setProfileImagePreview("");
                            }}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Form */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 space-y-4">
                  <div className="text-center">
                    <File className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload documents like resume, certificates, ID proofs, etc.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resume">Resume</SelectItem>
                          <SelectItem value="certificate">Certificate</SelectItem>
                          <SelectItem value="identity">Identity Proof</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Document Name</Label>
                      <Input
                        placeholder="e.g., Bachelor's Degree Certificate"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>File</Label>
                    <input
                      ref={documentInputRef}
                      type="file"
                      onChange={handleDocumentChange}
                      className="hidden"
                    />
                    <Button
                      onClick={() => documentInputRef.current?.click()}
                      variant="outline"
                      disabled={isUploading}
                      className="w-full gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {documentFile ? documentFile.name : "Choose File"}
                    </Button>
                  </div>

                  {documentFile && documentName && documentType && (
                    <div className="flex gap-2">
                      <Button
                        onClick={uploadDocument}
                        disabled={isUploading}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {isUploading ? "Uploading..." : "Upload Document"}
                      </Button>
                      <Button
                        onClick={() => {
                          setDocumentFile(null);
                          setDocumentName("");
                          setDocumentType("");
                        }}
                        variant="outline"
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {/* Documents List */}
                {profileData.documents && profileData.documents.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Uploaded Documents</h3>
                    <div className="grid gap-3">
                      {profileData.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <File className="h-8 w-8 text-primary" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="capitalize">{doc.type}</span>
                                <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.filePath, '_blank')}
                            >
                              View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteDocument(doc.id)}
                              className="gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!profileData.documents || profileData.documents.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
