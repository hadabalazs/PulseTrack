import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSports } from "@/lib/useSports";
import { SPORT_NAME_LIMIT } from "@/lib/sports";

export default function CustomSportsSettings() {
  const { customSports, addCustomSport } = useSports();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = event => {
    event.preventDefault();
    const result = addCustomSport(name);
    setError(result.error || "");
    setMessage(result.error ? "" : `${result.name} added to the sport selectors.`);
    if (!result.error) setName("");
  };

  return (
    <section className="rounded-2xl bg-card border p-6 space-y-4" aria-labelledby="custom-sports-title">
      <div>
        <h3 id="custom-sports-title" className="font-display font-semibold">Custom Sports</h3>
        <p className="text-sm text-muted-foreground mt-1">Add sports to the tracker and subscription dropdowns.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="custom-sport-name" className="text-sm font-medium">Sport name</label>
        <div className="flex gap-2">
          <input id="custom-sport-name" value={name} maxLength={SPORT_NAME_LIMIT} placeholder="e.g. Tennis"
            onChange={event => { setName(event.target.value); setError(""); setMessage(""); }}
            aria-invalid={!!error} aria-describedby={error ? "custom-sport-error" : undefined}
            className="min-w-0 flex-1 px-3 py-2 text-base sm:text-sm rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
          <Button type="submit" className="shrink-0"><Plus className="w-4 h-4 mr-1" />Add sport</Button>
        </div>
        {error && <p id="custom-sport-error" role="alert" className="text-xs text-destructive">{error}</p>}
        <p role="status" className="text-xs text-muted-foreground">{message}</p>
      </form>
      {customSports.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Your custom sports">
        {customSports.map(sport => <li key={sport} className="max-w-full break-words px-3 py-1.5 rounded-lg bg-muted text-xs font-medium">{sport}</li>)}
      </ul>}
      <p className="text-xs text-muted-foreground">Custom sports are saved on this device.</p>
    </section>
  );
}
