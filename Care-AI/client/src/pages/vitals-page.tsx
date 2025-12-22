import { useState } from "react";
import { useVitals, useCreateVital } from "@/hooks/use-vitals";
import { useUser } from "@/hooks/use-auth";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VitalsChart } from "@/components/vitals-chart";

// Schema for manual input
const vitalSchema = z.object({
  type: z.string().min(1, "Type is required"),
  value: z.string().min(1, "Value is required"),
  unit: z.string().min(1, "Unit is required"),
  date: z.string().min(1, "Date is required"),
});

type VitalFormValues = z.infer<typeof vitalSchema>;

// Helpers to auto-fill unit based on type
const getUnitForType = (type: string) => {
  switch (type) {
    case "Blood Pressure": return "mmHg";
    case "Blood Sugar": return "mg/dL";
    case "Heart Rate": return "bpm";
    case "Weight": return "kg";
    case "Temperature": return "°C";
    default: return "";
  }
};

export default function VitalsPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const isAuthenticated = !!user && !userLoading;
  
  const { data: vitals, isLoading } = useVitals({ days: 30 }, isAuthenticated);
  const bpData = vitals?.filter(v => v.type === "Blood Pressure") || [];
  const sugarData = vitals?.filter(v => v.type === "Blood Sugar") || [];
  const hrData = vitals?.filter(v => v.type === "Heart Rate") || [];
  const weightData = vitals?.filter(v => v.type === "Weight") || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Vitals Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor your key health indicators over time.</p>
        </div>
        <LogVitalDialog />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <VitalsChart 
          title="Blood Pressure" 
          data={bpData} 
          dataKey="value"
          color="hsl(var(--primary))"
        />
        <VitalsChart 
          title="Heart Rate" 
          data={hrData} 
          dataKey="value"
          color="#f43f5e" 
        />
        <VitalsChart 
          title="Weight" 
          data={weightData} 
          dataKey="value"
          color="#3b82f6" 
        />
        <VitalsChart 
          title="Blood Sugar" 
          data={sugarData} 
          dataKey="value"
          color="#a855f7" 
        />
      </div>

      {/* History Table */}
      <Card className="shadow-sm mt-8">
        <CardHeader>
          <CardTitle>History Log</CardTitle>
          <CardDescription>All your recorded vital signs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading history...</p>
            ) : vitals?.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No records found.</p>
            ) : (
              <div className="border rounded-md divide-y">
                {vitals?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((vital) => (
                  <div key={vital.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{vital.type}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(vital.date), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{vital.value}</p>
                      <p className="text-xs text-muted-foreground">{vital.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LogVitalDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createVital, isPending } = useCreateVital();
  const { toast } = useToast();

  const form = useForm<VitalFormValues>({
    resolver: zodResolver(vitalSchema),
    defaultValues: {
      type: "Blood Pressure",
      unit: "mmHg",
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    }
  });

  const watchType = form.watch("type");

  // Update unit when type changes
  const handleTypeChange = (val: string) => {
    form.setValue("type", val);
    form.setValue("unit", getUnitForType(val));
  };

  const onSubmit = (data: VitalFormValues) => {
    // Need to convert date string to Date object
    const payload = {
      ...data,
      date: new Date(data.date), // schema expects Date object
    };

    createVital(payload, {
      onSuccess: () => {
        toast({ title: "Logged", description: "Vital sign recorded successfully." });
        setOpen(false);
        form.reset({
          type: "Blood Pressure",
          unit: "mmHg",
          date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          value: ""
        });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg hover:shadow-primary/25 transition-all">
          <Plus className="w-4 h-4" />
          Log Vitals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Vital Sign</DialogTitle>
          <DialogDescription>
            Record a new health measurement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select onValueChange={handleTypeChange} defaultValue={watchType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Blood Pressure">Blood Pressure</SelectItem>
                <SelectItem value="Heart Rate">Heart Rate</SelectItem>
                <SelectItem value="Blood Sugar">Blood Sugar</SelectItem>
                <SelectItem value="Weight">Weight</SelectItem>
                <SelectItem value="Temperature">Temperature</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input 
                id="value" 
                placeholder={watchType === "Blood Pressure" ? "120/80" : "0"} 
                {...form.register("value")} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" {...form.register("unit")} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date & Time</Label>
            <Input id="date" type="datetime-local" {...form.register("date")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
