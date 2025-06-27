import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PdfModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (infos: { nom: string; prenom: string; dateNaissance: string; insuline: string; diabeteDepuis: string; includeCharts: boolean; includeVariabilityChart: boolean }) => void;
}

export const PdfModal: React.FC<PdfModalProps> = ({ open, onClose, onGenerate }) => {
  const { t } = useTranslation('common');
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [insuline, setInsuline] = useState("");
  const [diabeteDepuis, setDiabeteDepuis] = useState("");
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
          setDiabeteDepuis(infos.diabeteDepuis || "");
          setIncludeCharts(infos.includeCharts !== undefined ? infos.includeCharts : true);
          setIncludeVariabilityChart(infos.includeVariabilityChart !== undefined ? infos.includeVariabilityChart : true);
        } catch {}
      }
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('PdfModal.title')}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            // Sauvegarde dans le localStorage
            localStorage.setItem(
              "pdfInfos",
              JSON.stringify({ nom, prenom, dateNaissance, insuline, diabeteDepuis, includeCharts, includeVariabilityChart })
            );
            onGenerate({ nom, prenom, dateNaissance, insuline, diabeteDepuis, includeCharts, includeVariabilityChart });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium">{t('PdfModal.lastName')}</label>
            <input type="text" className="w-full border rounded px-2 py-1" value={nom} onChange={e => setNom(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">{t('PdfModal.firstName')}</label>
            <input type="text" className="w-full border rounded px-2 py-1" value={prenom} onChange={e => setPrenom(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">{t('PdfModal.birthDate')}</label>
            <input type="date" className="w-full border rounded px-2 py-1" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">{t('PdfModal.insulin')}</label>
            <input type="text" className="w-full border rounded px-2 py-1" value={insuline} onChange={e => setInsuline(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">{t('PdfModal.diabeticSince')}</label>
            <input type="month" className="w-full border rounded px-2 py-1" value={diabeteDepuis} onChange={e => setDiabeteDepuis(e.target.value)} required />
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="includeCharts" 
              checked={includeCharts} 
              onChange={e => setIncludeCharts(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeCharts" className="text-sm font-medium">
              {t('PdfModal.includeCharts')}
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="includeVariabilityChart" 
              checked={includeVariabilityChart} 
              onChange={e => setIncludeVariabilityChart(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeVariabilityChart" className="text-sm font-medium">
              {t('PdfModal.includeVariabilityChart')}
            </label>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>{t('PdfModal.cancel')}</Button>
            <Button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t('PdfModal.generatePdf')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}; 