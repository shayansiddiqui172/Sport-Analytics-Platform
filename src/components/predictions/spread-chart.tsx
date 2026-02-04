"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getTeamColor } from "@/lib/team-colors";

interface SpreadChartData {
  label: string;
  spread: number;
  homeTeam: string;
  awayTeam: string;
}

export default function SpreadChart({ data }: { data: SpreadChartData[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "#737373", fontSize: 11 }}
            axisLine={{ stroke: "#333" }}
            tickLine={{ stroke: "#333" }}
            tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            tick={{ fill: "#a3a3a3", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              color: "#fff",
            }}
            formatter={(value) => [
              `${Number(value) > 0 ? "+" : ""}${value}`,
              "Spread",
            ]}
          />
          <Bar dataKey="spread" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={getTeamColor(
                  entry.spread < 0 ? entry.homeTeam : entry.awayTeam
                )}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
