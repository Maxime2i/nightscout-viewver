import { useState } from "react";
import { Bell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export function Header({ date, setDate }: { date: DateRange | undefined, setDate: (date: DateRange | undefined) => void }) {
  const handleCreatePDF = () => {
    if (!date?.from) {
      alert("Merci de sélectionner une plage de dates.");
      return;
    }
    const from = format(date.from, "yyyy-MM-dd");
    const to = date.to ? format(date.to, "yyyy-MM-dd") : from;
    alert(`Créer un PDF du ${from} au ${to}`);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-950 border-b">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold">
          BG
        </div>
        <h1 className="text-xl font-bold">BG Viewer</h1>
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
        <Button onClick={handleCreatePDF} className="h-8 px-4">
          Créer un PDF
        </Button>
      </div>
    </header>
  );
} 