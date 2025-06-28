import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface PdfModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (infos: { nom: string; prenom: string; dateNaissance: string; insuline: string; diabeteDepuis: string; includeCharts: boolean; includeVariabilityChart: boolean }) => void;
}

const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(CURRENT_YEAR - i));

export const PdfModal: React.FC<PdfModalProps> = ({ open, onClose, onGenerate }) => {
  const { t } = useTranslation('common');
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState<string>("");
  const [insuline, setInsuline] = useState("");
  const [diabeteDepuisMonth, setDiabeteDepuisMonth] = useState<string>("");
  const [diabeteDepuisYear, setDiabeteDepuisYear] = useState<string>("");
  const [includeCharts, setIncludeCharts] = useState(true); // Activé par défaut
  const [includeVariabilityChart, setIncludeVariabilityChart] = useState(true); // Activé par défaut

  // Pré-remplissage depuis le localStorage à l'ouverture
  React.useEffect(() => {
    if (open) {
      const saved = localStorage.getItem("pdfInfos");
      if (saved) {
        try {
          const infos = JSON.parse(saved);
          setNom(infos.nom || "");
          setPrenom(infos.prenom || "");
          setDateNaissance(infos.dateNaissance || "");
          setInsuline(infos.insuline || "");
          if (infos.diabeteDepuis) {
            const [year, month] = infos.diabeteDepuis.split("-");
            setDiabeteDepuisYear(year || "");
            setDiabeteDepuisMonth(month || "");
          } else {
            setDiabeteDepuisYear("");
            setDiabeteDepuisMonth("");
          }
          setIncludeCharts(infos.includeCharts !== undefined ? infos.includeCharts : true);
          setIncludeVariabilityChart(infos.includeVariabilityChart !== undefined ? infos.includeVariabilityChart : true);
        } catch {}
      }
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-0">
      <Card className="w-full max-w-xs sm:max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">{t('PdfModal.title')}</CardTitle>
        </CardHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            const diabeteDepuis = diabeteDepuisYear && diabeteDepuisMonth ? `${diabeteDepuisYear}-${diabeteDepuisMonth}` : "";
            localStorage.setItem(
              "pdfInfos",
              JSON.stringify({ nom, prenom, dateNaissance, insuline, diabeteDepuis, includeCharts, includeVariabilityChart })
            );
            onGenerate({ nom, prenom, dateNaissance, insuline, diabeteDepuis, includeCharts, includeVariabilityChart });
          }}
        >
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nom">{t('PdfModal.lastName')}</Label>
              <Input id="nom" type="text" value={nom} onChange={e => setNom(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="prenom">{t('PdfModal.firstName')}</Label>
              <Input id="prenom" type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required />
            </div>
            <div>
              <Label>{t('PdfModal.birthDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${dateNaissance ? "text-black" : "text-muted-foreground"}`}
                  >
                    {dateNaissance ? format(new Date(dateNaissance), "dd/MM/yyyy") : t('PdfModal.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateNaissance ? new Date(dateNaissance) : undefined}
                    onSelect={date => setDateNaissance(date ? date.toISOString().split('T')[0] : "")}
                    initialFocus
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>{t('PdfModal.diabeticSince')}</Label>
              <div className="flex gap-2">
                <Select value={diabeteDepuisMonth} onValueChange={setDiabeteDepuisMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t('PdfModal.month')} />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={diabeteDepuisYear} onValueChange={setDiabeteDepuisYear}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder={t('PdfModal.year')} />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="insuline">{t('PdfModal.insulin')}</Label>
              <Input id="insuline" type="text" value={insuline} onChange={e => setInsuline(e.target.value)} required />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="includeCharts" checked={includeCharts} onCheckedChange={checked => setIncludeCharts(!!checked)} className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 focus:ring-blue-500" />
              <Label htmlFor="includeCharts">{t('PdfModal.includeCharts')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="includeVariabilityChart" checked={includeVariabilityChart} onCheckedChange={checked => setIncludeVariabilityChart(!!checked)} className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 focus:ring-blue-500" />
              <Label htmlFor="includeVariabilityChart">{t('PdfModal.includeVariabilityChart')}</Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
            <Button variant="outline" type="button" onClick={onClose} className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500">{t('PdfModal.cancel')}</Button>
            <Button type="submit" className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">{t('PdfModal.generatePdf')}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}; 