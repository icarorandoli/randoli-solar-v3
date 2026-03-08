export interface EnergyBillInput {
  consumptionJan?: number;
  consumptionFeb?: number;
  consumptionMar?: number;
  consumptionApr?: number;
  consumptionMay?: number;
  consumptionJun?: number;
  consumptionJul?: number;
  consumptionAug?: number;
  consumptionSep?: number;
  consumptionOct?: number;
  consumptionNov?: number;
  consumptionDec?: number;
  tariffGroup?: string;
  phaseType?: "mono" | "bi" | "tri";
  consumerUnit?: string;
  city: string;
  state: string;
}

export interface EnergyAnalysisResult {
  averageConsumptionKwh: number;
  maxConsumptionKwh: number;
  minConsumptionKwh: number;
  monthlyHistory: { month: string; kwh: number }[];
  tariffGroup: string;
  phaseType: string;
  consumerUnit: string;
  recommendedSystemKwp: number;
  estimatedMonthlyProduction: number;
  city: string;
  state: string;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function analyzeEnergyBill(input: EnergyBillInput): EnergyAnalysisResult {
  const values = [
    input.consumptionJan,
    input.consumptionFeb,
    input.consumptionMar,
    input.consumptionApr,
    input.consumptionMay,
    input.consumptionJun,
    input.consumptionJul,
    input.consumptionAug,
    input.consumptionSep,
    input.consumptionOct,
    input.consumptionNov,
    input.consumptionDec,
  ].map((v) => v ?? 0);

  const filled = values.filter((v) => v > 0);
  const averageConsumptionKwh = filled.length > 0
    ? Math.round(filled.reduce((a, b) => a + b, 0) / filled.length)
    : 0;

  const maxConsumptionKwh = filled.length > 0 ? Math.max(...filled) : 0;
  const minConsumptionKwh = filled.length > 0 ? Math.min(...filled) : 0;

  const monthlyHistory = values.map((kwh, i) => ({ month: MONTHS[i], kwh }));

  const irr = 4.8;
  const efficiency = 0.78;
  const dailyConsumption = (averageConsumptionKwh || maxConsumptionKwh) / 30;
  const recommendedSystemKwp = parseFloat(
    (dailyConsumption / (irr * efficiency)).toFixed(2)
  );
  const estimatedMonthlyProduction = Math.round(
    recommendedSystemKwp * irr * 30 * efficiency
  );

  return {
    averageConsumptionKwh,
    maxConsumptionKwh,
    minConsumptionKwh,
    monthlyHistory,
    tariffGroup: input.tariffGroup ?? "B1 - Residencial",
    phaseType: input.phaseType ?? (averageConsumptionKwh > 1000 ? "tri" : averageConsumptionKwh > 300 ? "bi" : "mono"),
    consumerUnit: input.consumerUnit ?? "",
    recommendedSystemKwp,
    estimatedMonthlyProduction,
    city: input.city,
    state: input.state,
  };
}
