import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Download, Pencil, MousePointerClick } from "lucide-react";

const tabs = [
  { label: "Current Medications", active: true, dot: true },
  { label: "All Medications", active: false },
  { label: "Genotypes", active: false },
  { label: "Log/Drafts", active: false },
  { label: "Notes", active: false },
  { label: "Legends", active: false },
];

type MedicationStatus = "active" | "swapped" | "removed" | "added";

interface Medication {
  name: string;
  brand: string;
  dose: string;
  frequency: string;
  status: MedicationStatus;
  swappedFrom?: string;
  dotColor: string;
}

const medications: Medication[] = [
  {
    name: "Clopidogrel",
    brand: "Plavix, Iscover",
    dose: "100mg",
    frequency: "Once a day",
    status: "active",
    dotColor: "hsl(174, 42%, 41%)",
  },
  {
    name: "Atorvastatin",
    brand: "Lipitor",
    dose: "100mg",
    frequency: "Once a day",
    status: "active",
    dotColor: "hsl(38, 92%, 50%)",
  },
  {
    name: "Plavix",
    brand: "Lipitor",
    dose: "100mg",
    frequency: "Once a day",
    status: "swapped",
    swappedFrom: "Lovastatin",
    dotColor: "hsl(215, 16%, 47%)",
  },
  {
    name: "Metformin",
    brand: "Plavix, Iscover",
    dose: "100mg",
    frequency: "",
    status: "removed",
    dotColor: "hsl(0, 72%, 51%)",
  },
  {
    name: "Lisinopril",
    brand: "Plavix, Iscover",
    dose: "100mg",
    frequency: "",
    status: "added",
    dotColor: "hsl(142, 71%, 45%)",
  },
];

const StatusBadge = ({ status, swappedFrom }: { status: MedicationStatus; swappedFrom?: string }) => {
  if (status === "swapped") {
    return (
      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        Swapped from {swappedFrom}
      </span>
    );
  }
  if (status === "removed") {
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive uppercase tracking-wider">
        Removed
      </span>
    );
  }
  if (status === "added") {
    return (
      <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success uppercase tracking-wider">
        Added
      </span>
    );
  }
  return null;
};

const AnonymousPortal = () => {
  const [selectedMed, setSelectedMed] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">P</span>
            </div>
            <span className="text-base font-semibold text-foreground tracking-tight">Pro-GeneX</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground tracking-wide">
          Powered by <span className="font-semibold text-foreground">EMGENEX</span>
        </span>
      </header>

      {/* Teal divider */}
      <div className="h-0.5 bg-primary" />

      {/* Patient Info Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Robert Brown</h1>
            <p className="text-xs text-muted-foreground">01/01/1970 (32)</p>
          </div>
          <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <Pencil className="h-3 w-3" />
            Specimen Info
          </button>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Download className="h-4 w-4" />
          Download New Report
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card px-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                tab.active ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.dot && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Medication List */}
        <div className="w-80 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
          <div className="p-3">
            <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Plus className="h-4 w-4" />
              Add medication
            </button>
          </div>
          <div className="px-1.5 pb-3">
            {medications.map((med, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMed(selectedMed === idx ? null : idx)}
                className={`group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-all duration-150 ${
                  selectedMed === idx ? "bg-sidebar-accent" : "hover:bg-secondary/60"
                }`}
              >
                <span
                  className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: med.dotColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{med.name}</span>
                    <StatusBadge status={med.status} swappedFrom={med.swappedFrom} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">({med.brand})</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {med.dose}
                    {med.frequency ? `, ${med.frequency}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="flex-1 p-6">
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-4 text-center px-8"
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <MousePointerClick className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No medication selected</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                  Choose a medication from the list to view clinical insights, genetic considerations, alternative
                  options, drug interactions, and lifestyle warnings.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Disclaimer */}
      <div className="border-t border-border bg-card px-6 py-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          This medication list is generated based on available clinical data and may not reflect the most current
          prescriptions. Always verify with the patient's healthcare provider before making any clinical decisions.
        </p>
      </div>
    </div>
  );
};

export default AnonymousPortal;
