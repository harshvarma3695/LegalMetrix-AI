import { UploadCloud, Camera, ShieldCheck, X, ScanLine, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { displayValue } from "../utils/displayValue";

export default function ScanProduct() {
  const inputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image size must be 10 MB or less."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setImage(file); setPreview(URL.createObjectURL(file)); setResult(null); setError("");
  };

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null); setPreview(null); setResult(null); setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyzeProduct = async () => {
    if (!image) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const formData = new FormData();
      formData.append("productImage", image);
      const response = await api.post("/inspection/scan", formData, { timeout: 120000 });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to connect with LegalMetriX backend.");
    } finally { setLoading(false); }
  };

  const inspection = result?.inspection;
  const declarations = inspection?.declarations || [];

  return (
    <div className="space-y-7">
      <div><p className="text-sm font-medium text-slate-400">Inspection Workspace</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Scan Product</h1><p className="mt-2 text-sm text-slate-500">Upload a clear image of the packaged commodity label for automated compliance analysis.</p></div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold text-slate-900">Product Label</h3><p className="mt-1 text-xs text-slate-400">JPG, JPEG, PNG or WEBP • Maximum 10 MB</p></div><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><ScanLine size={20} /></div></div>
          {!preview ? <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleImage(e.dataTransfer.files?.[0]); }} className="group flex min-h-[390px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition hover:border-slate-400 hover:bg-slate-100"><div className="rounded-2xl bg-white p-5 shadow-sm"><UploadCloud size={34} className="text-slate-700" /></div><h4 className="mt-5 font-bold text-slate-800">Upload product image</h4><p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Drag and drop your product label here or click to browse files.</p></div> : <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"><img src={preview} alt="Product preview" className="mx-auto max-h-[500px] object-contain" /><button onClick={removeImage} className="absolute right-4 top-4 rounded-xl bg-white p-2.5 text-slate-700 shadow-md hover:bg-red-50 hover:text-red-600"><X size={18} /></button></div>}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
          <button onClick={analyzeProduct} disabled={!image || loading} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition ${image && !loading ? "bg-slate-900 text-white hover:bg-slate-800" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}>{loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing Product...</> : <><ScanLine size={18} /> Analyze Product</>}</button>
          {error && <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Analysis failed</p><p className="mt-1">{error}</p></div></div>}
          {inspection && <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><CheckCircle2 size={20} /></div><div><h3 className="font-bold text-slate-900">Inspection Completed</h3><p className="text-xs text-slate-500">{inspection.inspectionId}</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-white p-4"><p className="text-xs text-slate-400">Status</p><div className="mt-2"><StatusBadge status={inspection.complianceReport?.status} /></div></div><div className="rounded-xl bg-white p-4"><p className="text-xs text-slate-400">Compliance Score</p><p className="mt-2 text-2xl font-bold">{inspection.complianceReport?.score ?? 0}%</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs text-slate-400">OCR Confidence</p><p className="mt-2 text-2xl font-bold">{Math.round(inspection.ocrConfidence || 0)}%</p></div></div>
            <div className="mt-4 rounded-xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Declaration Checks</p><div className="mt-3 space-y-2">{declarations.map((item) => <div key={item.key || item.id || item.label} className="flex flex-col gap-2 border-b border-slate-100 py-3 last:border-0 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold text-slate-700">{displayValue(item.label, item.key || "Declaration")}</p><p className="mt-1 text-xs text-slate-500">{displayValue(item.value, displayValue(item.reason, "Not detected"))}</p></div><StatusBadge status={item.status} /></div>)}</div></div>
            <div className="mt-4 rounded-xl bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">OCR Extracted Text</p><p className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-600">{inspection.extractedText || "No text detected."}</p></div>
          </div>}
        </div></div>
        <div className="space-y-6"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><ShieldCheck size={20} /></div><div><h3 className="font-bold text-slate-900">Automated Inspection</h3><p className="text-xs text-slate-400">AI-assisted analysis</p></div></div><div className="mt-6 space-y-4">{["Mandatory declarations", "Net quantity & MRP", "Manufacturer details", "Country of origin", "Consumer care details", "Label readability"].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-slate-600"><div className="h-1.5 w-1.5 rounded-full bg-slate-400" />{item}</div>)}</div></div><div className="rounded-2xl border border-blue-100 bg-blue-50 p-6"><div className="flex items-center gap-3"><Camera size={20} className="text-blue-700" /><h3 className="font-bold text-blue-900">Better Results</h3></div><ul className="mt-4 space-y-3 text-sm leading-5 text-blue-800"><li>• Keep the label completely visible.</li><li>• Avoid glare and heavy shadows.</li><li>• Use a high-resolution image.</li><li>• Capture important declarations clearly.</li></ul></div></div>
      </div>
    </div>
  );
}
