import { createContext, useContext, useState, ReactNode } from "react";
import { Business, BusinessFormData } from "@/types/business";
import { mockBusinesses } from "@/data/mockBusinesses";
import { toast } from "sonner";

interface BusinessContextType {
  businesses: Business[];
  addBusiness: (data: BusinessFormData) => void;
  updateBusiness: (id: string, data: BusinessFormData) => void;
  getBusinessById: (id: string) => Business | undefined;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export const useBusinessContext = () => {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusinessContext must be used within BusinessProvider");
  return ctx;
};

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const [businesses, setBusinesses] = useState<Business[]>(mockBusinesses);

  const addBusiness = (data: BusinessFormData) => {
    const newBusiness: Business = {
      id: String(Date.now()),
      name: data.businessName,
      executiveName: data.executiveName,
      address: `${data.address}, ${data.city}, ${data.state}`,
      createdOn: new Date().toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      phone: data.phone,
      email: data.accountContactEmail,
    };
    setBusinesses((prev) => [...prev, newBusiness]);
    toast.success("Business added successfully!");
  };

  const updateBusiness = (id: string, data: BusinessFormData) => {
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              name: data.businessName,
              executiveName: data.executiveName,
              address: `${data.address}, ${data.city}, ${data.state}`,
              phone: data.phone,
              email: data.accountContactEmail,
            }
          : b
      )
    );
    toast.success("Business updated successfully!");
  };

  const getBusinessById = (id: string) => businesses.find((b) => b.id === id);

  return (
    <BusinessContext.Provider value={{ businesses, addBusiness, updateBusiness, getBusinessById }}>
      {children}
    </BusinessContext.Provider>
  );
};
