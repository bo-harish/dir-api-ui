import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSpecimenContext } from "@/context/SpecimenContext";
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
import { Download, Printer, Pencil, ChevronDown, ChevronUp, User, ArrowLeft } from "lucide-react";
import LabHeader from "@/components/LabHeader";

const SpecimenDetail = () => {
  const { specimenId } = useParams();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(true);
  const { getSpecimenById } = useSpecimenContext();

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
        {/* Back + Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate("/lab-user")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <nav className="text-sm text-muted-foreground">
          <span
            className="text-link cursor-pointer hover:underline"
            onClick={() => navigate("/lab-user")}
          >
            Specimens
          </span>
          <span className="mx-1">›</span>
          <span className="text-link cursor-pointer hover:underline" onClick={() => navigate("/lab-user")}>
            PGx
          </span>
          <span className="mx-1">›</span>
          <span className="text-foreground font-medium">{specimen.specimenId}</span>
          </nav>
        </div>

        {/* Title & Actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">
            PGx {specimen.specimenId}
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Download className="h-3.5 w-3.5" />
              Download Report
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              size="sm"
              className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              onClick={() => navigate(`/lab-user/specimen/${specimen.id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </div>

        {/* Patient Info Banner */}
        <div className="bg-primary/10 rounded-md px-5 py-3 flex items-center gap-6 mb-4">
          <User className="h-5 w-5 text-primary" />
          <div className="flex items-center gap-6 text-sm">
            <span>
              <span className="text-muted-foreground">Patient First Name: </span>
              <span className="font-semibold text-foreground">{specimen.patientFirstName}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Patient Last Name: </span>
              <span className="font-semibold text-foreground">{specimen.patientLastName}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Date of Birth: </span>
              <span className="font-semibold text-foreground">{specimen.dateOfBirth}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Report Date: </span>
              <span className="font-semibold text-foreground">{specimen.reported || "—"}</span>
            </span>
          </div>
        </div>

        {/* Expandable Details */}
        <div className="border border-border rounded-md mb-8">
          <div className="flex items-center justify-end px-5 py-2">
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
            >
              {showMore ? "Show Less" : "Show More"}
              {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showMore && (
            <div className="px-5 pb-4 grid grid-cols-3 gap-y-3 gap-x-10 text-sm">
              <DetailRow label="Gender:" value={specimen.gender} />
              <DetailRow label="Ordered Date:" value={`${specimen.collected}, 8:04 AM`} />
              <DetailRow label="Provider NPI:" value={specimen.providerNPI} />

              <DetailRow label="Patient ID:" value="810" />
              <DetailRow label="Collected Date:" value={`${specimen.collected}, 8:00 AM`} />
              <DetailRow label="Facility Name:" value={specimen.facility} />

              <DetailRow label="Script Type:" value="PGx" />
              <DetailRow label="Received Date:" value={`${specimen.received}, 8:16 AM`} />
              <DetailRow label="Location:" value="Pathology Wing, 1 Street Lane, City D" />

              <DetailRow label="Collection Method:" value={specimen.collectionMethodLabel} />
              <DetailRow label="Last Updated:" value={specimen.lastUpdated || "—"} />
              <DetailRow label="Specimen ID:" value={specimen.specimenId} />

              <DetailRow label="Patient First Name:" value={specimen.patientFirstName} />
              <DetailRow label="Patient Last Name:" value={specimen.patientLastName} />
              <DetailRow label="DOB:" value={specimen.dateOfBirth} />

              <DetailRow label="MRN:" value={specimen.mrn} />
              <DetailRow label="Collection Method Code:" value={specimen.collectionMethodCode} />
              <DetailRow label="Provider Title:" value={specimen.providerTitle} />

              <DetailRow label="Provider Full Name:" value={specimen.provider} />
              <DetailRow label="Facility Address:" value={specimen.facilityAddress} />
              <DetailRow label="Current Medications List:" value={specimen.currentMedicationsList || "—"} />

              <DetailRow label="Current Medications Model Name:" value={specimen.currentMedicationsModelName || "—"} />
              <DetailRow label="Current Medications Reason:" value={specimen.currentMedicationsReason || "—"} />
              <DetailRow label="Current Medications Comments:" value={specimen.currentMedicationsComments || "—"} />
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
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-muted-foreground"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="results" className="mt-6">
            <div className="border border-border rounded-md overflow-hidden">
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
                    <TableCell className="text-sm text-primary font-medium">1 At-Risk Medications</TableCell>
                    <TableCell className="text-sm text-primary font-medium">Released</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-4"
                        onClick={() => navigate(`/lab-user/specimen/${specimenId}/report`)}
                      >
                        View
                      </Button>
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
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground text-right">{value}</span>
  </div>
);

export default SpecimenDetail;
