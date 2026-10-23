import { useEffect, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function AfterMount({ children, className }: { children: ReactNode; className: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  if (!on) return <div className={className} />;
  return <div className={className} dir="ltr">{children}</div>;
}

const tip = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-line)",
  borderRadius: 12,
  color: "var(--color-fg)",
  fontSize: 12,
};

export function TrendChart({ data, unit }: { data: { label: string; value: number }[]; unit?: string }) {
  if (data.length < 1) return null;
  return (
    <AfterMount className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip contentStyle={tip} formatter={(value) => [`${value ?? ""}${unit ? ` ${unit}` : ""}`, ""]} />
          <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </AfterMount>
  );
}

export function Columns({ data, unit }: { data: { label: string; value: number }[]; unit?: string }) {
  if (!data.length) return null;
  return (
    <AfterMount className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tip} formatter={(value) => [`${value ?? ""}${unit ? ` ${unit}` : ""}`, ""]} />
          <Bar dataKey="value" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </AfterMount>
  );
}
