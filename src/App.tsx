import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { BusinessProvider } from "@/context/BusinessContext";
import { SpecimenProvider } from "@/context/SpecimenContext";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import BusinessListing from "./pages/BusinessListing";
import AddBusiness from "./pages/AddBusiness";
import EditBusiness from "./pages/EditBusiness";
import AddEditUser from "./pages/AddEditUser";
import ApiAccessDetails from "./pages/ApiAccessDetails";
import LabUserDashboard from "./pages/LabUserDashboard";
import AddEditSpecimen from "./pages/AddEditSpecimen";
import SpecimenDetail from "./pages/SpecimenDetail";
import SpecimenReport from "./pages/SpecimenReport";
import AnonymousPortal from "./pages/AnonymousPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BusinessProvider>
          <SpecimenProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/business-listing" element={<BusinessListing />} />
                <Route path="/add-business" element={<AddBusiness />} />
                <Route path="/edit-business/:businessId" element={<EditBusiness />} />
                <Route path="/edit-business/:businessId/add-user" element={<AddEditUser />} />
                <Route path="/edit-business/:businessId/edit-user/:userId" element={<AddEditUser />} />
                <Route path="/api-access-details/:businessId" element={<ApiAccessDetails />} />
              </Route>
              <Route path="/lab-user" element={<LabUserDashboard />} />
              <Route path="/lab-user/add-specimen" element={<AddEditSpecimen />} />
              <Route path="/lab-user/specimen/:specimenId" element={<SpecimenDetail />} />
              <Route path="/lab-user/specimen/:specimenId/edit" element={<AddEditSpecimen />} />
              <Route path="/lab-user/specimen/:specimenId/report" element={<SpecimenReport />} />
              <Route path="/anonymous-portal" element={<AnonymousPortal />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SpecimenProvider>
        </BusinessProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
