import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, X, TestTube2, User, Building2, Pill } from "lucide-react";
import LabHeader from "@/components/LabHeader";
import { useSpecimenContext } from "@/context/SpecimenContext";
import { Specimen } from "@/data/mockSpecimens";
import { toast } from "sonner";

export const AddEditSpecimen = () => {
  const { specimenId } = useParams<{ specimenId?: string }>();
  const navigate = useNavigate();
  const { getSpecimenById, addSpecimen, updateSpecimen } = useSpecimenContext();

  const isEditing = Boolean(specimenId);
  const existingSpecimen = specimenId ? getSpecimenById(specimenId) : undefined;

  // Form state covering all values from LC ID to Current Medications Comments
  const [formData, setFormData] = useState({
    // Specimen & Tracking
    lcId: "",
    specimenId: "",
    status: "New",
    collected: "",
    received: "",
    reported: "",
    collectionMethodCode: "1733104001",
    collectionMethodLabel: "Buccal swab",

    // Patient
    patientFirstName: "",
    patientLastName: "",
    dateOfBirth: "",
    gender: "F",
    race: "Not Specified",
    mrn: "",

    // Provider & Facility
    providerTitle: "Dr.",
    provider: "",
    providerNPI: "",
    facility: "Recovery Unplugged",
    facilityAddress: "1 Sweet Lane, Suite T, Downtown, NE 00045",
    providerState: "NE",

    // Current Medications
    currentMedicationsList: "",
    currentMedicationsModelName: "PGx Standard v2",
    currentMedicationsReason: "",
    currentMedicationsComments: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingSpecimen) {
      setFormData({
        lcId: existingSpecimen.lcId || "",
        specimenId: existingSpecimen.specimenId || "",
        status: existingSpecimen.status || "New",
        collected: existingSpecimen.collected || "",
        received: existingSpecimen.received || "",
        reported: existingSpecimen.reported || "",
        collectionMethodCode: existingSpecimen.collectionMethodCode || "1733104001",
        collectionMethodLabel: existingSpecimen.collectionMethodLabel || "Buccal swab",

        patientFirstName: existingSpecimen.patientFirstName || "",
        patientLastName: existingSpecimen.patientLastName || "",
        dateOfBirth: existingSpecimen.dateOfBirth || "",
        gender: existingSpecimen.gender || "F",
        race: existingSpecimen.race || "Not Specified",
        mrn: existingSpecimen.mrn || "",

        providerTitle: existingSpecimen.providerTitle || "Dr.",
        provider: existingSpecimen.provider || "",
        providerNPI: existingSpecimen.providerNPI || "",
        facility: existingSpecimen.facility || "Recovery Unplugged",
        facilityAddress: existingSpecimen.facilityAddress || "",
        providerState: existingSpecimen.providerState || "NE",

        currentMedicationsList: existingSpecimen.currentMedicationsList || "",
        currentMedicationsModelName: existingSpecimen.currentMedicationsModelName || "",
        currentMedicationsReason: existingSpecimen.currentMedicationsReason || "",
        currentMedicationsComments: existingSpecimen.currentMedicationsComments || "",
      });
    } else if (!isEditing) {
      // Pre-fill smart defaults for new specimen
      const today = new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      setFormData((prev) => ({
        ...prev,
        lcId: `LC-${Math.floor(4300 + Math.random() * 200)}`,
        specimenId: `SP-${Math.floor(100000 + Math.random() * 900000)}`,
        collected: today,
        received: today,
      }));
    }
  }, [existingSpecimen, isEditing]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.specimenId.trim()) {
      errs.specimenId = "Specimen ID is required";
    }
    if (!formData.patientFirstName.trim()) {
      errs.patientFirstName = "Patient First Name is required";
    }
    if (!formData.patientLastName.trim()) {
      errs.patientLastName = "Patient Last Name is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && (existingSpecimen || specimenId)) {
        const targetId = existingSpecimen?.id || specimenId!;
        updateSpecimen(targetId, formData as Partial<Specimen>);
        navigate(`/lab-user/specimen/${targetId}`);
      } else {
        const created = addSpecimen(formData as Partial<Specimen>);
        navigate(`/lab-user`);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the specimen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <LabHeader />

      <div className="max-w-6xl mx-auto px-6 pt-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <nav className="text-sm text-muted-foreground">
            <span
              className="text-link cursor-pointer hover:underline"
              onClick={() => navigate("/lab-user")}
            >
              Specimens
            </span>
            <span className="mx-1">›</span>
            <span
              className="text-link cursor-pointer hover:underline"
              onClick={() => navigate("/lab-user")}
            >
              PGx
            </span>
            <span className="mx-1">›</span>
            <span className="text-foreground font-medium">
              {isEditing ? `Edit Specimen (${formData.specimenId || specimenId})` : "Add Specimen"}
            </span>
          </nav>
        </div>

        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditing ? `Edit Specimen: ${formData.specimenId || specimenId}` : "Add New Specimen"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter or update all PGx specimen details from LC ID through Current Medications Comments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="cursor-pointer gap-1.5"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="cursor-pointer gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              {isEditing ? "Save Changes" : "Create Specimen"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Specimen & Order Information */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2">
                <TestTube2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Specimen & Order Information</CardTitle>
              </div>
              <CardDescription>
                Primary specimen identifiers, order dates, status, and collection method.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="lcId" className="text-xs font-semibold text-foreground">
                  LC ID
                </Label>
                <Input
                  id="lcId"
                  value={formData.lcId}
                  onChange={(e) => handleChange("lcId", e.target.value)}
                  placeholder="e.g. LC-4429"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="specimenId" className="text-xs font-semibold text-foreground">
                  Specimen ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="specimenId"
                  value={formData.specimenId}
                  onChange={(e) => handleChange("specimenId", e.target.value)}
                  placeholder="e.g. DEVTest_100"
                  className={`mt-1 h-9 ${errors.specimenId ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.specimenId && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.specimenId}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status" className="text-xs font-semibold text-foreground">
                  Report Status
                </Label>
                <Select value={formData.status} onValueChange={(val) => handleChange("status", val)}>
                  <SelectTrigger id="status" className="mt-1 h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Awaiting Release">Awaiting Release</SelectItem>
                    <SelectItem value="Released">Released</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="collected" className="text-xs font-semibold text-foreground">
                  Collected Date
                </Label>
                <Input
                  id="collected"
                  type="text"
                  value={formData.collected}
                  onChange={(e) => handleChange("collected", e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="received" className="text-xs font-semibold text-foreground">
                  Received Date
                </Label>
                <Input
                  id="received"
                  type="text"
                  value={formData.received}
                  onChange={(e) => handleChange("received", e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="reported" className="text-xs font-semibold text-foreground">
                  Reported Date
                </Label>
                <Input
                  id="reported"
                  type="text"
                  value={formData.reported}
                  onChange={(e) => handleChange("reported", e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="collectionMethodLabel" className="text-xs font-semibold text-foreground">
                  Collection Method Label
                </Label>
                <Select
                  value={formData.collectionMethodLabel}
                  onValueChange={(val) => {
                    handleChange("collectionMethodLabel", val);
                    if (val === "Buccal swab") handleChange("collectionMethodCode", "1733104001");
                    else if (val === "Saliva") handleChange("collectionMethodCode", "1733104002");
                    else if (val === "Blood (EDTA)") handleChange("collectionMethodCode", "1733104003");
                  }}
                >
                  <SelectTrigger id="collectionMethodLabel" className="mt-1 h-9">
                    <SelectValue placeholder="Select collection method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buccal swab">Buccal swab</SelectItem>
                    <SelectItem value="Saliva">Saliva</SelectItem>
                    <SelectItem value="Blood (EDTA)">Blood (EDTA)</SelectItem>
                    <SelectItem value="Blood (Heparin)">Blood (Heparin)</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="collectionMethodCode" className="text-xs font-semibold text-foreground">
                  Collection Method Code
                </Label>
                <Input
                  id="collectionMethodCode"
                  value={formData.collectionMethodCode}
                  onChange={(e) => handleChange("collectionMethodCode", e.target.value)}
                  placeholder="e.g. 1733104001"
                  className="mt-1 h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Patient Information */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Patient Information</CardTitle>
              </div>
              <CardDescription>
                Patient demographics, identification numbers, and attributes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="patientFirstName" className="text-xs font-semibold text-foreground">
                  Patient First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="patientFirstName"
                  value={formData.patientFirstName}
                  onChange={(e) => handleChange("patientFirstName", e.target.value)}
                  placeholder="Enter first name"
                  className={`mt-1 h-9 ${errors.patientFirstName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.patientFirstName && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.patientFirstName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="patientLastName" className="text-xs font-semibold text-foreground">
                  Patient Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="patientLastName"
                  value={formData.patientLastName}
                  onChange={(e) => handleChange("patientLastName", e.target.value)}
                  placeholder="Enter last name"
                  className={`mt-1 h-9 ${errors.patientLastName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.patientLastName && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.patientLastName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="dateOfBirth" className="text-xs font-semibold text-foreground">
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="text"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-xs font-semibold text-foreground">
                  Gender
                </Label>
                <Select value={formData.gender} onValueChange={(val) => handleChange("gender", val)}>
                  <SelectTrigger id="gender" className="mt-1 h-9">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Female (F)</SelectItem>
                    <SelectItem value="M">Male (M)</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="U">Unknown (U)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="race" className="text-xs font-semibold text-foreground">
                  Race
                </Label>
                <Select value={formData.race} onValueChange={(val) => handleChange("race", val)}>
                  <SelectTrigger id="race" className="mt-1 h-9">
                    <SelectValue placeholder="Select race" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Caucasian">Caucasian</SelectItem>
                    <SelectItem value="African American">African American</SelectItem>
                    <SelectItem value="Asian">Asian</SelectItem>
                    <SelectItem value="Hispanic">Hispanic</SelectItem>
                    <SelectItem value="Native American">Native American</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Not Specified">Not Specified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mrn" className="text-xs font-semibold text-foreground">
                  MRN (Medical Record Number)
                </Label>
                <Input
                  id="mrn"
                  value={formData.mrn}
                  onChange={(e) => handleChange("mrn", e.target.value)}
                  placeholder="e.g. MRN-1001"
                  className="mt-1 h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Provider & Facility Information */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Provider & Facility Information</CardTitle>
              </div>
              <CardDescription>
                Ordering healthcare provider and clinical testing facility details.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="providerTitle" className="text-xs font-semibold text-foreground">
                  Provider Title
                </Label>
                <Select value={formData.providerTitle} onValueChange={(val) => handleChange("providerTitle", val)}>
                  <SelectTrigger id="providerTitle" className="mt-1 h-9">
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="MD">MD</SelectItem>
                    <SelectItem value="DO">DO</SelectItem>
                    <SelectItem value="NP">NP</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="provider" className="text-xs font-semibold text-foreground">
                  Provider Full Name
                </Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => handleChange("provider", e.target.value)}
                  placeholder="e.g. JAANKI BHAKTA"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="providerNPI" className="text-xs font-semibold text-foreground">
                  Provider NPI
                </Label>
                <Input
                  id="providerNPI"
                  value={formData.providerNPI}
                  onChange={(e) => handleChange("providerNPI", e.target.value)}
                  placeholder="10-digit NPI number"
                  maxLength={10}
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="facility" className="text-xs font-semibold text-foreground">
                  Facility Name
                </Label>
                <Input
                  id="facility"
                  value={formData.facility}
                  onChange={(e) => handleChange("facility", e.target.value)}
                  placeholder="e.g. Recovery Unplugged"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="facilityAddress" className="text-xs font-semibold text-foreground">
                  Provider Location / Facility Address
                </Label>
                <Input
                  id="facilityAddress"
                  value={formData.facilityAddress}
                  onChange={(e) => handleChange("facilityAddress", e.target.value)}
                  placeholder="Street Address, City, State ZIP"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="providerState" className="text-xs font-semibold text-foreground">
                  Provider State
                </Label>
                <Select value={formData.providerState} onValueChange={(val) => handleChange("providerState", val)}>
                  <SelectTrigger id="providerState" className="mt-1 h-9">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"].map((st) => (
                      <SelectItem key={st} value={st}>{st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Current Medications & Clinical Information */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Current Medications & Clinical Information</CardTitle>
              </div>
              <CardDescription>
                Medication regimen, PGx model name, reason for prescription, and clinical comments.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentMedicationsList" className="text-xs font-semibold text-foreground">
                    Current Medications List
                  </Label>
                  <Input
                    id="currentMedicationsList"
                    value={formData.currentMedicationsList}
                    onChange={(e) => handleChange("currentMedicationsList", e.target.value)}
                    placeholder="e.g. Omeprazole, Citalopram, Warfarin, Metoprolol"
                    className="mt-1 h-9"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Comma-separated list of active medications to evaluate against PGx drug guidelines.
                  </p>
                </div>

                <div>
                  <Label htmlFor="currentMedicationsModelName" className="text-xs font-semibold text-foreground">
                    Current Medications Model Name
                  </Label>
                  <Input
                    id="currentMedicationsModelName"
                    value={formData.currentMedicationsModelName}
                    onChange={(e) => handleChange("currentMedicationsModelName", e.target.value)}
                    placeholder="e.g. PGx Standard Model v2"
                    className="mt-1 h-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currentMedicationsReason" className="text-xs font-semibold text-foreground">
                  Current Medications Reason
                </Label>
                <Input
                  id="currentMedicationsReason"
                  value={formData.currentMedicationsReason}
                  onChange={(e) => handleChange("currentMedicationsReason", e.target.value)}
                  placeholder="e.g. Depression, Cardiovascular Risk, Acid Reflux"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="currentMedicationsComments" className="text-xs font-semibold text-foreground">
                  Current Medications Comments
                </Label>
                <Textarea
                  id="currentMedicationsComments"
                  value={formData.currentMedicationsComments}
                  onChange={(e) => handleChange("currentMedicationsComments", e.target.value)}
                  placeholder="Enter any clinical notes, adverse drug reactions, dosage nuances, or physician instructions..."
                  rows={4}
                  className="mt-1 resize-y min-h-[90px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => navigate(-1)}
              className="cursor-pointer gap-1.5"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]"
            >
              <Save className="h-4 w-4" />
              {isEditing ? "Save Changes" : "Create Specimen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditSpecimen;

