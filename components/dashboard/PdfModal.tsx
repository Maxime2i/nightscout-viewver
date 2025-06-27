import React, { useState } from "react";

interface PdfModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (infos: { nom: string; prenom: string; dateNaissance: string; insuline: string; diabeteDepuis: string }) => void;
}

export const PdfModal: React.FC<PdfModalProps> = ({ open, onClose, onGenerate }) => {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [insuline, setInsuline] = useState("");
  const [diabeteDepuis, setDiabeteDepuis] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Informations pour le PDF</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onGenerate({ nom, prenom, dateNaissance, insuline, diabeteDepuis });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium">Nom</label>
            <input type="text" className="w-full border rounded px-2 py-1" value={nom} onChange={e => setNom(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Prénom</label>
            <input type="text" className="w-full border rounded px-2 py-1" value={prenom} onChange={e => setPrenom(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Date de naissance</label>
            <input type="date" className="w-full border rounded px-2 py-1" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Insuline</label>
            <input type="text" className="w-full border rounded px-2 py-1" value={insuline} onChange={e => setInsuline(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Diabétique depuis</label>
            <input type="month" className="w-full border rounded px-2 py-1" value={diabeteDepuis} onChange={e => setDiabeteDepuis(e.target.value)} required />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Annuler</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Générer le PDF</button>
          </div>
        </form>
      </div>
    </div>
  );
}; 