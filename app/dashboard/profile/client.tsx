"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileText, Lock, DollarSign, Landmark } from "lucide-react";

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
  basicSalary: number;
  salaryStructure: string;
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
  userRole: string;
}

export function ProfileClient({ initialData, isAdmin, canEditSalary, userRole }: ProfileClientProps) {
  const [profileData, setProfileData] = useState<ProfileData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserAccess, setSelectedUserAccess] = useState<AdminAccessData>({
    canApproveLeaves: false,
    canApprovePay: false,
    canManageUsers: false,
    canViewReports: false,
  });

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
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updated = await response.json();
        setProfileData(updated);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal and professional information</p>
      </div>

      <Tabs defaultValue="resume" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input
                    value={profileData.mobileNumber}
                    onChange={(e) => handleProfileChange("mobileNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={profileData.company}
                    onChange={(e) => handleProfileChange("company", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={profileData.department}
                    onChange={(e) => handleProfileChange("department", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <Input
                    value={profileData.manager}
                    onChange={(e) => handleProfileChange("manager", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={profileData.location}
                    onChange={(e) => handleProfileChange("location", e.target.value)}
                  />
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <Label>User Role</Label>
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
          <Card>
            <CardHeader>
              <CardTitle>Salary Information</CardTitle>
              {!canEditSalary && (
                <p className="text-sm text-amber-600 mt-2">
                  Salary information can only be edited by Admin or Payroll Officer
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Basic Salary</Label>
                  <Input
                    type="number"
                    value={profileData.basicSalary}
                    onChange={(e) => handleProfileChange("basicSalary", Number(e.target.value))}
                    disabled={!canEditSalary}
                    className={!canEditSalary ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salary Structure</Label>
                  <Input
                    value={profileData.salaryStructure}
                    onChange={(e) => handleProfileChange("salaryStructure", e.target.value)}
                    disabled={!canEditSalary}
                    className={!canEditSalary ? "bg-muted" : ""}
                  />
                </div>
              </div>
              <Button onClick={saveProfile} disabled={isSaving || !canEditSalary} className="w-full">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
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
      </Tabs>
    </div>
  );
}
