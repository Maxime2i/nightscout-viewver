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

export function DataManagement() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2025, 5, 18),
    to: new Date(2025, 5, 25),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
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
                  <span>Pick a date</span>
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
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="glucose">Glucose Readings</SelectItem>
              <SelectItem value="insulin">Insulin Doses</SelectItem>
              <SelectItem value="notes">Notes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="w-full gap-2 md:col-span-1">
            <Filter className="h-4 w-4" /> Apply Filters
          </Button>
          <Select defaultValue="period">
            <SelectTrigger className="w-full md:col-span-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="period">Export Period</SelectItem>
              <SelectItem value="all">Export All Data</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full gap-2 md:col-span-1">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 