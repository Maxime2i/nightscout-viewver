import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Droplet, FileText } from "lucide-react";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" /> Add Glucose Reading
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Droplet className="h-4 w-4" /> Log Insulin Dose
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <FileText className="h-4 w-4" /> Add Note
        </Button>
      </CardContent>
    </Card>
  );
} 