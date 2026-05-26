import type { TradingViewChartData } from '../types';

const CHART_THEME = {
  background: '#1A2238',
  text: '#94A3B8',
  grid: '#2A3555',
  border: '#2A3555',
  up: '#34D399',
  down: '#F87171',
  fastEma: '#F472B6',
  slowEma: '#A78BFA',
};

function escapeJson(data: TradingViewChartData): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}

/* -------------------------------------------------- */
/* Lightweight Charts */
/* -------------------------------------------------- */

export function buildLightweightChartsHtml(
  data: TradingViewChartData,
): string {

  const payload = escapeJson(data);
  const theme = JSON.stringify(CHART_THEME);

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
/>

<style>
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

html,
body{
  width:100%;
  height:100%;
  overflow:hidden;
  background:${CHART_THEME.background};
}

#chart{
  width:100vw;
  height:100vh;
}
</style>

<script src="https://unpkg.com/lightweight-charts@4.2.2/dist/lightweight-charts.standalone.production.js"></script>

</head>

<body>

<div id="chart"></div>

<script>

(function () {

  const data = ${payload};

  const theme = ${theme};

  const container =
    document.getElementById('chart');

  function sendMessage(type, payload) {

    if (window.ReactNativeWebView) {

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type,
          ...payload
        })
      );
    }
  }

  try {

    const chart =
      LightweightCharts.createChart(container, {

        width: window.innerWidth,

        height: window.innerHeight,

        layout: {
          background: {
            type: 'solid',
            color: theme.background
          },

          textColor: theme.text,
        },

        grid: {
          vertLines: {
            color: theme.grid
          },

          horzLines: {
            color: theme.grid
          },
        },

        rightPriceScale: {
          borderColor: theme.border
        },

        timeScale: {
          borderColor: theme.border,
          timeVisible: true,
        },
      });

    const candleSeries =
      chart.addCandlestickSeries({

        upColor: theme.up,

        downColor: theme.down,

        borderVisible: false,

        wickUpColor: theme.up,

        wickDownColor: theme.down,
      });

    candleSeries.setData(data.candles);

    const fastSeries =
      chart.addLineSeries({

        color: theme.fastEma,

        lineWidth: 2,
      });

    fastSeries.setData(data.fastEma);

    const slowSeries =
      chart.addLineSeries({

        color: theme.slowEma,

        lineWidth: 2,
      });

    slowSeries.setData(data.slowEma);

    chart.timeScale().fitContent();

    window.addEventListener('resize', () => {

      chart.applyOptions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

    });

    sendMessage('ready', {});

  } catch (error) {

    document.body.innerHTML = \`
      <div
        style="
          color:white;
          padding:20px;
          font-family:sans-serif;
        "
      >
        Chart Error
        <br/><br/>
        \${error.message}
      </div>
    \`;

    sendMessage('error', {
      message: error.message
    });
  }

})();
</script>

</body>
</html>
`;
}

/* -------------------------------------------------- */
/* TradingView Widget */
/* -------------------------------------------------- */

export function buildTradingViewWidgetHtml(
  tvSymbol: string,
): string {

  return `
<!DOCTYPE html>
<html>

<head>

<meta charset="utf-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
/>

<style>

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

html,
body{
  width:100%;
  height:100%;
  overflow:hidden;
  background:#12182A;
}

#tradingview_chart{
  width:100vw;
  height:100vh;
}

</style>

</head>

<body>

<div id="tradingview_chart"></div>

<script>

(function () {

  function sendMessage(type, payload) {

    if (window.ReactNativeWebView) {

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type,
          ...payload
        })
      );
    }
  }

  function loadScript(src) {

    return new Promise(function(resolve, reject) {

      if (window.TradingView) {
        resolve(true);
        return;
      }

      const script =
        document.createElement('script');

      script.src = src;

      script.async = true;

      script.onload = resolve;

      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  async function init() {

    try {

      await loadScript(
        'https://s3.tradingview.com/tv.js'
      );

      if (!window.TradingView) {
        throw new Error(
          'TradingView library not loaded'
        );
      }

      new TradingView.widget({

        autosize: true,

        symbol: '${tvSymbol}',

        interval: 'D',

        timezone: 'Asia/Kolkata',

        theme: 'dark',

        style: '1',

        locale: 'en',

        toolbar_bg: '#12182A',

        enable_publishing: false,

        hide_side_toolbar: false,

        allow_symbol_change: true,

        details: true,

        hotlist: false,

        calendar: false,

        studies: [
          'EMA@tv-basicstudies'
        ],

        container_id: 'tradingview_chart',
      });

      sendMessage('ready', {
        symbol: '${tvSymbol}'
      });

    } catch (error) {

      document.body.innerHTML = \`
        <div
          style="
            color:white;
            padding:20px;
            font-size:16px;
            font-family:sans-serif;
          "
        >
          TradingView Failed
          <br/><br/>
          \${error.message}
        </div>
      \`;

      sendMessage('error', {
        message: error.message
      });
    }
  }

  window.addEventListener('load', () => {
    setTimeout(init, 500);
  });

})();
</script>

</body>
</html>
`;
}