import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Project, Client } from "@shared/schema";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function parseValor(v: any): number {
  if (!v) return 0;
  return parseFloat(String(v).replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
}
function varPct(cur: number, prev: number): string {
  if (prev === 0) return cur > 0 ? "+100%" : "—";
  const v = ((cur - prev) / prev * 100).toFixed(1);
  return `${parseFloat(v) >= 0 ? "+" : ""}${v}%`;
}

export default function FinanceiroDREPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const { data: projects = [], isLoading } = useQuery<(Project & { client: Client | null })[]>({ queryKey: ["/api/projects"] });

  const curYear = parseInt(selectedYear);
  const curMonth = parseInt(selectedMonth);
  const prevYear = curMonth === 1 ? curYear - 1 : curYear;
  const prevMonth = curMonth === 1 ? 12 : curMonth - 1;

  const MONTHS = ["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const curLabel = `${MONTHS[curMonth]} de ${curYear}`;
  const prevLabel = `${MONTHS[prevMonth]} ${prevYear}`;

  const paidProjects = projects.filter(p => p.paymentStatus === "approved");

  function getMonthRevenue(year: number, month: number) {
    return paidProjects.filter(p => {
      if (!p.updatedAt) return false;
      const d = new Date(p.updatedAt);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    }).reduce((s, p) => s + parseValor(p.valor), 0);
  }

  const curReceita = getMonthRevenue(curYear, curMonth);
  const prevReceita = getMonthRevenue(prevYear, prevMonth);
  const curMargem = curReceita > 0 ? 100 : 0;
  const prevMargem = prevReceita > 0 ? 100 : 0;

  const rows = [
    { type: "header", label: "RECEITAS" },
    { type: "row", label: "Receitas de Projetos", cur: curReceita, prev: prevReceita },
    { type: "total-positive", label: "Receitas totais", cur: curReceita, prev: prevReceita },
    { type: "header", label: "(-) DESPESAS" },
    { type: "total-negative", label: "Total Despesas", cur: 0, prev: 0 },
    { type: "result", label: "Resultado", cur: curReceita, prev: prevReceita },
    { type: "margin", label: "Margem Líquida", cur: curMargem, prev: prevMargem, isPct: true },
  ];

  const years = [String(curYear), String(curYear - 1)];
  const months = MONTHS.slice(1).map((name, i) => ({ value: String(i + 1).padStart(2, "0"), label: name }));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">DRE Gerencial</h1>
          <p className="text-sm text-muted-foreground">{curLabel} vs {prevLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map(y => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-md rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Descrição</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{curLabel}</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{prevLabel}</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Var. %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                if (row.type === "header") {
                  return (
                    <tr key={i} className="bg-muted/10 border-b border-border/20">
                      <td colSpan={4} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{row.label}</td>
                    </tr>
                  );
                }
                const curVal = row.isPct ? row.cur! : row.cur!;
                const prevVal = row.isPct ? row.prev! : row.prev!;
                const vp = row.isPct ? "—" : varPct(curVal, prevVal);
                const vpNum = parseFloat(vp);
                const isResult = row.type === "result";
                const isNeg = row.type === "total-negative";
                return (
                  <tr key={i} className={`border-b border-border/20 ${isResult ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}`}>
                    <td className={`px-6 py-4 text-sm ${isResult ? "font-black text-emerald-700 dark:text-emerald-400" : isNeg ? "font-bold text-red-600" : "font-medium text-foreground/80"}`}>{row.label}</td>
                    <td className={`px-6 py-4 text-right text-sm font-bold ${isResult ? "text-emerald-700 dark:text-emerald-400" : isNeg ? "text-red-600" : ""}`}>
                      {row.isPct ? `${curVal.toFixed(1)} %` : formatBRL(curVal)}
                    </td>
                    <td className={`px-6 py-4 text-right text-sm ${isNeg ? "text-red-600" : "text-muted-foreground"}`}>
                      {row.isPct ? `${prevVal.toFixed(1)} %` : formatBRL(prevVal)}
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-bold ${isNaN(vpNum) || vp === "—" ? "text-muted-foreground" : vpNum >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {vp}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
