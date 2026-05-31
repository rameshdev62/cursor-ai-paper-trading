import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

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
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) {
    throw new Error('Symbol file could not be loaded.');
  }

  if (uri.startsWith('http') || uri.startsWith('/')) {
    try {
      const response = await fetch(uri);
      if (response.ok) return response.text();
    } catch {
      // fall through
    }
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

export async function preloadSymbolCatalogs(): Promise<void> {
  await Promise.all([loadNfoSymbols(), loadNseSymbols()]);
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

/**
 * Search specific option strikes
 *
 * Examples:
 * searchOptionByStrike(data,"NIFTY",25000,"CE")
 * searchOptionByStrike(data,"NIFTY",25000,"PE")
 */
export function searchOptionByStrike(
  symbols: CatalogSymbol[],
  underlying: string,
  strike: string | number,
  optionType: 'CE' | 'PE'
): CatalogSymbol[] {
  const strikeValue = String(strike);

  return symbols.filter(
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
  );
}

/**
 * Parse:
 * NIFTY 25000 CE
 * NIFTY 25000 PE
 * BANKNIFTY 56000 CE
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
  const parts = query
    .trim()
    .toUpperCase()
    .split(/\s+/);

  if (parts.length !== 3) {
    return null;
  }

  const [underlying, strike, type] =
    parts;

  if (
    type !== 'CE' &&
    type !== 'PE'
  ) {
    return null;
  }

  return {
    underlying,
    strike,
    optionType: type,
  };
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
