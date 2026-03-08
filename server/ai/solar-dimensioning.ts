import { calculateSystemSize, suggestInverterPower, phaseFromConsumption } from "./solar-calculator";
import type { SolarPanel, SolarInverter, SolarIrradiation } from "@shared/schema";

export interface DimensioningInput {
  monthlyConsumptionKwh: number;
  city: string;
  state: string;
  irradiationData: SolarIrradiation[];
  availablePanels: SolarPanel[];
  availableInverters: SolarInverter[];
  phases?: 1 | 2 | 3;
}

export interface DimensioningResult {
  kwp: number;
  panelsNeeded: number;
  monthlyGenerationKwh: number;
  annualGenerationKwh: number;
  suggestedPanel: SolarPanel | null;
  suggestedInverter: SolarInverter | null;
  irradiationUsed: number;
  phase: "mono" | "bi" | "tri";
  coveragePercent: number;
}

function findIrradiation(city: string, state: string, data: SolarIrradiation[]): number {
  const normalized = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const match = data.find(
    (d) => normalized(d.city) === normalized(city) && normalized(d.state) === normalized(state)
  );
  if (match) return parseFloat(String(match.irradiationKwhM2Day));
  const stateMatch = data.find((d) => normalized(d.state) === normalized(state));
  if (stateMatch) return parseFloat(String(stateMatch.irradiationKwhM2Day));
  return 4.5;
}

function pickBestPanel(kwp: number, panels: SolarPanel[]): SolarPanel | null {
  if (panels.length === 0) return null;
  const active = panels.filter((p) => p.active);
  if (active.length === 0) return panels[0];
  return active.sort((a, b) => b.powerW - a.powerW)[0];
}

function pickBestInverter(kwp: number, phases: number, inverters: SolarInverter[]): SolarInverter | null {
  if (inverters.length === 0) return null;
  const targetKw = kwp * 0.95;
  const active = inverters.filter((i) => i.active && i.phases === phases);
  if (active.length === 0) {
    const any = inverters.filter((i) => i.active);
    if (any.length === 0) return null;
    return any.sort((a, b) => Math.abs(parseFloat(String(a.powerKw)) - targetKw) - Math.abs(parseFloat(String(b.powerKw)) - targetKw))[0];
  }
  return active.sort((a, b) => Math.abs(parseFloat(String(a.powerKw)) - targetKw) - Math.abs(parseFloat(String(b.powerKw)) - targetKw))[0];
}

export function dimensionSystem(input: DimensioningInput): DimensioningResult {
  const irr = findIrradiation(input.city, input.state, input.irradiationData);
  const bestPanel = pickBestPanel(0, input.availablePanels);
  const panelPowerW = bestPanel ? bestPanel.powerW : 540;

  const sizing = calculateSystemSize({
    monthlyConsumptionKwh: input.monthlyConsumptionKwh,
    irradiationKwhM2Day: irr,
    panelPowerW,
  });

  const phase = phaseFromConsumption(input.monthlyConsumptionKwh);
  const phaseNum = phase === "mono" ? 1 : phase === "bi" ? 2 : 3;
  const bestInverter = pickBestInverter(sizing.recommendedKwp, phaseNum, input.availableInverters);
  const coveragePercent = Math.round((sizing.monthlyGenerationKwh / input.monthlyConsumptionKwh) * 100);

  return {
    kwp: sizing.recommendedKwp,
    panelsNeeded: sizing.panelsNeeded,
    monthlyGenerationKwh: sizing.monthlyGenerationKwh,
    annualGenerationKwh: sizing.annualGenerationKwh,
    suggestedPanel: bestPanel,
    suggestedInverter: bestInverter,
    irradiationUsed: irr,
    phase,
    coveragePercent,
  };
}
