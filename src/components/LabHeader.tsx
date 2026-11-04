import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import emgenexLogo from "@/assets/emgenex-logo.png";

const LabHeader = () => {
  const navigate = useNavigate();
  return (
    <div className="border-b border-border px-6 py-3 flex items-center justify-between">
      <img src={emgenexLogo} alt="Emgenex LIS" className="h-6 cursor-pointer" onClick={() => navigate("/")} />
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-foreground">Lab User</span>
      </div>
    </div>
  );
};

export default LabHeader;
