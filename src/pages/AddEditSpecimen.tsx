import { useState, useEffect, useMemo } from "react";
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
import {
  ArrowLeft,
  Save,
  X,
  TestTube2,
  User,
  Building2,
  Pill,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import LabHeader from "@/components/LabHeader";
import { useSpecimenContext } from "@/context/SpecimenContext";
import { Specimen, PrescribedMedication } from "@/data/mockSpecimens";
import { searchDrugBank, DrugBankRecord } from "@/data/mockDrugBank";
import { toast } from "sonner";

export const PANEL_OPTIONS = [
  "Comprehensive PGx Panel",
  "Targeted PGx Panel",
  "Cardio PGx Panel",
  "Cardiology Panel",
  "Neuro PGx Panel",
  "Psychiatric PGx Panel",
  "Pain PGx Panel",
  "Infectious Disease Panel",
  "Custom PGx Panel",
];

export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export const AddEditSpecimen = () => {
  const { specimenId } = useParams<{ specimenId?: string }>();
  const navigate = useNavigate();
  const { getSpecimenById, addSpecimen, updateSpecimen } = useSpecimenContext();

  const isEditing = Boolean(specimenId);
  const existingSpecimen = specimenId ? getSpecimenById(specimenId) : undefined;

  // Form state covering all values from ID to Current Medications Comments
  const [formData, setFormData] = useState({
    // Specimen & Tracking
    lcId: "",
    specimenId: "",
    panelName: "Cardiology Panel",
    reportTitle: "Pharmacogenomics (PGx) Test Report",
    specimenType: "Buccal swab",
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
    mrn: "",

    // Provider & Facility
    providerTitle: "Dr.",
    provider: "",
    providerNPI: "",
    facility: "Recovery Unplugged",
    facilityAddressLine1: "1 Sweet Lane, Suite T",
    facilityAddressLine2: "",
    facilityCity: "Downtown",
    facilityState: "NE",
    facilityCountry: "USA",
    facilityZip: "00045",
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

  // Currently Prescribed Medications & DrugBank search state
  const [prescribedMedications, setPrescribedMedications] = useState<PrescribedMedication[]>([]);
  const [isSearchingDrug, setIsSearchingDrug] = useState(false);
  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ results: DrugBankRecord[]; totalCount: number }>({
    results: [],
    totalCount: 0,
  });

  const availablePanels = useMemo(() => {
    if (formData.panelName && !PANEL_OPTIONS.includes(formData.panelName)) {
      return [formData.panelName, ...PANEL_OPTIONS];
    }
    return PANEL_OPTIONS;
  }, [formData.panelName]);

  useEffect(() => {
    if (drugSearchQuery.trim()) {
      const res = searchDrugBank(drugSearchQuery);
      setSearchResults(res);
    } else {
      setSearchResults({ results: [], totalCount: 0 });
    }
  }, [drugSearchQuery]);

  useEffect(() => {
    if (existingSpecimen) {
      setFormData({
        lcId: existingSpecimen.lcId || "",
        specimenId: existingSpecimen.specimenId || "",
        panelName: existingSpecimen.panelName || "Cardiology Panel",
        reportTitle: existingSpecimen.reportTitle || "Pharmacogenomics (PGx) Test Report",
        specimenType: existingSpecimen.specimenType || existingSpecimen.collectionMethodLabel || "Buccal swab",
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
        mrn: existingSpecimen.mrn || "",

        providerTitle: existingSpecimen.providerTitle || "Dr.",
        provider: existingSpecimen.provider || "",
        providerNPI: existingSpecimen.providerNPI || "",
        facility: existingSpecimen.facility || "Recovery Unplugged",
        facilityAddressLine1: existingSpecimen.facilityAddressLine1 || existingSpecimen.facilityAddress?.split(",")[0]?.trim() || "1 Sweet Lane, Suite T",
        facilityAddressLine2: existingSpecimen.facilityAddressLine2 || "",
        facilityCity: existingSpecimen.facilityCity || "Downtown",
        facilityState: existingSpecimen.facilityState || existingSpecimen.providerState || "NE",
        facilityCountry: existingSpecimen.facilityCountry || "USA",
        facilityZip: existingSpecimen.facilityZip || "00045",
        facilityAddress: existingSpecimen.facilityAddress || "",
        providerState: existingSpecimen.providerState || "NE",

        currentMedicationsList: existingSpecimen.currentMedicationsList || "",
        currentMedicationsModelName: existingSpecimen.currentMedicationsModelName || "",
        currentMedicationsReason: existingSpecimen.currentMedicationsReason || "",
        currentMedicationsComments: existingSpecimen.currentMedicationsComments || "",
      });

      // Load Prescribed Medications (Default specimen 1 to Rosuvastatin if not already set)
      if (existingSpecimen.prescribedMedications && existingSpecimen.prescribedMedications.length > 0) {
        setPrescribedMedications(existingSpecimen.prescribedMedications);
      } else if (existingSpecimen.id === "1" || specimenId === "1" || existingSpecimen.currentMedicationsList?.toLowerCase().includes("rosuvastatin")) {
        setPrescribedMedications([
          { id: "med-1", name: "Rosuvastatin", sig: "", dosage: "5 mg/l", formulation: "Rosuvastatin 5 mg Oral Tablet" }
        ]);
      } else if (existingSpecimen.currentMedicationsList) {
        const parsed = existingSpecimen.currentMedicationsList
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
          .map((name, idx) => ({
            id: `med-${idx}`,
            name,
            sig: "",
            dosage: "10 mg",
          }));
        setPrescribedMedications(parsed);
      } else {
        setPrescribedMedications([]);
      }
    } else if (!isEditing) {
      // Pre-fill smart defaults for new specimen
      const today = new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      setFormData((prev) => ({
        ...prev,
        lcId: `${Math.floor(4300 + Math.random() * 200)}`,
        specimenId: `SP-${Math.floor(100000 + Math.random() * 900000)}`,
        collected: today,
        received: today,
      }));
      setPrescribedMedications([]);
    }
  }, [existingSpecimen, isEditing, specimenId]);

  const handleSelectDrug = (record: DrugBankRecord) => {
    const newMed: PrescribedMedication = {
      id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: record.name,
      sig: "",
      dosage: record.strength || "5 mg/l",
      formulation: record.formulation,
    };
    setPrescribedMedications((prev) => [...prev, newMed]);
    setDrugSearchQuery("");
    setIsSearchingDrug(false);
    toast.success(`Added ${record.name} to prescribed medications`);
  };

  const handleUpdateMed = (id: string, field: "sig" | "dosage", val: string) => {
    setPrescribedMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  const handleRemoveMed = (id: string) => {
    setPrescribedMedications((prev) => prev.filter((m) => m.id !== id));
  };

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

    // 1. PanelName
    if (!formData.panelName.trim()) {
      errs.panelName = "Panel Name is required";
    }

    // 2. ReportTitle
    if (!formData.reportTitle.trim()) {
      errs.reportTitle = "Report Title is required";
    }

    // 3. PatientFName
    if (!formData.patientFirstName.trim()) {
      errs.patientFirstName = "Patient First Name is required";
    }

    // 4. PatientLName
    if (!formData.patientLastName.trim()) {
      errs.patientLastName = "Patient Last Name is required";
    }

    // 5. PatientDOB
    if (!formData.dateOfBirth.trim()) {
      errs.dateOfBirth = "Date of Birth is required";
    }

    // 6. PatientGender
    if (!formData.gender.trim()) {
      errs.gender = "Patient Gender is required";
    }

    // 7. SpecimenId
    if (!formData.specimenId.trim()) {
      errs.specimenId = "Specimen ID is required";
    }

    // 8. SpecimenType
    if (!formData.specimenType.trim()) {
      errs.specimenType = "Specimen Type is required";
    }

    // 9. SpecimenCollectedDate
    if (!formData.collected.trim()) {
      errs.collected = "Collected Date is required";
    }

    // 10. SpecimenReceivedDate
    if (!formData.received.trim()) {
      errs.received = "Received Date is required";
    }

    // 11. ProviderName
    if (!formData.provider.trim()) {
      errs.provider = "Provider Name is required";
    }

    // 12. FacilityName
    if (!formData.facility.trim()) {
      errs.facility = "Facility Name is required";
    }

    // 13. FacilityAddressLine1
    if (!formData.facilityAddressLine1.trim()) {
      errs.facilityAddressLine1 = "Facility Address Line 1 is required";
    }

    // 14. FacilityCity
    if (!formData.facilityCity.trim()) {
      errs.facilityCity = "Facility City is required";
    }

    // 15. FacilityState
    if (!formData.facilityState.trim()) {
      errs.facilityState = "Facility State is required";
    }

    // 16. FacilityCountry
    if (!formData.facilityCountry.trim()) {
      errs.facilityCountry = "Facility Country is required";
    }

    // 17. FacilityZip
    if (!formData.facilityZip.trim()) {
      errs.facilityZip = "Facility Zip is required";
    }

    // 18 & 19. DrugName & Strength
    if (prescribedMedications.length === 0) {
      errs.medications = "At least one medication is required (Drug Name & Strength are mandatory)";
    } else {
      const hasMissingDrug = prescribedMedications.some((m) => !m.name.trim());
      const hasMissingStrength = prescribedMedications.some((m) => !(m.dosage?.trim() || m.strength?.trim()));
      if (hasMissingDrug) {
        errs.drugName = "Drug Name is required for all medications";
      }
      if (hasMissingStrength) {
        errs.strength = "Strength is required for all medications";
      }
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

    const addressParts = [
      formData.facilityAddressLine1,
      formData.facilityAddressLine2,
      formData.facilityCity,
      `${formData.facilityState} ${formData.facilityZip}`.trim(),
      formData.facilityCountry,
    ].filter(Boolean);
    const derivedAddress = addressParts.join(", ");

    const payload: Partial<Specimen> = {
      ...formData,
      facilityAddress: derivedAddress,
      collectionMethodLabel: formData.specimenType,
      prescribedMedications: prescribedMedications.map((m) => ({
        ...m,
        strength: m.dosage || m.strength || "",
      })),
      currentMedicationsList: prescribedMedications.map((m) => m.name).join(", "),
    };

    try {
      if (isEditing && (existingSpecimen || specimenId)) {
        const targetId = existingSpecimen?.id || specimenId!;
        updateSpecimen(targetId, payload);
        navigate(`/lab-user/specimen/${targetId}`);
      } else {
        const created = addSpecimen(payload);
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
            className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-white cursor-pointer"
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
              Enter or update PGx specimen details and clinical information.
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
                Primary specimen identifier, panel name, report title, dates, and specimen type.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <Label htmlFor="panelName" className="text-xs font-semibold text-foreground">
                  Panel Name <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.panelName}
                  onValueChange={(val) => handleChange("panelName", val)}
                >
                  <SelectTrigger
                    id="panelName"
                    className={`mt-1 h-9 ${errors.panelName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  >
                    <SelectValue placeholder="Select panel name" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availablePanels.map((panel) => (
                      <SelectItem key={panel} value={panel}>
                        {panel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.panelName && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.panelName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reportTitle" className="text-xs font-semibold text-foreground">
                  Report Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reportTitle"
                  value={formData.reportTitle}
                  onChange={(e) => handleChange("reportTitle", e.target.value)}
                  placeholder="e.g. Pharmacogenomics (PGx) Test Report"
                  className={`mt-1 h-9 ${errors.reportTitle ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.reportTitle && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.reportTitle}</p>
                )}
              </div>

              <div>
                <Label htmlFor="specimenType" className="text-xs font-semibold text-foreground">
                  Specimen Type <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="specimenType"
                  value={formData.specimenType}
                  onChange={(e) => {
                    handleChange("specimenType", e.target.value);
                    handleChange("collectionMethodLabel", e.target.value);
                  }}
                  placeholder="e.g. Buccal swab"
                  className={`mt-1 h-9 ${errors.specimenType ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.specimenType && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.specimenType}</p>
                )}
              </div>

              <div>
                <Label htmlFor="collected" className="text-xs font-semibold text-foreground">
                  Specimen Collected Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="collected"
                  type="text"
                  value={formData.collected}
                  onChange={(e) => handleChange("collected", e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className={`mt-1 h-9 ${errors.collected ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.collected && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.collected}</p>
                )}
              </div>

              <div>
                <Label htmlFor="received" className="text-xs font-semibold text-foreground">
                  Specimen Received Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="received"
                  type="text"
                  value={formData.received}
                  onChange={(e) => handleChange("received", e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className={`mt-1 h-9 ${errors.received ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.received && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.received}</p>
                )}
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
                  Patient Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="text"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className={`mt-1 h-9 ${errors.dateOfBirth ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.dateOfBirth && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <Label htmlFor="gender" className="text-xs font-semibold text-foreground">
                  Patient Gender <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(val) => handleChange("gender", val)}>
                  <SelectTrigger id="gender" className={`mt-1 h-9 ${errors.gender ? "border-destructive focus-visible:ring-destructive" : ""}`}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Female (F)</SelectItem>
                    <SelectItem value="M">Male (M)</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="U">Unknown (U)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.gender}</p>
                )}
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
                <Label htmlFor="provider" className="text-xs font-semibold text-foreground">
                  Provider Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => handleChange("provider", e.target.value)}
                  placeholder="e.g. JAANKI BHAKTA"
                  className={`mt-1 h-9 ${errors.provider ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.provider && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.provider}</p>
                )}
              </div>

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
                  Facility Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="facility"
                  value={formData.facility}
                  onChange={(e) => handleChange("facility", e.target.value)}
                  placeholder="e.g. Recovery Unplugged"
                  className={`mt-1 h-9 ${errors.facility ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.facility && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.facility}</p>
                )}
              </div>

              <div>
                <Label htmlFor="facilityAddressLine1" className="text-xs font-semibold text-foreground">
                  Facility Address Line 1 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="facilityAddressLine1"
                  value={formData.facilityAddressLine1}
                  onChange={(e) => handleChange("facilityAddressLine1", e.target.value)}
                  placeholder="Street Address, Suite / Room"
                  className={`mt-1 h-9 ${errors.facilityAddressLine1 ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.facilityAddressLine1 && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.facilityAddressLine1}</p>
                )}
              </div>

              <div>
                <Label htmlFor="facilityAddressLine2" className="text-xs font-semibold text-foreground">
                  Facility Address Line 2
                </Label>
                <Input
                  id="facilityAddressLine2"
                  value={formData.facilityAddressLine2}
                  onChange={(e) => handleChange("facilityAddressLine2", e.target.value)}
                  placeholder="Suite, Apt, Floor, Unit (Optional)"
                  className="mt-1 h-9"
                />
              </div>

              <div>
                <Label htmlFor="facilityCity" className="text-xs font-semibold text-foreground">
                  Facility City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="facilityCity"
                  value={formData.facilityCity}
                  onChange={(e) => handleChange("facilityCity", e.target.value)}
                  placeholder="City"
                  className={`mt-1 h-9 ${errors.facilityCity ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.facilityCity && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.facilityCity}</p>
                )}
              </div>

              <div>
                <Label htmlFor="facilityState" className="text-xs font-semibold text-foreground">
                  Facility State <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={
                    US_STATES.find(
                      (s) =>
                        s.code.toLowerCase() === formData.facilityState?.toLowerCase() ||
                        s.name.toLowerCase() === formData.facilityState?.toLowerCase()
                    )?.code || formData.facilityState
                  }
                  onValueChange={(val) => {
                    handleChange("facilityState", val);
                    handleChange("providerState", val);
                  }}
                >
                  <SelectTrigger
                    id="facilityState"
                    className={`mt-1 h-9 ${errors.facilityState ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {US_STATES.map((st) => (
                      <SelectItem key={st.code} value={st.code}>
                        {st.name} ({st.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.facilityState && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.facilityState}</p>
                )}
              </div>

              <div>
                <Label htmlFor="facilityCountry" className="text-xs font-semibold text-foreground">
                  Facility Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="facilityCountry"
                  value={formData.facilityCountry}
                  onChange={(e) => handleChange("facilityCountry", e.target.value)}
                  placeholder="e.g. USA"
                  className={`mt-1 h-9 ${errors.facilityCountry ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.facilityCountry && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.facilityCountry}</p>
                )}
              </div>

              <div>
                <Label htmlFor="facilityZip" className="text-xs font-semibold text-foreground">
                  Facility Zip <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="facilityZip"
                  value={formData.facilityZip}
                  onChange={(e) => handleChange("facilityZip", e.target.value)}
                  placeholder="Zip / Postal Code"
                  className={`mt-1 h-9 ${errors.facilityZip ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.facilityZip && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{errors.facilityZip}</p>
                )}
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
                Search DrugBank to manage prescribed medications, sig, and strength for PGx testing.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Errors if missing required medications */}
              {(errors.medications || errors.drugName || errors.strength) && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errors.medications || errors.drugName || errors.strength}</span>
                </div>
              )}

              {/* Search Mode - Image 1 */}
              {isSearchingDrug && (
                <div className="space-y-2">
                  <div className="relative">
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border-2 border-primary/50 bg-background shadow-xs">
                      <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        value={drugSearchQuery}
                        onChange={(e) => setDrugSearchQuery(e.target.value)}
                        placeholder="Search DrugBank (e.g. rosuvasta, omeprazole, warfarin, atorvastatin...)"
                        className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
                      />
                      {drugSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setDrugSearchQuery("")}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsSearchingDrug(false);
                          setDrugSearchQuery("");
                        }}
                        className="h-7 px-2 text-xs text-muted-foreground hover:bg-accent hover:text-white cursor-pointer"
                      >
                        Cancel
                      </Button>
                    </div>

                    {/* Dropdown Results from DrugBank */}
                    {drugSearchQuery.trim() && (
                      <div className="mt-1.5 rounded-lg border border-border bg-popover shadow-xl overflow-hidden z-20">
                        {/* Alert Banner as shown in Image 1 */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>
                            <strong className="font-semibold text-foreground">
                              {searchResults.totalCount} records
                            </strong>{" "}
                            of {drugSearchQuery} exist, choose the correct one
                          </span>
                        </div>

                        {/* List of matching DrugBank records */}
                        <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
                          {searchResults.results.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectDrug(item)}
                              className="px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 cursor-pointer flex items-center justify-between transition-colors group"
                            >
                              <span>
                                {item.name}{" "}
                                <span className="text-muted-foreground">
                                  ({item.formulation})
                                </span>
                              </span>
                              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prescribed Medications Rows - Image 2 */}
              {prescribedMedications.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="hidden sm:flex items-center gap-3 px-3.5 text-xs font-semibold text-muted-foreground">
                    <div className="sm:w-52">
                      Drug Name <span className="text-destructive">*</span>
                    </div>
                    <div className="flex-1">Sig</div>
                    <div className="sm:w-48">
                      Strength <span className="text-destructive">*</span>
                    </div>
                    <div className="w-9 text-center">Action</div>
                  </div>
                  {prescribedMedications.map((med) => (
                    <div
                      key={med.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-lg border border-border bg-background shadow-xs hover:border-border/80 transition-all"
                    >
                      <div className="sm:w-52 font-medium text-sm text-foreground truncate">
                        {med.name || <span className="text-destructive text-xs">Drug Name required *</span>}
                      </div>
                      <div className="flex-1">
                        <Input
                          value={med.sig}
                          onChange={(e) => handleUpdateMed(med.id, "sig", e.target.value)}
                          placeholder="Sig"
                          className="h-10 text-sm"
                        />
                      </div>
                      <div className="sm:w-48">
                        <Input
                          value={med.dosage}
                          onChange={(e) => handleUpdateMed(med.id, "dosage", e.target.value)}
                          placeholder="Strength (e.g. 5 mg/l)"
                          className={`h-10 text-sm ${!med.dosage?.trim() ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMed(med.id)}
                        aria-label={`Delete ${med.name}`}
                        className="h-9 w-9 rounded-full bg-muted/60 hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                !isSearchingDrug && (
                  <div className={`py-6 text-center text-sm border border-dashed rounded-lg ${errors.medications ? "border-destructive text-destructive bg-destructive/5" : "border-border text-muted-foreground"}`}>
                    No medications prescribed yet. Click "Add Medication" below to search and add from DrugBank.
                  </div>
                )
              )}

              {/* Add Medication Button Bar - Image 2 */}
              {!isSearchingDrug && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchingDrug(true);
                    setDrugSearchQuery("");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-border hover:border-primary/60 hover:bg-primary/5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span>Add Medication</span>
                </button>
              )}
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

