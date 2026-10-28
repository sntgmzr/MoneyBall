import datos from '../data/datos.json';

export {datos};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
};
export const fmtDay = (d: Date) => `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
export const fmtMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return `${MESES[m - 1]} ${y}`;
};
export const fmtMonthShort = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return `${MESES[m - 1]} ${String(y).slice(2)}`;
};
export const fmtUsd = (n: number, decimals = 0) =>
  '$' + n.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
export const fmtPct = (n: number, decimals = 2, sign = true) =>
  `${sign && n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(decimals)} %`;

export const isPending = (v: unknown) => typeof v === 'string' && v.startsWith('PENDIENTE');

export const corte = `Datos al ${fmtDate(datos.fecha_corte)}`;

// Months of the backtest, e.g. ["2024-08", …, "2026-09"].
export const backtestMonths = () => {
  const [y0, m0] = datos.backtest.inicio.split('-').map(Number);
  return new Array(datos.backtest.meses).fill(0).map((_, i) => {
    const m = m0 - 1 + i;
    return `${y0 + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, '0')}`;
  });
};

// "D4–D6 dinero real pequeño" → {code, label, from, to} with real dates from paper.inicio.
export const planSteps = () => {
  const start = new Date(datos.paper.inicio.slice(0, 10) + 'T00:00:00Z');
  return datos.plan.map((p) => {
    const m = p.match(/^D(\d)(?:–D(\d))?\s+(.*)$/)!;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    const day = (n: number) => new Date(start.getTime() + n * 86400000);
    const dates = a === b ? fmtDay(day(a)) : `${fmtDay(day(a))} – ${fmtDay(day(b))}`;
    const code = a === b ? `D${a}` : `D${a}–D${b}`;
    return {code, label: m[3].charAt(0).toUpperCase() + m[3].slice(1), dates};
  });
};
