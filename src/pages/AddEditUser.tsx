import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import emgenexLogo from "@/assets/emgenex-logo.png";
import { UserFormData, UserRole } from "@/types/user";
import { mockUsers } from "@/data/mockUsers";
import { toast } from "sonner";

const AddEditUser = () => {
  const { businessId, userId } = useParams<{ businessId: string; userId: string }>();
  const navigate = useNavigate();
  const isEditing = !!userId;

  const existingUser = isEditing ? mockUsers.find((u) => u.id === userId) : null;

  const [formData, setFormData] = useState<UserFormData>({
    firstName: existingUser?.firstName || "",
    lastName: existingUser?.lastName || "",
    email: existingUser?.email || "",
    phone: existingUser?.phone || "",
    role: existingUser?.role || "lab_user",
    permissions: existingUser?.permissions || {
      releaseReport: false,
      editPgxSpecimenResultData: false,
      viewPgxPortal: false,
    },
  });

  const updateField = <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePermission = (key: keyof UserFormData["permissions"], value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: value },
    }));
  };

  const handleSubmit = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    toast.success(isEditing ? "User updated successfully!" : "User added successfully!");
    navigate(`/edit-business/${businessId}`);
  };

  const handleCancel = () => {
    navigate(`/edit-business/${businessId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <img src={emgenexLogo} alt="Emgenex LIS" className="h-4" />
        </div>

        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Lab User" : "Add Lab User"}
          </h1>
        </div>

        <div className="space-y-6">
          {/* User Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">First Name <span className="text-destructive">•</span></Label>
              <Input
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder="Enter first name..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Last Name <span className="text-destructive">•</span></Label>
              <Input
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                placeholder="Enter last name..."
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Email <span className="text-destructive">•</span></Label>
              <Input
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="Enter email address..."
                type="email"
                className="mt-1"
              />
              {isEditing && (
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
                  >
                    Resend Activation Email
                  </button>
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Enter phone number..."
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">User Role <span className="text-destructive">•</span></Label>
              <Select value={formData.role} onValueChange={(value: UserRole) => updateField("role", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab_admin">Lab Admin</SelectItem>
                  <SelectItem value="lab_user">Lab User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isEditing && existingUser && (
              <div>
                <Label className="text-sm font-medium">Created On</Label>
                <p className="text-sm text-muted-foreground mt-2">{existingUser.createdOn}</p>
              </div>
            )}
          </div>

          {/* Permissions */}
          <div className="border-t pt-6">
            <Label className="text-sm font-semibold text-foreground mb-4 block">Permissions</Label>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="releaseReport"
                  checked={formData.permissions.releaseReport}
                  onCheckedChange={(checked) => updatePermission("releaseReport", !!checked)}
                  className="mt-0.5"
                />
                <div>
                  <label htmlFor="releaseReport" className="text-sm font-medium cursor-pointer">
                    Release Report
                  </label>
                  <p className="text-xs text-muted-foreground">Allow the user to release reports</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="editPgxSpecimenResultData"
                  checked={formData.permissions.editPgxSpecimenResultData}
                  onCheckedChange={(checked) => updatePermission("editPgxSpecimenResultData", !!checked)}
                  className="mt-0.5"
                />
                <div>
                  <label htmlFor="editPgxSpecimenResultData" className="text-sm font-medium cursor-pointer">
                    Edit PGx Specimen Result Data
                  </label>
                  <p className="text-xs text-muted-foreground">Allow the user to edit PGx specimen result data</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="viewPgxPortal"
                  checked={formData.permissions.viewPgxPortal}
                  onCheckedChange={(checked) => updatePermission("viewPgxPortal", !!checked)}
                  className="mt-0.5"
                />
                <div>
                  <label htmlFor="viewPgxPortal" className="text-sm font-medium cursor-pointer">
                    View PGx Portal
                  </label>
                  <p className="text-xs text-muted-foreground">Allow user to access the PGx portal</p>
                </div>
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  className="px-6"
                  onClick={() => {
                    toast.success("User deactivated successfully!");
                    navigate(`/edit-business/${businessId}`);
                  }}
                >
                  Deactivate
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} className="px-6">Cancel</Button>
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
                {isEditing ? "Update" : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditUser;
