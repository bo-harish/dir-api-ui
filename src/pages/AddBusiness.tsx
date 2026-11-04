import { useNavigate } from "react-router-dom";
import BusinessForm from "@/components/BusinessForm";
import { useBusinessContext } from "@/context/BusinessContext";
import { BusinessFormData } from "@/types/business";
import emgenexLogo from "@/assets/emgenex-logo.png";

const AddBusiness = () => {
  const navigate = useNavigate();
  const { addBusiness } = useBusinessContext();

  const handleSubmit = (data: BusinessFormData) => {
    addBusiness(data);
    navigate("/business-listing");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <img src={emgenexLogo} alt="Emgenex LIS" className="h-4" />
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Add Business</h1>
        </div>

        <div className="h-1 bg-primary w-full rounded mb-6" />

        <BusinessForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default AddBusiness;
