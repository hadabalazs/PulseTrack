import { subscriptionComparison } from "@/lib/subscriptionComparison";
import { cn } from "@/lib/utils";

const money = value => `AED ${value.toFixed(2)}`;

export default function SubscriptionComparison({ entry, logs, today }) {
  const comparison = subscriptionComparison(entry, logs, today);
  return (
    <section className="border-t pt-3 space-y-2" aria-label={`${entry.sport} cost comparison to date`}>
      <h3 className="text-xs font-semibold">Cost comparison to date</h3>
      {!comparison ? <p className="text-xs text-muted-foreground">Enter a valid subscription start and end date to compare costs.</p> : <>
        <dl className="space-y-2 text-xs">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">Subscription accrued<small className="block mt-0.5">{comparison.days} / 365 days × {money(Number(entry.yearlyCost))}</small></dt>
            <dd className="font-semibold shrink-0">{money(comparison.accruedCost)}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">Pay-per-session equivalent<small className="block mt-0.5">{comparison.sessions} session{comparison.sessions !== 1 ? "s" : ""}{comparison.sessionPrice !== null && ` × ${money(comparison.sessionPrice)}`}</small></dt>
            <dd className="font-semibold shrink-0">{comparison.sessionTotal === null ? "—" : money(comparison.sessionTotal)}</dd>
          </div>
        </dl>
        {comparison.savings === null ? <p className="text-xs text-muted-foreground">Enter a session price to see the difference.</p> : <p className={cn("text-xs font-semibold", comparison.savings > 0 ? "text-emerald-500" : "text-muted-foreground")}>
          {Math.abs(comparison.savings) < 0.005 ? "Costs are equal to date" : comparison.savings > 0 ? `Subscription is ${money(comparison.savings)} cheaper to date` : `Pay-per-session is ${money(-comparison.savings)} cheaper to date`}
        </p>}
        <p className="text-[10px] text-muted-foreground">Includes the start date and today; stops at the end date or 365 days. Excludes future sessions and sessions marked Exclude Payment.</p>
      </>}
    </section>
  );
}
