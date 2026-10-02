import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "hsl(199, 89%, 48%)",
  "hsl(168, 76%, 42%)",
  "hsl(262, 60%, 58%)",
  "hsl(43, 96%, 56%)",
  "hsl(348, 83%, 60%)",
  "hsl(210, 70%, 50%)",
  "hsl(140, 60%, 45%)",
  "hsl(30, 80%, 55%)",
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-xl px-4 py-3 shadow-lg">
      <p className="text-sm font-medium">{payload[0].name}</p>
      <p className="text-xs text-muted-foreground">{payload[0].value} times</p>
    </div>
  );
};

export default function ExerciseBreakdown({ logs }) {
  const data = useMemo(() => {
    const counts = {};
    logs.forEach((l) => {
      counts[l.exercise] = (counts[l.exercise] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        No data yet
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2 w-full">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-sm truncate">{item.name}</span>
            <span className="text-xs text-muted-foreground ml-auto font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}