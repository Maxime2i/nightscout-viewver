import { useState } from "react";
import { Bell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import i18n from "../../i18n";

export function Header({ date, setDate, onOpenPdfModal }: { date: DateRange | undefined, setDate: (date: DateRange | undefined) => void, onOpenPdfModal: () => void }) {
  const router = useRouter();
  const logout = () => {
    localStorage.removeItem("nightscoutUrl");
    localStorage.removeItem("nightscoutToken");
    router.push("/login");
  };

  // Sélecteur de langue
  const [lang, setLang] = useState(i18n.language || "fr");
  const handleLangChange = (value: string) => {
    setLang(value);
    i18n.changeLanguage(value);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-950 border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">DiabExplorer</h1>
        <Select value={lang} onValueChange={handleLangChange}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Fr</SelectItem>
            <SelectItem value="en">En</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full sm:w-80 justify-start text-left font-normal h-8",
                !date?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Sélectionner une plage de dates</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        <Button onClick={onOpenPdfModal} className="h-8 px-4">
          Créer un PDF
        </Button>
        <Button onClick={logout} className="h-8 px-4">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
} 