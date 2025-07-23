import { useState, useEffect } from "react";
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
import { useTranslation } from 'react-i18next';
import Image from "next/image";

export function Header({ date, setDate, onOpenPdfModal }: { date: DateRange | undefined, setDate: (date: DateRange | undefined) => void, onOpenPdfModal: () => void }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  
  // Détecter la locale depuis l'URL
  const getCurrentLocale = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/en')) return 'en';
      if (pathname.startsWith('/fr')) return 'fr';
    }
    return 'fr'; // défaut
  };

  const [lang, setLang] = useState(getCurrentLocale());

  // Initialiser la langue au montage du composant
  useEffect(() => {
    const currentLocale = getCurrentLocale();
    if (i18n.language !== currentLocale) {
      i18n.changeLanguage(currentLocale);
      setLang(currentLocale);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("nightscoutUrl");
    localStorage.removeItem("nightscoutToken");
    // Rediriger vers la page de login avec la locale actuelle
    const currentLocale = lang || "fr";
    router.push(`/${currentLocale}/login`);
  };

  // Sélecteur de langue
  const handleLangChange = (value: string) => {
    setLang(value);
    i18n.changeLanguage(value);
    // Rediriger vers la nouvelle locale
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/(fr|en)/, `/${value}`);
    router.push(newPath);
  };

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-4 bg-white dark:bg-gray-950 border-b gap-2 sm:gap-0">
      <div className="relative w-full flex items-center gap-2 sm:gap-4 sm:w-auto justify-center sm:justify-start">
        <Image src="/logo.png" width={32} height={32} alt="Logo DiabExplorer" className="h-8 w-8 border border-black rounded-sm" />
        <h1 className="text-lg sm:text-xl font-bold text-center sm:text-left">{t('Header.title')}</h1>
        <Select value={lang} onValueChange={handleLangChange}>
          <SelectTrigger className="w-20 sm:w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Fr</SelectItem>
            <SelectItem value="en">En</SelectItem>
          </SelectContent>
        </Select>
        {/* Bouton logout mobile absolument positionné */}
        <Button onClick={logout} className="absolute right-2 top-2 block sm:hidden h-8 px-3">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
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
                <span>{t('Header.selectDateRange')}</span>
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
        <Button onClick={onOpenPdfModal} className="h-8 px-3 sm:px-4 w-full sm:w-auto">
          {t('Header.createPdf')}
        </Button>
        {/* Bouton logout desktop */}
        <Button onClick={logout} className="h-8 px-3 sm:px-4 w-full sm:w-auto hidden sm:block">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
} 