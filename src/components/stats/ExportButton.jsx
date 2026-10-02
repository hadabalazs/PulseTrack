import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ExportButton({ logs }) {
  const handleExport = () => {
    const sorted = [...logs].sort((a, b) => {
      const dateA = typeof a.date === "string" ? a.date.substring(0, 10) : a.date;
      const dateB = typeof b.date === "string" ? b.date.substring(0, 10) : b.date;
      return dateB.localeCompare(dateA);
    });

    const rows = sorted.map((l) => {
      const dateStr = typeof l.date === "string" ? l.date.substring(0, 10) : new Date(l.date).toISOString().substring(0, 10);
      const dayName = new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });
      return `<tr><td>${l.exercise}</td><td style="mso-number-format:'Short Date';">${dateStr}</td><td>${dayName}</td></tr>`;
    });

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1"><tr><th style="background:#e0f2fe;font-weight:bold;">Exercise</th><th style="background:#e0f2fe;font-weight:bold;">Date</th><th style="background:#e0f2fe;font-weight:bold;">Day</th></tr>${rows.join("")}</table></body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workout-data.xls";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport} className="rounded-xl">
      <Download className="w-4 h-4 mr-2" />
      Export to Excel
    </Button>
  );
}