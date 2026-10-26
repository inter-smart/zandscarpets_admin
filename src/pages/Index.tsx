import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  FileText,
  Briefcase,
  UserCheck,
  MapPin,
} from "lucide-react";

const Index = () => {
  const location = useLocation();
  const { toast } = useToast();

  // Redirected here by ProtectedRoute when a page isn't permitted for the user's role.
  useEffect(() => {
    if ((location.state as { denied?: boolean } | null)?.denied) {
      toast({
        title: "No access",
        description: "Your role doesn't have permission to open that page.",
        variant: "destructive",
      });
      window.history.replaceState({}, "");
    }
  }, [location.state, toast]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your Z&S content.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricsCard
          title="Total Professionals"
          value="12"
          change="+2 this month"
          changeType="positive"
          icon={UserCheck}
          description="Healthcare professionals"
        />
        <MetricsCard
          title="Active Locations"
          value="8"
          change="+1 this month"
          changeType="positive"
          icon={MapPin}
          description="Service locations"
        />
        <MetricsCard
          title="Open Careers"
          value="15"
          change="+3 this week"
          changeType="positive"
          icon={Briefcase}
          description="Active job postings"
        />
        <MetricsCard
          title="Total Blog Posts"
          value="127"
          change="+12 this month"
          changeType="positive"
          icon={FileText}
          description="Published articles"
        />
        {/* <MetricsCard
          title="Total Users"
          value="89"
          change="+3 this month"
          changeType="positive"
          icon={Users}
          description="Registered users"
        /> */}
        {/* <MetricsCard
          title="Monthly Views"
          value="45.2K"
          change="+18.2% from last month"
          changeType="positive"
          icon={Eye}
          description="Page views"
        /> */}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <QuickActions />
      </div>
    </div>
  );
};

export default Index;
