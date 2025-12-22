import { useVitals } from "@/hooks/use-vitals";
import { useReports } from "@/hooks/use-reports";
import { useUser } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VitalsChart } from "@/components/vitals-chart";
import { Activity, FileText, Heart, Weight, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useUser();
  const isAuthenticated = !!user && !userLoading;
  
  const { data: vitals, isLoading: loadingVitals } = useVitals({ days: 30 }, isAuthenticated);
  const { data: reports, isLoading: loadingReports } = useReports({ to: new Date().toISOString() }, isAuthenticated);

  // Group vitals by type
  const bpData = vitals?.filter(v => v.type === "Blood Pressure") || [];
  const heartRateData = vitals?.filter(v => v.type === "Heart Rate") || [];
  const weightData = vitals?.filter(v => v.type === "Weight") || [];

  // Get most recent values
  const recentBp = bpData.length > 0 ? bpData[bpData.length - 1] : null;
  const recentHr = heartRateData.length > 0 ? heartRateData[heartRateData.length - 1] : null;
  const recentWeight = weightData.length > 0 ? weightData[weightData.length - 1] : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hello, {user?.username}</h1>
          <p className="text-muted-foreground mt-1">Here's your health overview for today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/vitals">
            <Button variant="outline">Log Vitals</Button>
          </Link>
          <Link href="/reports">
            <Button>Upload Report</Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentBp?.value || "--/--"}</div>
            <p className="text-xs text-muted-foreground">
              {recentBp ? `Last measured ${format(new Date(recentBp.date), 'MMM d')}` : "No data yet"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
            <Heart className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentHr?.value || "--"} <span className="text-sm font-normal text-muted-foreground">bpm</span></div>
            <p className="text-xs text-muted-foreground">
              {recentHr ? `Last measured ${format(new Date(recentHr.date), 'MMM d')}` : "No data yet"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight</CardTitle>
            <Weight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentWeight?.value || "--"} <span className="text-sm font-normal text-muted-foreground">kg</span></div>
            <p className="text-xs text-muted-foreground">
              {recentWeight ? `Last measured ${format(new Date(recentWeight.date), 'MMM d')}` : "No data yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <VitalsChart 
          title="Blood Pressure Trends (Systolic)" 
          data={bpData} 
          dataKey="value"
          color="hsl(var(--primary))"
        />
        <VitalsChart 
          title="Heart Rate Trends" 
          data={heartRateData} 
          dataKey="value"
          color="#f43f5e" // rose-500
        />
      </div>

      {/* Recent Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent Reports</h2>
          <Link href="/reports">
            <Button variant="ghost" className="text-sm">View all</Button>
          </Link>
        </div>
        
        {reports?.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <FileText className="w-8 h-8 mb-2 opacity-50" />
              <p>No medical reports uploaded yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports?.slice(0, 3).map((report) => (
              <Card key={report.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <span>{format(new Date(report.reportDate), 'MMM d, yyyy')}</span>
                      <span>•</span>
                      <span>{report.type}</span>
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {report.summary || "No summary provided."}
                  </p>
                  <Button variant="link" className="px-0 mt-2 h-auto text-xs" onClick={() => window.open(report.filePath, '_blank')}>
                    View Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
