# Code Review Graph — Paper Trading App

## 1. Module Dependency Graph

```mermaid
graph TD
  subgraph Entry
    index["index.ts"] --> App["App.tsx"]
    index --> devWarnings["src/setup/devWarnings.ts"]
  end

  subgraph Screens
    App --> WS["WatchlistScreen"]
    App --> PS["PositionsScreen"]
    App --> PF["PortfolioScreen"]
    LS["LoginScreen (orphaned)"]
  end

  subgraph Context
    App --> PTC["PaperTradingContext"]
    LS --> AC["AuthContext (orphaned)"]
    WS --> PTC
    PS --> PTC
    PF --> PTC
  end

  subgraph Hooks
    WS --> useW["useWatchlist"]
    WS --> useS["useStrategy"]
  end

  subgraph Components
    WS --> ChartModal
    WS --> WatchlistCard
    WS --> WatchlistFormModal
    WS --> ConfirmDialog
    WS --> MessageBox
    PS --> PositionCard
    PS --> SellOrderModal
    LS --> MessageBox
  end

  subgraph Utils
    PTC --> storage
    PTC --> positions
    useW --> api
    useS --> storage
    WS --> tradingView
    WS --> api
    WatchlistFormModal --> symbolCatalog
    symbolCatalog --> NFO_csv["NFO_symbols.txt.csv"]
    symbolCatalog --> NSE_csv["NSE_symbols.txt.csv"]
    AC --> api
  end

  subgraph Types
    types["types/index.ts"]
    storage --> types
    positions --> types
    ChartModal --> types
    WatchlistCard --> types
    WatchlistFormModal --> types
    PositionCard --> types
    SellOrderModal --> types
    useW --> types
    useS --> types
    tradingView --> types
  end

  subgraph Theme
    colors["theme/colors.ts"]
    ChartModal --> colors
    WatchlistCard --> colors
    WatchlistFormModal --> colors
    ConfirmDialog --> colors
    MessageBox --> colors
    PositionCard --> colors
    SellOrderModal --> colors
    WS --> colors
    PS --> colors
    PF --> colors
    LS --> colors
  end

  style LS fill:#faa,stroke:#f00,stroke-dasharray:5
  style AC fill:#faa,stroke:#f00,stroke-dasharray:5
  style PriceChart fill:#faa,stroke:#f00,stroke-dasharray:5
```

## 2. Component Tree

```mermaid
graph TD
  App --> PaperTradingProvider
  PaperTradingProvider --> NavigationContainer
  NavigationContainer --> TabNav["Tab Navigator"]
  TabNav -->|Watchlist| WatchlistScreen
  TabNav -->|Positions| PositionsScreen
  TabNav -->|Portfolio| PortfolioScreen

  WatchlistScreen --> WatchlistCard["WatchlistCard (FlatList item)"]
  WatchlistScreen --> WatchlistFormModal
  WatchlistScreen --> ChartModal
  WatchlistScreen --> ConfirmDialog
  WatchlistScreen --> MessageBox

  PositionsScreen --> PositionCard["PositionCard (FlatList item)"]
  PositionsScreen --> SellOrderModal

  PortfolioScreen --> TradeRow["Trade Row (inline, FlatList item)"]
```

## 3. Data Flow

```mermaid
graph LR
  subgraph External
    API["Backend API\nlocalhost:8001"]
  end

  subgraph State
    PTC["PaperTradingContext\n{ trades, balance, positions,\nportfolioValue }"]
    AC["AuthContext (orphaned)\n{ logged_in, user_id }"]
    useW["useWatchlist hook\n{ items, loading, add/remove }"]
    useS["useStrategy hook\n{ config }"]
  end

  subgraph Persistence
    AsyncStorage["@react-native-async-storage\n/watchlist, /trades,\n/strategy, /balance"]
  end

  API -->|fetch| useW
  API -->|fetch| AC
  PTC <-->|load/save| AsyncStorage
  useS <-->|load/save| AsyncStorage
  useW -->|refresh| API
```

## 4. File Responsibility Map

| Layer | File | Role |
|-------|------|------|
| **Entry** | `index.ts` | Registers root component |
| **Root** | `App.tsx` | Navigation shell, 3 tabs, dark theme |
| **Screens** | `WatchlistScreen.tsx` | Watchlist CRUD + buy/sell + TradingView |
| | `PositionsScreen.tsx` | List open positions, sell flow |
| | `PortfolioScreen.tsx` | Portfolio summary + trade history |
| | `LoginScreen.tsx` | **Orphaned** — not wired into navigation |
| **Context** | `PaperTradingContext.tsx` | Global trades, balance, positions state |
| | `AuthContext.tsx` | **Orphaned** — providers not used in App |
| **Hooks** | `useWatchlist.ts` | Watchlist API CRUD + option symbol parsing |
| | `useStrategy.ts` | EMA strategy config from AsyncStorage |
| **Shared UI** | `WatchlistCard.tsx` | Watchlist row with signal badge |
| | `WatchlistFormModal.tsx` | Symbol search modal (NSE + NFO) |
| | `ChartModal.tsx` | Buy/sell bottom sheet |
| | `PositionCard.tsx` | Position summary card |
| | `SellOrderModal.tsx` | Sell order bottom sheet |
| | `ConfirmDialog.tsx` | Generic confirmation dialog |
| | `MessageBox.tsx` | Alert/toast components |
| | `PriceChart.tsx` | **Orphaned** — SVG chart, not used anywhere |
| **Utils** | `api.ts` | HTTP client (localhost:8001) |
| | `storage.ts` | AsyncStorage read/write helpers |
| | `positions.ts` | `computePositions`, `getHeldQuantity` |
| | `tradingView.ts` | TradingView URL builder |
| | `symbolCatalog.ts` | NSE/NFO CSV symbol loader + search |
| **Foundation** | `types/index.ts` | All interfaces (PaperTrade, Position, etc.) |
| | `theme/colors.ts` | Dark theme palette, spacing, radius |
| | `setup/devWarnings.ts` | LogBox suppression |

## 5. Issues Found

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | High | **`LoginScreen` and `AuthContext` are orphaned** — defined but never used in `App.tsx`. No auth flow is active. | `LoginScreen.tsx`, `AuthContext.tsx` |
| 2 | High | **`PriceChart` is orphaned** — defined and exported, but no screen imports it. Chart data types exist but are dead code. | `PriceChart.tsx` |
| 3 | High | **All prices hardcoded to `0`** — `executeTrade` uses `const price = 0`, and `computePositions` uses `const currentPrice = 0`. All monetary displays are decorative. | `PaperTradingContext.tsx:91`, `positions.ts:31` |
| 4 | Medium | **No linting/formatting** — zero ESLint, Prettier, Husky, or CI configuration. Only TypeScript strict mode is enabled. | (entire project) |
| 5 | Medium | **No testing** — no Jest, no test files, no testing dependencies. | (entire project) |
| 6 | Medium | **Unused `onTokenExpired` handler gap** — `setTokenExpiredHandler` is called in `WatchlistScreen` but `LoginScreen`/`AuthContext` are not wired to re-authenticate. | `WatchlistScreen.tsx:75` |
| 7 | Low | **`package-lock.json` is gitignored** — `.gitignore` lists it but it's already tracked, so the rule is ineffective. | `.gitignore` |

## 6. Key Architectural Notes

- **State flows one way**: `PaperTradingContext` → Screens → Components. No child-to-parent back-propagation.
- **Two persistence backends**: watchlist data lives on the remote API; trades/balance/strategy live in AsyncStorage.
- **No live price feed**: Price is `0` everywhere. The app is a UI skeleton without market data integration.
- **CSV files are bundled**: `NFO_symbols.txt.csv` and `NSE_symbols.txt.csv` (~100KB+) are loaded via `expo-asset` at runtime.
