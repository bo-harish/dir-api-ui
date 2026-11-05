import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusinessForm from "@/components/BusinessForm";
import UsersTab from "@/components/UsersTab";
import { useBusinessContext } from "@/context/BusinessContext";
import { BusinessFormData } from "@/types/business";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import emgenexLogo from "@/assets/emgenex-logo.png";

const EditBusiness = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { getBusinessById, updateBusiness } = useBusinessContext();

  const business = getBusinessById(businessId || "");

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Business not found.</p>
      </div>
    );
  }

  const handleSubmit = (data: BusinessFormData) => {
    updateBusiness(business.id, data);
    navigate("/business-listing");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <img src={emgenexLogo} alt="Emgenex LIS" className="h-4" />
        </div>

        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/business-listing")}
            className="text-muted-foreground hover:bg-accent hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Edit Business</h1>
        </div>

        <Tabs defaultValue="business-details">
          <div className="border-b border-border mb-6">
            <TabsList className="bg-transparent h-auto p-0 gap-8">
              <TabsTrigger
                value="business-details"
                className="bg-transparent rounded-none border-b-2 border-transparent px-0 pb-3 pt-2 text-base font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Business Details
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="bg-transparent rounded-none border-b-2 border-transparent px-0 pb-3 pt-2 text-base font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Lab Users
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="business-details">
            <BusinessForm onSubmit={handleSubmit} editingBusiness={business} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EditBusiness;
