import React, { createContext, useContext, useState, useEffect } from "react";
import { Specimen, mockSpecimens } from "@/data/mockSpecimens";
import { toast } from "sonner";

interface SpecimenContextType {
  specimens: Specimen[];
  addSpecimen: (data: Partial<Specimen>) => Specimen;
  updateSpecimen: (id: string, data: Partial<Specimen>) => void;
  getSpecimenById: (id: string) => Specimen | undefined;
  deleteSpecimen: (id: string) => void;
  resetToDefault: () => void;
}

const STORAGE_KEY = "lab_user_specimens_data_v1";

const SpecimenContext = createContext<SpecimenContextType | null>(null);

export const useSpecimenContext = () => {
  const ctx = useContext(SpecimenContext);
  if (!ctx) {
    throw new Error("useSpecimenContext must be used within a SpecimenProvider");
  }
  return ctx;
};

export const SpecimenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [specimens, setSpecimens] = useState<Specimen[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load specimens from localStorage", e);
    }
    return mockSpecimens;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(specimens));
    } catch (e) {
      console.error("Failed to persist specimens to localStorage", e);
    }
  }, [specimens]);

  const getSpecimenById = (id: string) => {
    return specimens.find((s) => s.id === id || s.specimenId === id);
  };

  const addSpecimen = (data: Partial<Specimen>): Specimen => {
    const nextId = String(Date.now());
    const newSpecimen: Specimen = {
      id: nextId,
      lcId: data.lcId || `LC-${Math.floor(4000 + Math.random() * 900)}`,
      specimenId: data.specimenId || `SP-${Date.now().toString().slice(-6)}`,
      status: data.status || "New",
      patientFirstName: data.patientFirstName || "",
      patientLastName: data.patientLastName || "",
      dateOfBirth: data.dateOfBirth || "",
      gender: data.gender || "U",
      race: data.race || "Not Specified",
      mrn: data.mrn || `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
      collected: data.collected || new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
      received: data.received || new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
      reported: data.reported || "",
      lastUpdated: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
      facility: data.facility || "Recovery Unplugged",
      facilityAddress: data.facilityAddress || "",
      provider: data.provider || "",
      providerTitle: data.providerTitle || "Dr.",
      providerNPI: data.providerNPI || "",
      providerState: data.providerState || "NE",
      collectionMethodCode: data.collectionMethodCode || "1733104001",
      collectionMethodLabel: data.collectionMethodLabel || "Buccal swab",
      currentMedicationsList: data.currentMedicationsList || "",
      currentMedicationsModelName: data.currentMedicationsModelName || "",
      currentMedicationsReason: data.currentMedicationsReason || "",
      currentMedicationsComments: data.currentMedicationsComments || "",
      batchNumber: data.batchNumber || "",
      hasDownload: data.hasDownload ?? true,
      hasView: data.hasView ?? false,
    };

    setSpecimens((prev) => [newSpecimen, ...prev]);
    toast.success("Specimen created successfully!");
    return newSpecimen;
  };

  const updateSpecimen = (id: string, data: Partial<Specimen>) => {
    setSpecimens((prev) =>
      prev.map((s) => {
        if (s.id === id || s.specimenId === id) {
          return {
            ...s,
            ...data,
            lastUpdated: new Date().toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            }),
          };
        }
        return s;
      })
    );
    toast.success("Specimen updated successfully!");
  };

  const deleteSpecimen = (id: string) => {
    setSpecimens((prev) => prev.filter((s) => s.id !== id && s.specimenId !== id));
    toast.success("Specimen removed.");
  };

  const resetToDefault = () => {
    setSpecimens(mockSpecimens);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    toast.info("Specimens reset to default data.");
  };

  return (
    <SpecimenContext.Provider
      value={{
        specimens,
        addSpecimen,
        updateSpecimen,
        getSpecimenById,
        deleteSpecimen,
        resetToDefault,
      }}
    >
      {children}
    </SpecimenContext.Provider>
  );
};

