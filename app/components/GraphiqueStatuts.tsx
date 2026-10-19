"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COULEURS: Record<string, string> = {
  "En cours": "#f59e0b",
  "En étude": "#8b5cf6",
  "Terminé": "#22c55e",
};

export default function GraphiqueStatuts({
  projets,
}: {
  projets: { statut: string }[];
}) {
  const compte: Record<string, number> = {};
  projets.forEach((p) => {
    compte[p.statut] = (compte[p.statut] || 0) + 1;
  });
  const data = Object.entries(compte).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
            {data.map((d) => (
              <Cell key={d.name} fill={COULEURS[d.name] || "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}