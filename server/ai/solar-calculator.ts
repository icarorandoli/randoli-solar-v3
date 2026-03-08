export interface SizingInput {
  monthlyConsumptionKwh: number;
  irradiationKwhM2Day: number;
  systemEfficiency?: number;
  panelPowerW?: number;
}

export interface SizingResult {
  recommendedKwp: number;
  panelsNeeded: number;
  inverterPowerKw: number;
  monthlyGenerationKwh: number;
  annualGenerationKwh: number;
  systemEfficiency: number;
  dailyConsumptionKwh: number;
  paybackYears?: number;
}

const DEFAULT_EFFICIENCY = 0.78;
const DEFAULT_PANEL_POWER_W = 540;

export function calculateSystemSize(input: SizingInput): SizingResult {
  const efficiency = input.systemEfficiency ?? DEFAULT_EFFICIENCY;
  const panelPower = input.panelPowerW ?? DEFAULT_PANEL_POWER_W;
  const dailyConsumption = input.monthlyConsumptionKwh / 30;

  const recommendedKwp =
    dailyConsumption / (input.irradiationKwhM2Day * efficiency);

  const panelsNeeded = Math.ceil((recommendedKwp * 1000) / panelPower);
  const actualKwp = (panelsNeeded * panelPower) / 1000;

  const inverterPowerKw = parseFloat((actualKwp * 0.95).toFixed(2));

  const monthlyGenerationKwh = parseFloat(
    (actualKwp * input.irradiationKwhM2Day * 30 * efficiency).toFixed(0)
  );
  const annualGenerationKwh = monthlyGenerationKwh * 12;

  return {
    recommendedKwp: parseFloat(recommendedKwp.toFixed(2)),
    panelsNeeded,
    inverterPowerKw,
    monthlyGenerationKwh,
    annualGenerationKwh,
    systemEfficiency: efficiency,
    dailyConsumptionKwh: parseFloat(dailyConsumption.toFixed(2)),
  };
}

export function estimatePayback(
  systemKwp: number,
  systemCostBrl: number,
  monthlyGenerationKwh: number,
  tariffBrl: number = 0.75
): number {
  const monthlyEconomy = monthlyGenerationKwh * tariffBrl;
  if (monthlyEconomy <= 0) return 0;
  return parseFloat((systemCostBrl / (monthlyEconomy * 12)).toFixed(1));
}

export function suggestInverterPower(kwp: number): number {
  const ratio = 0.95;
  const inverterKw = kwp * ratio;
  const steps = [1.5, 2, 3, 3.3, 3.6, 4, 5, 6, 7.5, 8, 10, 12, 15, 17.5, 20, 25, 30, 40, 50, 60, 75, 100];
  for (const step of steps) {
    if (step >= inverterKw) return step;
  }
  return Math.ceil(inverterKw / 5) * 5;
}

export function phaseFromConsumption(monthlyKwh: number): "mono" | "bi" | "tri" {
  if (monthlyKwh <= 300) return "mono";
  if (monthlyKwh <= 1000) return "bi";
  return "tri";
}
