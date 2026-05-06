import { UploadForm } from "./upload-form";

export default function UploadPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Excel файл юклаш</h1>
        <p className="text-sm text-slate-500 mt-1">
          .xlsx шаблонини юкланг. Маълумотлар 6-сатрдан бошлаб ўқилади.
          Такрорий ссылкалар дубликат сифатида белгиланади.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}
