"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UploadResult {
  uploadId: string;
  rowsTotal: number;
  rowsImported: number;
  rowsSkipped: number;
  rowsDuplicate: number;
  errors: string[];
}

export function UploadForm() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".xlsx")) {
      toast.error("Фақат .xlsx файл қабул қилинади");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Хато");
      setResult(data);
      toast.success(`Юкланди: ${data.rowsImported} та янги сертификат`);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed cursor-pointer transition-colors ${
          dragging ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-slate-400"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <CardContent className="p-10 text-center">
          <p className="text-4xl mb-3">📥</p>
          <p className="font-medium text-slate-700">
            {loading ? "Юкланмоқда..." : "Excel файлни шу ерга ташланг ёки босинг"}
          </p>
          <p className="text-sm text-slate-400 mt-1">.xlsx · максимум 10MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="font-semibold text-slate-700">Юклаш натижаси</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">Жами: {result.rowsTotal}</Badge>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                ✅ Янги: {result.rowsImported}
              </Badge>
              {result.rowsDuplicate > 0 && (
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  🔁 Дубликат: {result.rowsDuplicate}
                </Badge>
              )}
              {result.rowsSkipped > 0 && (
                <Badge variant="outline" className="text-slate-500">
                  Ўтказиб юборилди: {result.rowsSkipped}
                </Badge>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 space-y-1">
                <p className="font-medium">Хатолар ({result.errors.length}):</p>
                {result.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                toast.info("Текшириш бошланди...");
                await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
                toast.success("Текшириш тугади. Рўйхатни янгиланг.");
              }}
            >
              🔍 Сертификатларни текшириш
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
