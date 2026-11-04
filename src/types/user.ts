export type UserRole = "lab_admin" | "lab_user";

export interface UserPermissions {
  releaseReport: boolean;
  editPgxSpecimenResultData: boolean;
  viewPgxPortal: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdOn: string;
  role: UserRole;
  permissions: UserPermissions;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  permissions: UserPermissions;
}
