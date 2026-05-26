import React, { useMemo } from 'react';

import {
  Platform,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';

import { WebView } from 'react-native-webview';

type Props = {
  symbol: string;
  strategy?: any;
  height?: number;
};

function normalizeSymbol(symbol: string) {

  if (!symbol) {
    return 'NSE:RELIANCE';
  }

  if (symbol.includes(':')) {
    return symbol;
  }

  return `NSE:${symbol}`;
}

function buildTradingViewHTML(symbol: string) {

  return `
<!DOCTYPE html>
<html>

<head>

<meta charset="utf-8"/>

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
/>

<style>

html,
body{
  margin:0;
  padding:0;
  width:100%;
  height:100%;
  overflow:hidden;
  background:#121826;
}

#tradingview_chart{
  width:100vw;
  height:100vh;
}

.loader{
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%, -50%);
  color:white;
  font-family:sans-serif;
}

</style>

</head>

<body>

<div class="loader">
  Loading chart...
</div>

<div id="tradingview_chart"></div>

<script>

(function () {

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

      const loader =
        document.querySelector('.loader');

      if (loader) {
        loader.style.display = 'none';
      }

      new TradingView.widget({

        autosize: true,

        symbol: '${symbol}',

        interval: '15',

        timezone: 'Asia/Kolkata',

        theme: 'dark',

        style: '1',

        locale: 'en',

        toolbar_bg: '#121826',

        enable_publishing: false,

        allow_symbol_change: false,

        hide_side_toolbar: false,

        withdateranges: true,

        details: false,

        hotlist: false,

        calendar: false,

        container_id: 'tradingview_chart',
      });

    } catch (error) {

      document.body.innerHTML = \`
        <div
          style="
            color:white;
            padding:20px;
            font-family:sans-serif;
          "
        >
          TradingView Error
          <br/><br/>
          \${error.message}
        </div>
      \`;
    }
  }

  window.addEventListener('load', function () {
    setTimeout(init, 300);
  });

})();
</script>

</body>
</html>
`;
}

export const TradingViewChart = ({
  symbol,
  height = 320,
}: Props) => {

  const tradingViewSymbol = useMemo(() => {
    return normalizeSymbol(symbol);
  }, [symbol]);

  const html = useMemo(() => {
    return buildTradingViewHTML(
      tradingViewSymbol
    );
  }, [tradingViewSymbol]);

  // WEB FIX
  if (Platform.OS === 'web') {

    return (
      <View
        style={[
          styles.container,
          { height }
        ]}
      >
        <iframe
          srcDoc={html}
          title={tradingViewSymbol}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </View>
    );
  }

  // MOBILE
  return (
    <View
      style={[
        styles.container,
        { height }
      ]}
    >

      <WebView
        originWhitelist={['*']}

        source={{ html }}

        javaScriptEnabled={true}

        domStorageEnabled={true}

        mixedContentMode="always"

        allowFileAccess={true}

        allowUniversalAccessFromFileURLs={true}

        cacheEnabled={false}

        startInLoadingState={true}

        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator
              size="large"
              color="#ffffff"
            />
          </View>
        )}

        style={styles.webview}
      />

    </View>
  );
};

const styles = StyleSheet.create({

  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#121826',
  },

  webview: {
    flex: 1,
    backgroundColor: '#121826',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121826',
  },

});