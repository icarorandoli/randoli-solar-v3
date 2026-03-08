export interface SimulationInput {
  systemKwp: number;
  irradiationKwhM2Day: number;
  systemEfficiency?: number;
  tiltDegrees?: number;
  orientationFactor?: number;
}

export interface MonthlyProduction {
  month: string;
  irradiation: number;
  productionKwh: number;
  factor: number;
}

export interface SimulationResult {
  monthlyProduction: MonthlyProduction[];
  totalAnnualKwh: number;
  averageMonthlyKwh: number;
  peakMonthKwh: number;
  lowestMonthKwh: number;
  systemKwp: number;
  co2SavedKg: number;
  treesEquivalent: number;
}

const MONTHLY_FACTORS = [0.98, 0.97, 1.02, 0.99, 0.95, 0.90, 0.88, 0.92, 0.96, 1.01, 1.03, 1.00];
const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const CO2_PER_KWH = 0.0817;
const TREES_PER_TON_CO2 = 16.5;

export function simulateProduction(input: SimulationInput): SimulationResult {
  const efficiency = input.systemEfficiency ?? 0.78;
  const orientationFactor = input.orientationFactor ?? 1.0;

  const monthlyProduction: MonthlyProduction[] = MONTHS_PT.map((month, i) => {
    const factor = MONTHLY_FACTORS[i] * orientationFactor;
    const days = DAYS_PER_MONTH[i];
    const irr = input.irradiationKwhM2Day * factor;
    const productionKwh = Math.round(input.systemKwp * irr * days * efficiency);
    return { month, irradiation: parseFloat(irr.toFixed(2)), productionKwh, factor };
  });

  const totalAnnualKwh = monthlyProduction.reduce((s, m) => s + m.productionKwh, 0);
  const averageMonthlyKwh = Math.round(totalAnnualKwh / 12);
  const peakMonthKwh = Math.max(...monthlyProduction.map((m) => m.productionKwh));
  const lowestMonthKwh = Math.min(...monthlyProduction.map((m) => m.productionKwh));
  const co2SavedKg = Math.round(totalAnnualKwh * CO2_PER_KWH);
  const treesEquivalent = Math.round((co2SavedKg / 1000) * TREES_PER_TON_CO2 * 10) / 10;

  return {
    monthlyProduction,
    totalAnnualKwh,
    averageMonthlyKwh,
    peakMonthKwh,
    lowestMonthKwh,
    systemKwp: input.systemKwp,
    co2SavedKg,
    treesEquivalent,
  };
}
