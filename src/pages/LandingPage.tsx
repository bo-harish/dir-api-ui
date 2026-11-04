import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import emgenexLogo from "@/assets/emgenex-logo.png";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-10">
      <img src={emgenexLogo} alt="Emgenex LIS" className="h-8" />

      <div className="flex gap-4">
        <Button
          onClick={() => navigate("/dashboard")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-sm"
        >
          Super Admin Login
        </Button>
        <Button
          variant="outline"
          className="px-8 py-6 text-sm"
          onClick={() => navigate("/lab-user")}
        >
          Lab User Login
        </Button>
        <Button
          variant="outline"
          className="px-8 py-6 text-sm"
          onClick={() => navigate("/anonymous-portal")}
        >
          Anonymous Portal
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
