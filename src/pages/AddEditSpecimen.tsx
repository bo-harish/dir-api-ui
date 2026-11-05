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

  // Currently Prescribed Medications & DrugBank search state
  const [prescribedMedications, setPrescribedMedications] = useState<PrescribedMedication[]>([]);
  const [isSearchingDrug, setIsSearchingDrug] = useState(false);
  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ results: DrugBankRecord[]; totalCount: number }>({
    results: [],
    totalCount: 0,
  });

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
        lcId: `LC-${Math.floor(4300 + Math.random() * 200)}`,
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

    const payload: Partial<Specimen> = {
      ...formData,
      prescribedMedications,
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
                Primary specimen identifier, collection and reporting dates, and collection method.
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
                Search DrugBank to manage prescribed medications, sig, and dosage for PGx testing.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
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
                  {prescribedMedications.map((med) => (
                    <div
                      key={med.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-lg border border-border bg-background shadow-xs hover:border-border/80 transition-all"
                    >
                      <div className="sm:w-52 font-medium text-sm text-foreground truncate">
                        {med.name}
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
                          placeholder="5 mg/l"
                          className="h-10 text-sm"
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
                  <div className="py-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    No medications prescribed yet. Click below to search and add medications from DrugBank.
                  </div>
                )
              )}

              {/* + Add Medication Button Bar - Image 2 */}
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
                  <span>+ Add Medication</span>
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

