import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSpecimenContext } from "@/context/SpecimenContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, ExternalLink, Pencil, Trash2, RefreshCw, ChevronDown, ArrowLeft, FileText } from "lucide-react";
import LabHeader from "@/components/LabHeader";
import { toast } from "sonner";

const mockMedications = [
  {
    id: "1",
    name: "Lovastatin",
    dosage: "10 mg/l",
    geneticInteraction: "Poor Function",
    hasInteractions: true,
    interactionCount: 1,
    risk: "high",
  },
  {
    id: "2",
    name: "Pitavastatin",
    dosage: "",
    geneticInteraction: "Poor Function",
    hasInteractions: true,
    interactionCount: 1,
    risk: "high",
  },
  {
    id: "3",
    name: "Codeine",
    dosage: "15 mg/l",
    geneticInteraction: "Normal Metabolizer",
    hasInteractions: false,
    interactionCount: 0,
    risk: "low",
  },
];

const SpecimenReport = () => {
  const { specimenId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("current-medications");
  const { getSpecimenById, updateSpecimen } = useSpecimenContext();

  const specimen = specimenId ? getSpecimenById(specimenId) : undefined;

  if (!specimen) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-muted-foreground">Specimen not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LabHeader />

      <div className="p-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/lab-user')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-white transition-colors cursor-pointer mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {/* Title & Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{specimen.patientLastName}</h1>
            <span className="text-sm text-muted-foreground">
              {specimen.dateOfBirth} ({new Date().getFullYear() - parseInt(specimen.dateOfBirth.split("/")[2])})
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-primary text-sm font-medium flex items-center gap-1.5 hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />
              Release Report
            </button>
            {specimen.status?.toLowerCase() === "pending" ? (
              <button
                onClick={() => {
                  toast.info(`Generating report for ${specimen.specimenId}...`);
                  setTimeout(() => {
                    updateSpecimen(specimen.id, {
                      status: "New",
                      hasDownload: true,
                      hasView: true,
                      reported: new Date().toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      }),
                    });
                    toast.success(`Report generated successfully for ${specimen.specimenId}!`);
                  }, 800);
                }}
                className="text-primary text-sm font-medium flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                Generate report
              </button>
            ) : (
              <button className="text-primary text-sm font-medium flex items-center gap-1.5 hover:underline">
                <Download className="h-3.5 w-3.5" />
                Download Recent Report
              </button>
            )}
          </div>
        </div>

        {/* Report Info */}
        <div className="flex items-center gap-8 text-sm mb-8">
          <span>
            <span className="text-muted-foreground">Report Code: </span>
            <span className="font-semibold text-foreground">M3I 3J7</span>
          </span>
          <span>
            <span className="text-muted-foreground">Reported: </span>
            <span className="font-semibold text-foreground">{specimen.reported || "—"}, 7:18 AM</span>
          </span>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-0">
            {[
              { label: "Current Medications", value: "current-medications", hasDot: true },
              { label: "All Medications", value: "all-medications" },
              { label: "Genotypes", value: "genotypes" },
              { label: "Log/Drafts", value: "log-drafts" },
              { label: "Notes", value: "notes" },
              { label: "Legends", value: "legends" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-muted-foreground flex items-center gap-1.5"
              >
                {tab.label}
                {tab.hasDot && (
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="current-medications" className="mt-6">
            {/* Add medication input & Disclaimer */}
            <div className="flex items-center justify-between mb-4">
              <div className="border border-border rounded-md px-4 py-2 text-sm text-muted-foreground w-96">
                + Add another medication
              </div>
              <button className="text-primary text-sm font-medium hover:underline">
                Disclaimer
              </button>
            </div>

            {/* Medications Table */}
            <div className="border border-border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider w-8"></TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Drug Name</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Dosage</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Genetic Interactions</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider"></TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider"></TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMedications.map((med) => (
                    <TableRow key={med.id} className="hover:bg-muted/50">
                      <TableCell>
                        <span
                          className={`h-2.5 w-2.5 rounded-full inline-block ${
                            med.risk === "high" ? "bg-destructive" : "bg-primary"
                          }`}
                        />
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">{med.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {med.dosage && (
                          <span className="flex items-center gap-1">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                            {med.dosage}
                          </span>
                        )}
                        {!med.dosage && <Pencil className="h-3 w-3 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{med.geneticInteraction}</TableCell>
                      <TableCell>
                        {med.hasInteractions && (
                          <span className="text-destructive text-sm font-medium flex items-center gap-1">
                            ⚠ Interactions
                            <span className="bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {med.interactionCount}
                            </span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <button className="flex items-center gap-1 hover:text-foreground">
                            <RefreshCw className="h-3.5 w-3.5" /> Swap
                          </button>
                          <button className="flex items-center gap-1 hover:text-foreground">
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {["all-medications", "genotypes", "log-drafts", "notes", "legends"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <p className="text-sm text-muted-foreground">No data available.</p>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default SpecimenReport;
