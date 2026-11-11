import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSpecimenContext } from "@/context/SpecimenContext";
import { Specimen } from "@/data/mockSpecimens";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Printer, Pencil, ChevronDown, ChevronUp, User, ArrowLeft, FileText, Send, RefreshCw, Eye } from "lucide-react";
import LabHeader from "@/components/LabHeader";
import { toast } from "sonner";

const getDisplayStatus = (status: string, hasView: boolean) => {
  const s = status?.toLowerCase()?.trim();
  if (s === "pending regenerate" || s === "pending-regenerate") return "Pending Regenerate";
  if (s === "failed") return "Failed";
  if (s === "processing") return "Processing";
  if (s === "pending") return "Pending";
  if (s === "awaiting release" || s === "awaiting-release" || s === "pending release" || s === "pending-release") return "Awaiting Release";
  if (hasView || s === "released") return "Released";
  if (s === "new") return "Pending";
  return "Pending";
};

const formatFacilityAddress = (specimen: Specimen) => {
  const line1 = specimen.facilityAddressLine1?.trim();
  const line2 =
    specimen.facilityAddressLine2 && specimen.facilityAddressLine2.trim() !== "—"
      ? specimen.facilityAddressLine2.trim()
      : null;
  const city = specimen.facilityCity?.trim();
  const state = specimen.facilityState?.trim();
  const zip = specimen.facilityZip?.trim();
  const country = specimen.facilityCountry?.trim();

  const stateZip = [state, zip].filter(Boolean).join(" ");
  const parts = [line1, line2, city, stateZip, country].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(", ");
  }
  return specimen.facilityAddress || "—";
};

const SpecimenDetail = () => {
  const { specimenId } = useParams();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(true);
  const { getSpecimenById, updateSpecimen } = useSpecimenContext();

  const specimen = specimenId ? getSpecimenById(specimenId) : undefined;

  if (!specimen) {
    return (
      <div className="min-h-screen bg-background">
        <LabHeader />
        <div className="p-6">
          <p className="text-muted-foreground">Specimen not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/lab-user")}>
            Back to Specimens
          </Button>
        </div>
      </div>
    );
  }

  const displayStatus = getDisplayStatus(specimen.status, specimen.hasView);
  const isProcessing = displayStatus === "Processing";
  const isAwaitingRelease = displayStatus === "Awaiting Release";
  const isReleased = displayStatus === "Released";
  const isPendingRegenerate = displayStatus === "Pending Regenerate";

  const lastName = specimen.patientLastName?.trim();
  const firstName = specimen.patientFirstName?.trim();
  const fullName = lastName && firstName ? `${lastName}, ${firstName}` : lastName || firstName || "—";

  const handleGenerateReport = () => {
    toast.info(`Generating report for ${specimen.specimenId}...`);
    setTimeout(() => {
      updateSpecimen(specimen.id, {
        status: "Awaiting Release",
        hasDownload: true,
        hasView: false,
        reported: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      });
      toast.success(`Report generated successfully for ${specimen.specimenId}!`);
    }, 800);
  };

  const handleReleaseReport = () => {
    updateSpecimen(specimen.id, {
      status: "Released",
      hasView: true,
      hasDownload: true,
      reported: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
    });
    toast.success(`Report for specimen ${specimen.specimenId} has been released!`);
  };

  const handleRegenerateReport = () => {
    toast.info(`Regenerating report for ${specimen.specimenId}...`);
    setTimeout(() => {
      updateSpecimen(specimen.id, {
        status: "Awaiting Release",
        hasDownload: true,
        hasView: false,
        reported: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      });
      toast.success(`Report regenerated successfully for ${specimen.specimenId}!`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <LabHeader />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Back + Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigate("/lab-user")}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-white transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <nav className="text-sm text-muted-foreground flex items-center">
            <span
              className="text-link cursor-pointer hover:underline"
              onClick={() => navigate("/lab-user")}
            >
              Specimens
            </span>
            <span className="mx-1">›</span>
            <span className="text-link cursor-pointer hover:underline" onClick={() => navigate("/lab-user")}>
              {specimen.panelName || "PGx"}
            </span>
            <span className="mx-1">›</span>
            <span className="text-foreground font-medium">{specimen.specimenId}</span>
          </nav>
        </div>

        {/* Title & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {specimen.panelName ? `${specimen.panelName} · ${specimen.specimenId}` : `Specimen ${specimen.specimenId}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              LC ID: <span className="font-medium text-foreground">{specimen.lcId || "—"}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {isProcessing && (
              <Button
                size="sm"
                className="h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                onClick={handleGenerateReport}
              >
                <FileText className="h-3.5 w-3.5" />
                Generate report
              </Button>
            )}
            {isAwaitingRelease && (
              <Button
                size="sm"
                className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                onClick={handleReleaseReport}
              >
                <Send className="h-3.5 w-3.5" />
                Release report
              </Button>
            )}
            {isPendingRegenerate && (
              <Button
                size="sm"
                className="h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                onClick={handleRegenerateReport}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate report
              </Button>
            )}
            {isReleased && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 cursor-pointer"
                  onClick={() => navigate(`/lab-user/specimen/${specimen.id}/report`)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 cursor-pointer"
                  onClick={() => toast.success("Downloading PDF report...")}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 cursor-pointer"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              onClick={() => navigate(`/lab-user/specimen/${specimen.id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </div>

        {/* Patient Info Banner */}
        <div className="bg-primary/10 rounded-lg px-5 py-3 flex items-center justify-between mb-5 flex-wrap gap-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary shrink-0" />
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <span>
                <span className="text-muted-foreground">Patient Name: </span>
                <span className="font-semibold text-foreground">{fullName}</span>
              </span>
              <span>
                <span className="text-muted-foreground">DOB: </span>
                <span className="font-semibold text-foreground">{specimen.dateOfBirth || "—"}</span>
              </span>
              <span>
                <span className="text-muted-foreground">LC ID: </span>
                <span className="font-semibold text-foreground">{specimen.lcId || "—"}</span>
              </span>
              <span>
                <span className="text-muted-foreground">Reported: </span>
                <span className="font-semibold text-foreground">{specimen.reported || "—"}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                displayStatus === "Released"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : displayStatus === "Awaiting Release"
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                  : displayStatus === "Processing"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  : displayStatus === "Pending"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : displayStatus === "Pending Regenerate"
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {displayStatus}
            </span>
          </div>
        </div>

        {/* Grid Fields Details (Strictly from Lab-User Grid) */}
        <div className="border border-border rounded-lg mb-8 bg-card shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
            <h2 className="text-sm font-semibold text-foreground">Specimen & Patient Details</h2>
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-sm text-primary font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              {showMore ? "Show Less" : "Show More"}
              {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showMore && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-3.5 text-sm">
              {/* Column 1: Identification & Workflow */}
              <div className="space-y-3.5">
                <DetailRow label="LC ID:" value={specimen.lcId || "—"} />
                <DetailRow label="Specimen ID:" value={specimen.specimenId} />
                <DetailRow label="Report Status:" value={displayStatus} />
                <DetailRow label="Panel Name:" value={specimen.panelName || "Comprehensive PGx Panel"} />
                <DetailRow label="Report Title:" value={specimen.reportTitle || "Pharmacogenomics Report"} />
                <DetailRow label="Batch Number:" value={specimen.batchNumber || "—"} />
                <DetailRow label="Last Updated:" value={specimen.lastUpdated || "—"} />
              </div>

              {/* Column 2: Patient & Timeline */}
              <div className="space-y-3.5">
                <DetailRow label="Patient Name:" value={fullName} />
                <DetailRow label="DOB:" value={specimen.dateOfBirth || "—"} />
                <DetailRow label="Gender:" value={specimen.gender || "—"} />
                <DetailRow label="MRN:" value={specimen.mrn || "—"} />
                <DetailRow label="Collected:" value={specimen.collected || "—"} />
                <DetailRow label="Received:" value={specimen.received || "—"} />
                <DetailRow label="Reported:" value={specimen.reported || "—"} />
              </div>

              {/* Column 3: Facility, Provider & Method */}
              <div className="space-y-3.5">
                <DetailRow label="Facility:" value={specimen.facility || "—"} />
                <DetailRow label="Facility Address:" value={formatFacilityAddress(specimen)} />
                <DetailRow label="Provider:" value={specimen.provider || "—"} />
                <DetailRow label="Provider Title:" value={specimen.providerTitle || "—"} />
                <DetailRow label="Provider NPI:" value={specimen.providerNPI || "—"} />
                <DetailRow label="Provider Location:" value={specimen.facilityAddress || "—"} />
                <DetailRow label="Provider State:" value={specimen.providerState || "—"} />
                <DetailRow label="Collection Method Code:" value={specimen.collectionMethodCode || "—"} />
                <DetailRow label="Collection Method Label:" value={specimen.collectionMethodLabel || "—"} />
                <DetailRow label="Current Medications List:" value={specimen.currentMedicationsList || "—"} />
                <DetailRow label="Current Medications Model Name:" value={specimen.currentMedicationsModelName || "—"} />
                <DetailRow label="Current Medications Reason:" value={specimen.currentMedicationsReason || "—"} />
                <DetailRow label="Current Medications Comments:" value={specimen.currentMedicationsComments || "—"} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="results">
          <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-0">
            {["Results", "Ordered Panels", "Diagnosis Codes", "Internal Notes", "Provider Notes", "History"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase().replace(/\s+/g, "-")}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="results" className="mt-6">
            <div className="border border-border rounded-md overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header">
                    <TableHead className="text-xs font-semibold">Report Summary</TableHead>
                    <TableHead className="text-xs font-semibold">Report Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-sm text-foreground font-medium">
                      {specimen.panelName || "Comprehensive PGx Panel"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <span
                        className={
                          displayStatus === "Released"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : displayStatus === "Awaiting Release"
                            ? "text-sky-600 dark:text-sky-400"
                            : displayStatus === "Processing"
                            ? "text-blue-600 dark:text-blue-400"
                            : displayStatus === "Pending"
                            ? "text-amber-600 dark:text-amber-400"
                            : displayStatus === "Pending Regenerate"
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-destructive"
                        }
                      >
                        {displayStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {specimen.hasView || isReleased ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-4 cursor-pointer"
                          onClick={() => navigate(`/lab-user/specimen/${specimenId}/report`)}
                        >
                          View
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {["ordered-panels", "diagnosis-codes", "internal-notes", "provider-notes", "history"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <p className="text-sm text-muted-foreground">No data available.</p>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-muted-foreground text-xs shrink-0">{label}</span>
    <span className="font-medium text-foreground text-xs text-right break-words">{value || "—"}</span>
  </div>
);

export default SpecimenDetail;
