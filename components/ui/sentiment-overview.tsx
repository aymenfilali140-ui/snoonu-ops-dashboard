"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SentimentCounts = {
  positive: number;
  neutral: number;
  negative: number;
};

export function SentimentOverview({ counts, title, }: { counts: SentimentCounts; title?: string }) {
  const data = [
    { name: "Positive", value: counts.positive },
    { name: "Neutral", value: counts.neutral },
    { name: "Negative", value: counts.negative },
  ];

  const total =
    counts.positive + counts.neutral + counts.negative;

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          {title ?? "Sentiment breakdown"}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {total === 0 ? (
          <p className="text-xs text-slate-500">
            No data available for the current filters.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => {
                  let fill = "#64748b"; // neutral gray
                  if (entry.name === "Positive") fill = "#06D6A0";
                  if (entry.name === "Negative") fill = "#E63946";
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
