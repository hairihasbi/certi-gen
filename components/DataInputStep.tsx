"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Upload, Plus, Trash2, FileSpreadsheet, ArrowRight, ArrowLeft, Database, Download, Settings2 } from "lucide-react";
import Papa from "papaparse";

interface DataInputStepProps {
  data: any[];
  setData: (data: any[]) => void;
  placeholders: string[];
  onNext: () => void;
  onBack: () => void;
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
}

const DataInputStep: React.FC<DataInputStepProps> = ({ 
  data, 
  setData, 
  placeholders, 
  onNext, 
  onBack,
  selectedTemplateId,
  setSelectedTemplateId
}) => {
  const [manualRow, setManualRow] = useState<any>({});

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData([...data, ...results.data]);
      },
    });
  };

  const downloadCsvTemplate = () => {
    const csvContent = placeholders.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "certificate_data_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualAdd = () => {
    if (Object.keys(manualRow).length === 0) return;
    setData([...data, manualRow]);
    setManualRow({});
  };

  const removeRow = (index: number) => {
    setData(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.button 
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Design
        </motion.button>
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadCsvTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-600 rounded-lg font-bold hover:bg-stone-200 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </motion.button>
          <motion.button 
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNext}
            disabled={data.length === 0 || !selectedTemplateId}
            className="flex items-center gap-2 px-6 py-2 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-all disabled:opacity-50"
          >
            Next: Position Elements
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {!selectedTemplateId && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
            <Settings2 className="w-4 h-4" />
          </div>
          Please select a template in the Design tab before proceeding.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-stone-400" />
              Import Data
            </h3>
            
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileSpreadsheet className="w-8 h-8 text-stone-300 group-hover:text-stone-400 mb-2" />
                  <p className="text-sm text-stone-500">Click to upload CSV</p>
                </div>
                <input type="file" className="hidden" accept=".csv" onChange={handleCsvUpload} />
              </label>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-stone-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-stone-400 font-bold">Or Manual Entry</span>
                </div>
              </div>

              <div className="space-y-3">
                {placeholders.map(field => (
                  <div key={field} className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">{field}</label>
                    <input 
                      type="text"
                      value={manualRow[field] || ""}
                      onChange={(e) => setManualRow({ ...manualRow, [field]: e.target.value })}
                      placeholder={`Enter ${field}`}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm"
                    />
                  </div>
                ))}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleManualAdd}
                  className="w-full py-2 bg-stone-100 text-stone-600 rounded-lg font-bold text-sm hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add to List
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-stone-400" />
                Data Preview ({data.length} records)
              </h3>
              {data.length > 0 && (
                <button 
                  onClick={() => setData([])}
                  className="text-sm text-red-500 font-semibold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50 sticky top-0 z-10">
                  <tr>
                    {placeholders.map(field => (
                      <th key={field} className="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                        {field}
                      </th>
                    ))}
                    <th className="px-6 py-3 border-b border-stone-100"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                      {placeholders.map(field => (
                        <td key={field} className="px-6 py-4 text-sm text-stone-600">
                          {row[field] || "-"}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeRow(idx)}
                          className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={placeholders.length + 1} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-2 text-stone-400">
                          <Database className="w-12 h-12 opacity-20" />
                          <p className="font-medium">No data added yet</p>
                          <p className="text-xs">Import a CSV or add records manually to proceed</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataInputStep;
