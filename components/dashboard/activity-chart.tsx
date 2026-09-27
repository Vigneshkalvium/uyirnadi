"use client";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RecordData } from "@/types";
export function ActivityChart({
  records,
  metric = "water",
  days = 7,
}: {
  records: RecordData[];
  metric?: "water" | "activity" | "weight";
  days?: number;
}) {
  const data = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const date = d.toLocaleDateString("en-CA");
    const matches = records.filter((r) => r.date === date);
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      value:
        metric === "weight"
          ? matches.length
            ? Number(matches[0].weight)
            : null
          : matches.reduce(
              (sum, r) =>
                sum +
                Number(r[metric === "water" ? "amount" : "duration"] || 0),
              0,
            ) / (metric === "water" ? 1000 : 1),
    };
  });
  return (
    <div
      className="h-[170px] w-full"
      role="img"
      aria-label={`${metric} trend over ${days} days`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 8, left: -28, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a7bd86" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#a7bd86" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="#eaeee4"
          />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#a0a78f", fontSize: 9 }}
            dy={7}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#a0a78f", fontSize: 9 }}
            tickFormatter={(v) => `${v}${metric === "water" ? "L" : ""}`}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #e6e9df",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value) => [
              `${value} ${metric === "water" ? "L" : metric === "weight" ? "kg" : "min"}`,
              metric === "water"
                ? "Water intake"
                : metric === "weight"
                  ? "Weight"
                  : "Activity",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#9bb17b"
            strokeWidth={2}
            fill={`url(#fill-${metric})`}
            dot={{ r: 3, stroke: "#9bb17b", fill: "white", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
