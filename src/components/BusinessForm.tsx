import { useState, useEffect } from "react";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Business, BusinessFormData, SERVICE_PANELS } from "@/types/business";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, Info, MapPin, Settings, RefreshCw, Copy, Search, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ACCESSIBLE_BY_OPTIONS } from "@/types/business";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const businessFormSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(100, "Business name must be less than 100 characters"),
  accountContactEmail: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  executiveName: z.string().trim().min(1, "Executive name is required").max(100, "Executive name must be less than 100 characters"),
  executiveTitle: z.string().trim().max(100, "Executive title must be less than 100 characters").optional().or(z.literal("")),
  emailForContractSignature: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  address: z.string().trim().min(1, "Address is required").max(200, "Address must be less than 200 characters"),
  city: z.string().trim().min(1, "City is required").max(100, "City must be less than 100 characters"),
  state: z.string().trim().min(1, "State is required"),
  country: z.string().trim().min(1, "Country is required"),
  phone: z.string().trim().min(1, "Phone is required").regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, "Invalid phone number format"),
  fax: z.string().trim().regex(/^$|^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, "Invalid fax number format").optional().or(z.literal("")),
  webhookUrl: z.string().trim().url("Invalid URL format").optional().or(z.literal("")),
  applicationEnvironment: z.enum(["sandbox", "live"]),
  sandboxTestLimit: z.string().trim().regex(/^$|^[0-9]+$/, "Must be a valid number").optional().or(z.literal("")),
});

interface BusinessFormProps {
  onSubmit: (data: BusinessFormData) => void;
  editingBusiness?: Business | null;
}

const initialFormData: BusinessFormData = {
  businessName: "",
  accountContactEmail: "",
  executiveName: "",
  executiveTitle: "",
  emailForContractSignature: "",
  address: "",
  city: "",
  state: "",
  country: "",
  phone: "",
  fax: "",
  webhookUrl: "",
  applicationEnvironment: "sandbox",
  sandboxTestLimit: "",
  servicePanels: {},
  panelAutoRelease: {},
  resultFiles: [],
  accessibleBy: [],
};

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];

const COUNTRIES = ["United States", "Canada", "Mexico"];

const BusinessForm = ({ onSubmit, editingBusiness }: BusinessFormProps) => {
  const navigate = useNavigate();

  const getInitialFormData = (): BusinessFormData => {
    if (editingBusiness) {
      const addressParts = editingBusiness.address.split(", ");
      return {
        businessName: editingBusiness.name,
        accountContactEmail: editingBusiness.email,
        executiveName: editingBusiness.executiveName,
        executiveTitle: "CEO",
        emailForContractSignature: editingBusiness.email,
        address: addressParts[0] || "",
        city: addressParts[1] || "",
        state: addressParts[2] || "",
        country: "United States",
        phone: editingBusiness.phone,
        fax: "",
        webhookUrl: "",
        applicationEnvironment: "sandbox",
        sandboxTestLimit: "",
        servicePanels: {},
        panelAutoRelease: {},
        resultFiles: [],
        accessibleBy: [],
      };
    }
    return initialFormData;
  };

  const [formData, setFormData] = useState<BusinessFormData>(getInitialFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState({
    businessDetails: true,
    addressContact: true,
    settings: true,
  });

  const [productionAppKey] = useState("prod_app_xxxxxxxxxxxxxxxx");
  const [productionSecretKey, setProductionSecretKey] = useState("prod_secret_xxxxxxxxxxxxxxxxxxxxxxxx");
  const [sandboxAppKey] = useState("sandbox_app_xxxxxxxxxxxxxxxx");
  const [sandboxSecretKey, setSandboxSecretKey] = useState("sandbox_secret_xxxxxxxxxxxxxxxxxxxxxxxx");
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [regenerateKeyType, setRegenerateKeyType] = useState<"productionApp" | "productionSecret" | "sandboxApp" | "sandboxSecret" | null>(null);

  const handleRegenerateClick = (keyType: "productionApp" | "productionSecret" | "sandboxApp" | "sandboxSecret") => {
    setRegenerateKeyType(keyType);
    setRegenerateDialogOpen(true);
  };

  const handleRegenerateConfirm = () => {
    const newKey = `${regenerateKeyType?.includes("production") ? "prod" : "sandbox"}_${regenerateKeyType?.includes("App") ? "app" : "secret"}_${Math.random().toString(36).substring(2, 18)}`;
    switch (regenerateKeyType) {
      case "productionSecret":
        setProductionSecretKey(newKey);
        break;
      case "sandboxSecret":
        setSandboxSecretKey(newKey);
        break;
    }
    toast.success("Key regenerated successfully!");
    setRegenerateDialogOpen(false);
    setRegenerateKeyType(null);
  };

  const handleCopyKey = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Key copied to clipboard");
  };

  const sandboxEnabled = formData.applicationEnvironment === "live";
  const isProductionKey = regenerateKeyType?.includes("production");
  const regenerateDialogTitle = isProductionKey ? "Regenerate Production Keys" : "Regenerate Sandbox Keys";
  const regenerateDialogDescription = isProductionKey
    ? "Are you sure you want to regenerate this Production key? The current key will be invalidated immediately and any applications using it will stop working."
    : "Are you sure you want to regenerate this Sandbox key? The current key will be invalidated immediately and any applications using it will stop working.";

  useEffect(() => {
    setFormData(getInitialFormData());
  }, [editingBusiness]);

  const updateField = <K extends keyof BusinessFormData>(field: K, value: BusinessFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = () => {
    const result = businessFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as string;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fix the validation errors before submitting.");
      return;
    }
    setErrors({});
    onSubmit(formData);
  };

  const handleCancel = () => {
    navigate("/business-listing");
  };

  const RequiredDot = () => <span className="text-destructive ml-1">•</span>;

  const FieldError = ({ field }: { field: string }) => {
    if (!errors[field]) return null;
    return <p className="text-destructive text-xs mt-1">{errors[field]}</p>;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Business Details Section */}
        <Collapsible open={openSections.businessDetails} onOpenChange={() => toggleSection("businessDetails")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-section-header px-4 py-3 rounded">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm uppercase tracking-wide">Business Details</span>
            </div>
            <ChevronUp className={`h-4 w-4 transition-transform ${openSections.businessDetails ? "" : "rotate-180"}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Business Name<RequiredDot /></Label>
                <Input value={formData.businessName} onChange={(e) => updateField("businessName", e.target.value)} placeholder="Enter Business name..." className={`mt-1 ${errors.businessName ? "border-destructive" : ""}`} />
                <FieldError field="businessName" />
              </div>
              <div>
                <Label className="text-sm font-medium">Account Contact Email<RequiredDot /></Label>
                <Input value={formData.accountContactEmail} onChange={(e) => updateField("accountContactEmail", e.target.value)} placeholder="Enter account contact email..." type="email" className={`mt-1 ${errors.accountContactEmail ? "border-destructive" : ""}`} />
                <FieldError field="accountContactEmail" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Executive Name<RequiredDot /></Label>
                <Input value={formData.executiveName} onChange={(e) => updateField("executiveName", e.target.value)} placeholder="Enter executive name..." className={`mt-1 ${errors.executiveName ? "border-destructive" : ""}`} />
                <FieldError field="executiveName" />
              </div>
              <div>
                <Label className="text-sm font-medium">Executive Title</Label>
                <Input value={formData.executiveTitle} onChange={(e) => updateField("executiveTitle", e.target.value)} placeholder="Enter executive title..." className={`mt-1 ${errors.executiveTitle ? "border-destructive" : ""}`} />
                <FieldError field="executiveTitle" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Email for Contract Signature<RequiredDot /></Label>
                <Input value={formData.emailForContractSignature} onChange={(e) => updateField("emailForContractSignature", e.target.value)} placeholder="Enter email for contract signature..." type="email" className={`mt-1 ${errors.emailForContractSignature ? "border-destructive" : ""}`} />
                <FieldError field="emailForContractSignature" />
              </div>
              <div>
                <Label className="text-sm font-medium">Accessible by</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left"
                    >
                      <span className={formData.accessibleBy.length === 0 ? "text-muted-foreground" : ""}>
                        {formData.accessibleBy.length === 0
                          ? "Select users..."
                          : formData.accessibleBy.join(", ")}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                    <div className="space-y-1">
                      {ACCESSIBLE_BY_OPTIONS.map((name) => {
                        const checked = formData.accessibleBy.includes(name);
                        return (
                          <label
                            key={name}
                            className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                const next = v
                                  ? [...formData.accessibleBy, name]
                                  : formData.accessibleBy.filter((n) => n !== name);
                                updateField("accessibleBy", next);
                              }}
                            />
                            {name}
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {editingBusiness && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created On</Label>
                  <p className="mt-2 text-sm text-foreground">{editingBusiness.createdOn}</p>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Address & Contact Section */}
        <Collapsible open={openSections.addressContact} onOpenChange={() => toggleSection("addressContact")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-section-header px-4 py-3 rounded">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm uppercase tracking-wide">Address & Contact</span>
            </div>
            <ChevronUp className={`h-4 w-4 transition-transform ${openSections.addressContact ? "" : "rotate-180"}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Address<RequiredDot /></Label>
              <Input value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Enter the laboratory address..." className={`mt-1 ${errors.address ? "border-destructive" : ""}`} />
              <FieldError field="address" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">City<RequiredDot /></Label>
                <Input value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Enter the city..." className={`mt-1 ${errors.city ? "border-destructive" : ""}`} />
                <FieldError field="city" />
              </div>
              <div>
                <Label className="text-sm font-medium">State<RequiredDot /></Label>
                <Select value={formData.state} onValueChange={(value) => updateField("state", value)}>
                  <SelectTrigger className={`mt-1 ${errors.state ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select the state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError field="state" />
              </div>
              <div>
                <Label className="text-sm font-medium">Country<RequiredDot /></Label>
                <Select value={formData.country} onValueChange={(value) => updateField("country", value)}>
                  <SelectTrigger className={`mt-1 ${errors.country ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select the country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError field="country" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Phone<RequiredDot /></Label>
                <Input value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="Enter the phone number..." className={`mt-1 ${errors.phone ? "border-destructive" : ""}`} />
                <FieldError field="phone" />
              </div>
              <div>
                <Label className="text-sm font-medium">Fax</Label>
                <Input value={formData.fax} onChange={(e) => updateField("fax", e.target.value)} placeholder="Enter the lab fax..." className={`mt-1 ${errors.fax ? "border-destructive" : ""}`} />
                <FieldError field="fax" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Settings Section */}
        <Collapsible open={openSections.settings} onOpenChange={() => toggleSection("settings")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full bg-section-header px-4 py-3 rounded">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm uppercase tracking-wide">Settings</span>
            </div>
            <ChevronUp className={`h-4 w-4 transition-transform ${openSections.settings ? "" : "rotate-180"}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Webhook URL</Label>
                <Input value={formData.webhookUrl} onChange={(e) => updateField("webhookUrl", e.target.value)} placeholder="Enter webhook URL..." className={`mt-1 ${errors.webhookUrl ? "border-destructive" : ""}`} />
                <FieldError field="webhookUrl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <Label className="text-sm font-medium">Sandbox Test Limit (No of API Calls)</Label>
                <Input value={formData.sandboxTestLimit} onChange={(e) => updateField("sandboxTestLimit", e.target.value)} placeholder="Enter sandbox test limit..." type="number" className={`mt-1 ${errors.sandboxTestLimit ? "border-destructive" : ""}`} />
                <FieldError field="sandboxTestLimit" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Sandbox</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={`relative inline-flex h-8 min-w-[100px] cursor-pointer items-center rounded-full border transition-colors ${
                      formData.applicationEnvironment === "live" ? "bg-primary border-primary" : "bg-muted border-border"
                    }`}
                    onClick={() => updateField("applicationEnvironment", formData.applicationEnvironment === "sandbox" ? "live" : "sandbox")}
                  >
                    <span className={`absolute h-6 w-6 rounded-full bg-background shadow-sm transition-all duration-200 ${formData.applicationEnvironment === "live" ? "left-[calc(100%-28px)]" : "left-1"}`} />
                    <span className={`w-full text-center text-xs font-medium transition-colors ${formData.applicationEnvironment === "live" ? "text-primary-foreground pr-6 pl-2" : "text-muted-foreground pl-6 pr-2"}`}>
                      {formData.applicationEnvironment === "live" ? "Enabled" : "Disabled"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Services & Panels */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-semibold text-foreground mb-1 block">Services & Panels</Label>
              <p className="text-xs text-muted-foreground mb-3">Select one or more services, then choose the panels available for each. Auto-release reports can be enabled per panel.</p>
              <div className="space-y-3">
                {Object.entries(SERVICE_PANELS).map(([service, panels]) => (
                  <ServicePanelItem
                    key={service}
                    service={service}
                    panels={panels}
                    selectedPanels={formData.servicePanels[service]}
                    panelAutoRelease={formData.panelAutoRelease}
                    resultFiles={formData.resultFiles}
                    onToggleResultFile={(file, checked) => {
                      updateField(
                        "resultFiles",
                        checked
                          ? [...formData.resultFiles, file]
                          : formData.resultFiles.filter((f) => f !== file)
                      );
                    }}
                    onToggleService={(checked) => {
                      const nextPanels = { ...formData.servicePanels };
                      const nextAuto = { ...formData.panelAutoRelease };
                      if (checked) {
                        nextPanels[service] = [];
                      } else {
                        delete nextPanels[service];
                        panels.forEach((p) => delete nextAuto[`${service}::${p}`]);
                        if (service === "PGx") {
                          updateField("resultFiles", []);
                        }
                      }
                      updateField("servicePanels", nextPanels);
                      updateField("panelAutoRelease", nextAuto);
                    }}
                    onTogglePanel={(panel, checked) => {
                      const current = formData.servicePanels[service] || [];
                      const nextPanels = checked
                        ? [...current, panel]
                        : current.filter((p) => p !== panel);
                      updateField("servicePanels", { ...formData.servicePanels, [service]: nextPanels });
                      if (!checked) {
                        const nextAuto = { ...formData.panelAutoRelease };
                        delete nextAuto[`${service}::${panel}`];
                        updateField("panelAutoRelease", nextAuto);
                      }
                    }}
                    onTogglePanelAutoRelease={(panel, checked) => {
                      updateField("panelAutoRelease", {
                        ...formData.panelAutoRelease,
                        [`${service}::${panel}`]: checked,
                      });
                    }}
                  />
                ))}
              </div>

            </div>


            {editingBusiness && (
              <div className="pt-4 border-t">
                <Label className="text-sm font-semibold text-foreground mb-1 block">Production Keys</Label>
                <p className="text-xs text-muted-foreground mb-3">Secure Access Credentials for Production Environment</p>
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <Label className="text-sm font-medium">App Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={productionAppKey} readOnly className="bg-muted" />
                      <Button type="button" variant="outline" size="icon" onClick={() => handleCopyKey(productionAppKey)} className="shrink-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Secret Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={productionSecretKey} readOnly className="bg-muted flex-1" />
                      <Button type="button" variant="outline" size="icon" onClick={() => handleCopyKey(productionSecretKey)} className="shrink-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleRegenerateClick("productionSecret")} className="gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sandbox Keys - Only show in Edit mode, disabled when Sandbox is disabled */}
            {editingBusiness && (
              <div className={`pt-4 border-t ${sandboxEnabled ? "" : "opacity-50"}`}>
                <Label className="text-sm font-semibold text-foreground mb-1 block">Sandbox Keys</Label>
                <p className="text-xs text-muted-foreground mb-3">Secure Access Credentials for Sandbox Environment{!sandboxEnabled ? " — available only when the Sandbox is enabled." : ""}</p>
                {!sandboxEnabled && <p className="text-xs text-muted-foreground/70 italic mb-3">Enable the Sandbox to manage these keys.</p>}
                <div className={`grid grid-cols-3 gap-4 items-end ${sandboxEnabled ? "" : "pointer-events-none select-none"}`}>
                  <div>
                    <Label className="text-sm font-medium">App Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={sandboxAppKey} readOnly disabled={!sandboxEnabled} className="bg-muted" />
                      <Button type="button" variant="outline" size="icon" disabled={!sandboxEnabled} onClick={() => handleCopyKey(sandboxAppKey)} className="shrink-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Secret Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={sandboxSecretKey} readOnly disabled={!sandboxEnabled} className="bg-muted flex-1" />
                      <Button type="button" variant="outline" size="icon" disabled={!sandboxEnabled} onClick={() => handleCopyKey(sandboxSecretKey)} className="shrink-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" disabled={!sandboxEnabled} onClick={() => handleRegenerateClick("sandboxSecret")} className="gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          {editingBusiness ? (
            <Button variant="destructive" className="px-6">Deactivate</Button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel} className="px-6">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">Submit</Button>
          </div>
        </div>
      </div>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{regenerateDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{regenerateDialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateConfirm}>Regenerate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface ServicePanelItemProps {
  service: string;
  panels: string[];
  selectedPanels: string[] | undefined;
  panelAutoRelease: Record<string, boolean>;
  resultFiles: string[];
  onToggleResultFile: (file: string, checked: boolean) => void;
  onToggleService: (checked: boolean) => void;
  onTogglePanel: (panel: string, checked: boolean) => void;
  onTogglePanelAutoRelease: (panel: string, checked: boolean) => void;
}

const ServicePanelItem = ({
  service,
  panels,
  selectedPanels,
  panelAutoRelease,
  resultFiles,
  onToggleResultFile,
  onToggleService,
  onTogglePanel,
  onTogglePanelAutoRelease,
}: ServicePanelItemProps) => {
  const [search, setSearch] = useState("");
  const isServiceSelected = selectedPanels !== undefined;
  const filteredPanels = panels.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="border border-border rounded-md p-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`service-${service}`}
          checked={isServiceSelected}
          onCheckedChange={(c) => onToggleService(Boolean(c))}
        />
        <Label htmlFor={`service-${service}`} className="text-sm font-medium cursor-pointer">
          {service}
        </Label>
      </div>
      {isServiceSelected && (
        <div className="mt-3 ml-6 space-y-2">
          {service === "PGx" && (
            <div className="mb-4 bg-secondary/60 border border-border rounded-md p-3">
              <Label className="text-xs font-semibold text-foreground block mb-1">Result Files</Label>
              <p className="text-[11px] text-muted-foreground mb-2">Please select one more result file that needs to be mapped to this business.</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {["CNV", "SNP", "SLC6A4", "VCF"].map((file) => (
                  <label key={file} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={resultFiles.includes(file)}
                      onCheckedChange={(c) => onToggleResultFile(file, Boolean(c))}
                    />
                    <span className="text-xs text-foreground">{file}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search panels..."
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
            {filteredPanels.length === 0 ? (
              <p className="text-xs text-muted-foreground col-span-2">No panels found.</p>
            ) : (
              filteredPanels.map((panel) => {
                const checked = (selectedPanels || []).includes(panel);
                const autoKey = `${service}::${panel}`;
                const auto = !!panelAutoRelease[autoKey];
                return (
                  <div key={panel} className="flex items-center justify-between gap-3 pr-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Checkbox
                        id={`panel-${service}-${panel}`}
                        checked={checked}
                        onCheckedChange={(c) => onTogglePanel(panel, Boolean(c))}
                      />
                      <Label
                        htmlFor={`panel-${service}-${panel}`}
                        className="text-xs font-normal cursor-pointer truncate"
                      >
                        {panel}
                      </Label>
                    </div>
                    {checked && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-muted-foreground">Auto Release</span>
                        <button
                          type="button"
                          className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full border transition-colors ${
                            auto ? "bg-primary border-primary" : "bg-muted border-border"
                          }`}
                          onClick={() => onTogglePanelAutoRelease(panel, !auto)}
                          aria-label="Toggle auto release reports"
                        >
                          <span
                            className={`absolute h-3.5 w-3.5 rounded-full bg-background shadow-sm transition-all duration-200 ${
                              auto ? "left-[calc(100%-16px)]" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessForm;

