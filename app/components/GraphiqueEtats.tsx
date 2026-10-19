"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COULEURS: Record<string, string> = {
  "En cours": "#3b82f6",
  "En étude": "#a78bfa",
  "Terminé": "#22c55e",
};
const ORDRE = ["En cours", "En étude", "Terminé"];

export default function GraphiqueEtats({
  projets,
}: {
  projets: { etat: string }[];
}) {
  const total = projets.length;
  const data = ORDRE.map((name) => ({
    name,
    value: projets.filter((p) => p.etat === name).length,
  }));

  if (total === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">Aucune donnée à afficher.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={COULEURS[d.name]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-slate-500">projets</span>
        </div>
      </div>

      <ul className="w-full space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COULEURS[d.name] }} />
            <span className="flex-1 text-slate-600">{d.name}</span>
            <span className="font-medium">
              {d.value} ({Math.round((d.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
