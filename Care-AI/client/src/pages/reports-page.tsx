import { useState } from "react";
import { useReports, useCreateReport, useDeleteReport } from "@/hooks/use-reports";
import { useShareReport } from "@/hooks/use-shares";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Trash2, Share2, Eye, Calendar, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";

const reportSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  reportDate: z.string().min(1, "Date is required"),
  summary: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function ReportsPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const isAuthenticated = !!user && !userLoading;
  
  const [filterType, setFilterType] = useState<string>("all");
  const { data: reports, isLoading } = useReports({ type: filterType }, isAuthenticated);
  const { mutate: deleteReport } = useDeleteReport();
  const { toast } = useToast();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Medical Reports</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your medical history.</p>
        </div>
        <UploadReportDialog />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Blood Test">Blood Test</SelectItem>
            <SelectItem value="X-Ray">X-Ray</SelectItem>
            <SelectItem value="MRI">MRI</SelectItem>
            <SelectItem value="Prescription">Prescription</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Summary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading reports...</TableCell>
                </TableRow>
              ) : reports?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 opacity-20" />
                      <p>No reports found. Upload your first one!</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reports?.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium text-nowrap">
                      {format(new Date(report.reportDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {report.type}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                      {report.summary || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.open(report.filePath, '_blank')}
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <ShareReportDialog reportId={report.id} reportTitle={report.title} />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this report?")) {
                              deleteReport(report.id, {
                                onSuccess: () => toast({ title: "Deleted", description: "Report removed successfully" })
                              });
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UploadReportDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createReport, isPending } = useCreateReport();
  const { toast } = useToast();
  
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type: "Blood Test",
      reportDate: format(new Date(), 'yyyy-MM-dd'),
    }
  });
  
  const [file, setFile] = useState<File | null>(null);

  const onSubmit = (data: ReportFormValues) => {
    if (!file) {
      toast({ title: "File missing", description: "Please select a file to upload", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('type', data.type);
    formData.append('reportDate', data.reportDate);
    if (data.summary) formData.append('summary', data.summary);
    formData.append('file', file);

    createReport(formData, {
      onSuccess: () => {
        toast({ title: "Success", description: "Report uploaded successfully" });
        setOpen(false);
        form.reset();
        setFile(null);
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
          <Upload className="w-4 h-4" />
          Upload Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Medical Report</DialogTitle>
          <DialogDescription>
            Add a new test result, prescription, or scan to your records.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Annual Physical" {...form.register("title")} />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...form.register("reportDate")} />
              {form.formState.errors.reportDate && <p className="text-xs text-destructive">{form.formState.errors.reportDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Report Type</Label>
            <Select onValueChange={(val) => form.setValue("type", val)} defaultValue={form.getValues("type")}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Blood Test">Blood Test</SelectItem>
                <SelectItem value="X-Ray">X-Ray</SelectItem>
                <SelectItem value="MRI">MRI</SelectItem>
                <SelectItem value="Prescription">Prescription</SelectItem>
                <SelectItem value="Vaccination">Vaccination</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Attachment</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="file" 
                type="file" 
                className="cursor-pointer" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                accept=".pdf,.png,.jpg,.jpeg"
              />
            </div>
            <p className="text-xs text-muted-foreground">Supported formats: PDF, PNG, JPG (Max 5MB)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary (Optional)</Label>
            <Textarea 
              id="summary" 
              placeholder="Brief doctor's notes or key findings..." 
              {...form.register("summary")} 
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Uploading..." : "Save Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShareReportDialog({ reportId, reportTitle }: { reportId: number; reportTitle: string }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const { mutate: share, isPending } = useShareReport();
  const { toast } = useToast();

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    share({ reportId, sharedWithUsername: username }, {
      onSuccess: () => {
        toast({ title: "Shared", description: `Report shared with ${username}` });
        setOpen(false);
        setUsername("");
      },
      onError: (err) => {
        toast({ title: "Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Share">
          <Share2 className="w-4 h-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription>
            Share "{reportTitle}" with a doctor or family member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleShare} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username to share with</Label>
            <Input 
              id="username" 
              placeholder="Enter username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sharing..." : "Share"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
