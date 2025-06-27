"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, Download, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { useTranslation } from 'react-i18next';

export function DataManagement() {
  const { t } = useTranslation('common');
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2025, 5, 18),
    to: new Date(2025, 5, 25),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('DataManagement.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>{t('DataManagement.pickDate')}</span>
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
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={t('DataManagement.eventType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('DataManagement.allEvents')}</SelectItem>
              <SelectItem value="glucose">{t('DataManagement.glucoseReadings')}</SelectItem>
              <SelectItem value="insulin">{t('DataManagement.insulinDoses')}</SelectItem>
              <SelectItem value="notes">{t('DataManagement.notes')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="w-full gap-2 md:col-span-1">
            <Filter className="h-4 w-4" /> {t('DataManagement.applyFilters')}
          </Button>
          <Select defaultValue="period">
            <SelectTrigger className="w-full md:col-span-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="period">{t('DataManagement.exportPeriod')}</SelectItem>
              <SelectItem value="all">{t('DataManagement.exportAllData')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full gap-2 md:col-span-1">
            <Download className="h-4 w-4" /> {t('DataManagement.exportPdf')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 