import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
}

export function ShareLinks() {
  const url = localStorage.getItem("nightscoutUrl");
  const token = localStorage.getItem("nightscoutToken");
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?nightscoutUrl=${url}&nightscoutToken=${token}`;

  return (
    <Card className={cn("p-4")}>
      <CardHeader>
        <CardTitle>Partagez votre tableau de bord</CardTitle>
      </CardHeader>
      <CardContent className="flex row">
        <Input
          type="text"
          value={shareUrl}
          className="form-input block w-full border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          disabled
        />
        <Button
          onClick={() => navigator.clipboard.writeText(shareUrl)}
          className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Copier le lien
        </Button>
      </CardContent>
    </Card>
  );
}
