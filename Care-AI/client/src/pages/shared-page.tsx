import { useShares } from "@/hooks/use-shares";
import { useUser } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, User } from "lucide-react";

export default function SharedPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const isAuthenticated = !!user && !userLoading;
  
  const { data: shares, isLoading } = useShares(isAuthenticated);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-display">Shared With Me</h1>
        <p className="text-muted-foreground mt-1">Medical reports shared by other users.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : shares?.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p>No reports have been shared with you yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shares?.map((share) => (
            <Card key={share.id} className="hover:border-primary/50 transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2 bg-primary/10 w-fit px-2 py-1 rounded-full">
                    <User className="w-3 h-3" />
                    <span>User #{share.sharedByUserId}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(share.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <CardTitle className="line-clamp-1">{share.report.title}</CardTitle>
                <CardDescription>
                  {share.report.type} • {format(new Date(share.report.reportDate), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {share.report.summary && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    "{share.report.summary}"
                  </p>
                )}
                <Button 
                  className="w-full gap-2" 
                  variant="secondary"
                  onClick={() => window.open(share.report.filePath, '_blank')}
                >
                  <Eye className="w-4 h-4" />
                  View Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
