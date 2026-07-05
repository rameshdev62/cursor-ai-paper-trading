import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const NFO_CSV_MODULE = require('./NFO_symbols.txt.csv');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const NSE_CSV_MODULE = require('./NSE_symbols.txt.csv');

export type CatalogSymbol = {
  exchange: string;
  token: string;
  lotSize: string;
  symbol: string;
  tradingSymbol: string;
  expiry?: string;
  instrument?: string;
  optionType?: string;
  strikePrice?: string;
};

let cachedNfo: CatalogSymbol[] | null = null;
let cachedNse: CatalogSymbol[] | null = null;
let nfoLoadPromise: Promise<CatalogSymbol[]> | null = null;
let nseLoadPromise: Promise<CatalogSymbol[]> | null = null;

function parseNfoLine(line: string): CatalogSymbol | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('Exchange,')) return null;

  const parts = trimmed.split(',');
  if (parts.length < 5) return null;

  const [exchange, token, lotSize, symbol, tradingSymbol, expiry, instrument, optionType, strikePrice] =
    parts;
    
  if (!exchange || !token || !symbol || !tradingSymbol) return null;

  return {
    exchange: exchange.trim(),
    token: token.trim(),
    lotSize: (lotSize ?? '').trim(),
    symbol: symbol.trim(),
    tradingSymbol: tradingSymbol.trim(),
    expiry: (expiry ?? '').trim(),
    instrument: (instrument ?? '').trim(),
    optionType: (optionType ?? '').trim(),
    strikePrice: (strikePrice ?? '').trim(),
  };
}

function parseNseLine(line: string): CatalogSymbol | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('Exchange,')) return null;

  const parts = trimmed.split(',');
  if (parts.length < 5) return null;

  const [exchange, token, lotSize, symbol, tradingSymbol, instrument] = parts;

  if (!exchange || !token || !symbol || !tradingSymbol) return null;

  return {
    exchange: exchange.trim(),
    token: token.trim(),
    lotSize: (lotSize ?? '').trim(),
    symbol: symbol.trim(),
    tradingSymbol: tradingSymbol.trim(),
    instrument: (instrument ?? '').trim(),
  };
}

async function readCsvText(moduleId: number): Promise<string> {
  if (typeof moduleId === 'string') {
    const resp = await fetch(moduleId);
    if (resp.ok) return resp.text();
    throw new Error(`Failed to fetch CSV: ${resp.status}`);
  }

  let uri: string | null = null;
  try {
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    uri = asset.localUri ?? asset.uri;
  } catch {
    throw new Error('Symbol file could not be loaded.');
  }

  if (!uri) {
    throw new Error('Symbol file could not be loaded.');
  }

  if (Platform.OS === 'web') {
    try {
      const response = await fetch(uri);
      if (response.ok) return await response.text();
    } catch (err) {
      console.error('Failed to fetch CSV on web:', err);
    }
    throw new Error('Symbol file could not be loaded on web.');
  }

  try {
    const response = await fetch(uri);
    if (response.ok) return response.text();
  } catch {
    // fall through
  }

  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
}

async function parseCsvInChunks(
  text: string,
  parser: (line: string) => CatalogSymbol | null
): Promise<CatalogSymbol[]> {
  const lines = text.split(/\r?\n/);
  const rows: CatalogSymbol[] = [];
  const chunkSize = 4000;

  for (let i = 0; i < lines.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, lines.length);
    for (let j = i; j < end; j++) {
      const row = parser(lines[j]);
      if (row) rows.push(row);
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  return rows;
}

async function loadCatalog(
  moduleId: number,
  parser: (line: string) => CatalogSymbol | null,
  label: string
): Promise<CatalogSymbol[]> {
  const text = await readCsvText(moduleId);
  if (!text.trim()) {
    throw new Error(`${label} symbol file is empty.`);
  }
  const rows = await parseCsvInChunks(text, parser);
  if (rows.length === 0) {
    throw new Error(`No symbols parsed from ${label} file.`);
  }
  return rows;
}

export async function loadNfoSymbols(): Promise<CatalogSymbol[]> {
  if (cachedNfo) return cachedNfo;
  if (!nfoLoadPromise) {
    nfoLoadPromise = loadCatalog(NFO_CSV_MODULE, parseNfoLine, 'NFO')
      .then((rows) => {
        cachedNfo = rows;
        return rows;
      })
      .catch((err) => {
        nfoLoadPromise = null;
        throw err;
      });
  }
  return nfoLoadPromise;
}

export async function loadNseSymbols(): Promise<CatalogSymbol[]> {
  if (cachedNse) return cachedNse;
  if (!nseLoadPromise) {
    nseLoadPromise = loadCatalog(NSE_CSV_MODULE, parseNseLine, 'NSE')
      .then((rows) => {
        cachedNse = rows;
        return rows;
      })
      .catch((err) => {
        nseLoadPromise = null;
        throw err;
      });
  }
  return nseLoadPromise;
}

export function clearCatalogCache() {
  cachedNfo = null;
  cachedNse = null;
  nfoLoadPromise = null;
  nseLoadPromise = null;
}

async function loadCatalogFromPath(
  path: string,
  parser: (line: string) => CatalogSymbol | null,
  label: string
): Promise<CatalogSymbol[]> {
  let text: string;
  try {
    const response = await fetch(path);
    if (response.ok) {
      text = await response.text();
    } else {
      throw new Error(`fetch failed: ${response.status}`);
    }
  } catch (err) {
    if (Platform.OS === 'web') {
      throw new Error(`Failed to load custom ${label} CSV on web: ${err}`);
    }
    text = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
  }
  if (!text.trim()) {
    throw new Error(`${label} CSV is empty.`);
  }
  const rows = await parseCsvInChunks(text, parser);
  if (rows.length === 0) {
    throw new Error(`No symbols parsed from ${label} CSV.`);
  }
  return rows;
}

export async function loadNfoSymbolsFromPath(path: string): Promise<CatalogSymbol[]> {
  const rows = await loadCatalogFromPath(path, parseNfoLine, 'NFO');
  cachedNfo = rows;
  return rows;
}

export async function loadNseSymbolsFromPath(path: string): Promise<CatalogSymbol[]> {
  const rows = await loadCatalogFromPath(path, parseNseLine, 'NSE');
  cachedNse = rows;
  return rows;
}

export function searchSymbols(
  symbols: CatalogSymbol[],
  query: string,
  limit = 50
): CatalogSymbol[] {
  const q = query.trim().toUpperCase();

  if (!q) return [];

  const terms = q
    .split(/\s+/)
    .filter(Boolean);

  const exactMatches: CatalogSymbol[] = [];
  const startsWithMatches: CatalogSymbol[] = [];
  const containsMatches: CatalogSymbol[] = [];

  const seen = new Set<string>();

  for (const row of symbols) {
    const searchable = [
      row.symbol,
      row.tradingSymbol,
      row.expiry,
      row.instrument,
      row.optionType,
      row.strikePrice,
      row.exchange,
    ]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();

    const matched = terms.every((term) =>
      searchable.includes(term)
    );

    if (!matched) continue;

    const key = `${row.exchange}:${row.token}`;

    if (seen.has(key)) continue;

    seen.add(key);

    const symbol = (
      row.symbol || ''
    ).toUpperCase();

    const trading = (
      row.tradingSymbol || ''
    ).toUpperCase();

    const strike = (
      row.strikePrice || ''
    ).toUpperCase();

    const exact =
      symbol === q ||
      trading === q ||
      strike === q;

    const startsWith =
      symbol.startsWith(q) ||
      trading.startsWith(q);

    if (exact) {
      exactMatches.push(row);
    } else if (startsWith) {
      startsWithMatches.push(row);
    } else {
      containsMatches.push(row);
    }

    if (
      exactMatches.length +
        startsWithMatches.length +
        containsMatches.length >=
      limit
    ) {
      break;
    }
  }

  return [
    ...exactMatches,
    ...startsWithMatches,
    ...containsMatches,
  ].slice(0, limit);
}

export function parseExpiry(expiry?: string): Date | null {
  if (!expiry) return null;
  const cleaned = expiry.replace(/[^0-9A-Z]/gi, '').toUpperCase();

  const ddMmmYY = cleaned.match(/^(\d{2})([A-Z]{3})(\d{2,4})$/);
  if (ddMmmYY) {
    const months: Record<string, number> = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
    };
    const day = parseInt(ddMmmYY[1], 10);
    const month = months[ddMmmYY[2]] ?? 0;
    const year = ddMmmYY[3].length === 2 ? 2000 + parseInt(ddMmmYY[3], 10) : parseInt(ddMmmYY[3], 10);
    return new Date(year, month, day);
  }

  const yyyymmdd = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (yyyymmdd) {
    return new Date(parseInt(yyyymmdd[1], 10), parseInt(yyyymmdd[2], 10) - 1, parseInt(yyyymmdd[3], 10));
  }

  return null;
}

function parseExpiryDate(expiry: string): number {
  const d = parseExpiry(expiry);
  return d ? d.getTime() : Infinity;
}

export function searchOptionByStrike(
  symbols: CatalogSymbol[],
  underlying: string,
  strike: string | number,
  optionType: 'CE' | 'PE'
): CatalogSymbol[] {
  const strikeValue = String(strike);

  return symbols
    .filter(
      (row) =>
        row.exchange === 'NFO' &&
        row.symbol
          .toUpperCase()
          .includes(
            underlying.toUpperCase()
          ) &&
        row.optionType?.toUpperCase() ===
          optionType &&
        row.strikePrice === strikeValue
    )
    .sort((a, b) => parseExpiryDate(a.expiry ?? '') - parseExpiryDate(b.expiry ?? ''));
}

/**
 * Parse options queries such as:
 * - NIFTY 25000 CE (with spaces)
 * - NIFTY 25000CE (with some spaces)
 * - NIFTY25000CE (no spaces)
 */
export function parseOptionSearch(
  query: string
):
  | {
      underlying: string;
      strike: string;
      optionType: 'CE' | 'PE';
    }
  | null {
  const q = query.trim().toUpperCase().replace(/\s+/g, '');
  const match = q.match(/^([A-Z]+)(\d+)(CE|PE|C|P)$/);
  if (match) {
    const underlying = match[1];
    const strike = match[2];
    const optType = match[3] === 'C' || match[3] === 'CE' ? 'CE' : 'PE';
    return { underlying, strike, optionType: optType };
  }
  return null;
}

export function formatSymbolLabel(
  row: CatalogSymbol
): string {
  if (row.exchange === 'NFO') {
    return [
      row.symbol,
      row.expiry,
      row.optionType,
      row.strikePrice,
      row.tradingSymbol,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  return [
    row.symbol,
    row.tradingSymbol,
    row.instrument,
  ]
    .filter(Boolean)
    .join(' · ');
}
