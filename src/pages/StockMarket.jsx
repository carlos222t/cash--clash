export default function StockMarket() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wall Street Professional Terminal</title>
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
    
    body { 
      background-color: #050505; 
      color: #e0e0e0; 
      font-family: 'JetBrains+Mono', monospace; 
      overflow: hidden;
    }

    .ticker-green { color: #00ff85; text-shadow: 0 0 8px rgba(0, 255, 133, 0.3); }
    .ticker-red { color: #ff333a; text-shadow: 0 0 8px rgba(255, 51, 58, 0.3); }
    
    .price-flash-up { animation: flashUp 0.5s ease-out; }
    .price-flash-down { animation: flashDown 0.5s ease-out; }

    @keyframes flashUp {
      0% { background-color: rgba(0, 255, 133, 0.2); }
      100% { background-color: transparent; }
    }
    @keyframes flashDown {
      0% { background-color: rgba(255, 51, 58, 0.2); }
      100% { background-color: transparent; }
    }

    .terminal-border { border-color: #1a1a1a; }
    .terminal-header { background-color: #0a0a0a; border-bottom: 2px solid #1a1a1a; }
    
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #050505; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }

    input::placeholder { color: #444; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useMemo } = React;

    // Generates 100 High-Volume Wall Street Stocks
    const RAW_STOCK_DATA = [
      {s:"AAPL", n:"Apple Inc."}, {s:"MSFT", n:"Microsoft Corp."}, {s:"GOOGL", n:"Alphabet Inc."}, {s:"AMZN", n:"Amazon.com Inc."}, {s:"TSLA", n:"Tesla, Inc."},
      {s:"NVDA", n:"NVIDIA Corp."}, {s:"META", n:"Meta Platforms"}, {s:"BRK.B", n:"Berkshire Hathaway"}, {s:"UNH", n:"UnitedHealth Group"}, {s:"V", n:"Visa Inc."},
      {s:"JNJ", n:"Johnson & Johnson"}, {s:"XOM", n:"Exxon Mobil Corp."}, {s:"JPM", n:"JPMorgan Chase"}, {s:"WMT", n:"Walmart Inc."}, {s:"MA", n:"Mastercard Inc."},
      {s:"PG", n:"Procter & Gamble"}, {s:"LLY", n:"Eli Lilly & Co."}, {s:"CVX", n:"Chevron Corp."}, {s:"HD", n:"Home Depot Inc."}, {s:"ABV", n:"AbbVie Inc."},
      {s:"KO", n:"Coca-Cola Co."}, {s:"PEP", n:"PepsiCo Inc."}, {s:"COST", n:"Costco Wholesale"}, {s:"AVGO", n:"Broadcom Inc."}, {s:"ORCL", n:"Oracle Corp."},
      {s:"ADBE", n:"Adobe Inc."}, {s:"CSCO", n:"Cisco Systems"}, {s:"CRM", n:"Salesforce Inc."}, {s:"BAC", n:"Bank of America"}, {s:"ACN", n:"Accenture PLC"},
      {s:"NFLX", n:"Netflix Inc."}, {s:"LIN", n:"Linde PLC"}, {s:"AMD", n:"AMD Inc."}, {s:"TXN", n:"Texas Instruments"}, {s:"PM", n:"Philip Morris"},
      {s:"ABT", n:"Abbott Labs"}, {s:"INTU", n:"Intuit Inc."}, {s:"INTC", n:"Intel Corp."}, {s:"UPS", n:"United Parcel"}, {s:"LOW", n:"Lowe's Companies"},
      {s:"SPGI", n:"S&P Global Inc."}, {s:"IBM", n:"IBM Corp."}, {s:"CAT", n:"Caterpillar Inc."}, {s:"QCOM", n:"Qualcomm Inc."}, {s:"GE", n:"General Electric"},
      {s:"RTX", n:"Raytheon Tech"}, {s:"HON", n:"Honeywell Int."}, {s:"AMAT", n:"Applied Materials"}, {s:"NEE", n:"NextEra Energy"}, {s:"GS", n:"Goldman Sachs"},
      {s:"PLTR", n:"Palantir Tech"}, {s:"DIS", n:"Walt Disney Co."}, {s:"SBUX", n:"Starbucks Corp."}, {s:"BA", n:"Boeing Co."}, {s:"T", n:"AT&T Inc."},
      {s:"PFE", n:"Pfizer Inc."}, {s:"GME", n:"GameStop Corp."}, {s:"AMC", n:"AMC Entertain."}, {s:"COIN", n:"Coinbase Global"}, {s:"UBER", n:"Uber Tech"},
      {s:"SNOW", n:"Snowflake Inc."}, {s:"SHOP", n:"Shopify Inc."}, {s:"SQ", n:"Block Inc."}, {s:"PYPL", n:"PayPal Holdings"}, {s:"ABNB", n:"Airbnb Inc."},
      {s:"DKNG", n:"DraftKings Inc."}, {s:"RIVN", n:"Rivian Auto"}, {s:"LCID", n:"Lucid Group"}, {s:"AAL", n:"American Airlines"}, {s:"UAL", n:"United Airlines"},
      {s:"DAL", n:"Delta Air Lines"}, {s:"MAR", n:"Marriott Int."}, {s:"BKNG", n:"Booking Holdings"}, {s:"MCD", n:"McDonald's Corp."}, {s:"NKE", n:"Nike Inc."},
      {s:"VZ", n:"Verizon Comm."}, {s:"TMUS", n:"T-Mobile US"}, {s:"CMCSA", n:"Comcast Corp."}, {s:"WFC", n:"Wells Fargo"}, {s:"MS", n:"Morgan Stanley"},
      {s:"SCHW", n:"Charles Schwab"}, {s:"C", n:"Citigroup Inc."}, {s:"TMO", n:"Thermo Fisher"}, {s:"DHR", n:"Danaher Corp."}, {s:"ISRG", n:"Intuitive Surg."},
      {s:"MDLZ", n:"Mondelez Int."}, {s:"MO", n:"Altria Group"}, {s:"VRTX", n:"Vertex Pharm."}, {s:"REGN", n:"Regeneron Pharm."}, {s:"ZTS", n:"Zoetis Inc."},
      {s:"NOW", n:"ServiceNow Inc."}, {s:"PANW", n:"Palo Alto Net."}, {s:"SNPS", n:"Synopsys Inc."}, {s:"CDNS", n:"Cadence Design"}, {s:"KLAC", n:"KLA Corp."}
    ];

    function App() {
      const [search, setSearch] = useState("");
      const [stocks, setStocks] = useState([]);

      // Initialize with random realistic data
      useEffect(() => {
        const initial = RAW_STOCK_DATA.map(item => ({
          ...item,
          price: (Math.random() * 500 + 10).toFixed(2),
          change: (Math.random() * 10 - 5).toFixed(2),
          vol: (Math.random() * 10 + 1).toFixed(1) + "M",
          cap: (Math.random() * 2).toFixed(2) + "T",
          dir: Math.random() > 0.5 ? 'up' : 'down'
        }));
        setStocks(initial);

        // Simulate real-time Wall Street volatility
        const interval = setInterval(() => {
          setStocks(prev => prev.map(s => {
            if (Math.random() > 0.8) {
              const move = (Math.random() * 0.5 - 0.25);
              const newPrice = (parseFloat(s.price) + move).toFixed(2);
              return { 
                ...s, 
                price: newPrice, 
                dir: move > 0 ? 'up' : 'down',
                flash: true 
              };
            }
            return { ...s, flash: false };
          }));
        }, 800);

        return () => clearInterval(interval);
      }, []);

      const filteredStocks = useMemo(() => {
        return stocks.filter(s => 
          s.s.toLowerCase().includes(search.toLowerCase()) || 
          s.n.toLowerCase().includes(search.toLowerCase())
        );
      }, [search, stocks]);

      return (
        <div className="flex flex-col h-screen">
          {/* Professional Terminal Header */}
          <header className="terminal-header px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white text-black font-black px-2 py-0.5 text-sm">TERMINAL v2.6</div>
              <h1 className="text-lg font-bold tracking-tighter text-white">
                INSTITUTIONAL EQUITY MONITOR <span className="text-gray-600">| NYSE/NASDAQ</span>
              </h1>
            </div>
            
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">>></span>
              <input 
                autoFocus
                className="bg-[#111] border terminal-border rounded py-2 pl-10 pr-4 w-[400px] text-sm text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                placeholder="TYPE TICKER OR COMPANY NAME..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-6 text-[10px] font-bold text-gray-500">
              <div className="flex flex-col"><span>LATENCY</span><span className="text-emerald-500">0.4ms</span></div>
              <div className="flex flex-col"><span>STATUS</span><span className="text-emerald-500">CONNECTED</span></div>
              <div className="flex flex-col"><span>FEED</span><span className="text-blue-500">REAL-TIME</span></div>
            </div>
          </header>

          {/* Grid Labels */}
          <div className="bg-[#0a0a0a] border-b terminal-border px-6 py-2 grid grid-cols-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <span>Ticker / Company</span>
            <span className="text-right">Market Price</span>
            <span className="text-right">Day Change</span>
            <span className="text-right">Volume (24h)</span>
            <span className="text-right">Market Cap</span>
            <span className="text-right">Action</span>
          </div>

          {/* Data List */}
          <div className="flex-1 overflow-y-auto px-6 py-2">
            {filteredStocks.length > 0 ? filteredStocks.map((stock) => (
              <div 
                key={stock.s} 
                className={\`grid grid-cols-6 py-3 border-b terminal-border items-center transition-all hover:bg-[#111] \${stock.flash ? (stock.dir === 'up' ? 'price-flash-up' : 'price-flash-down') : ''}\`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-wide">{stock.s}</span>
                  <span className="text-[10px] text-gray-600 truncate pr-4">{stock.n}</span>
                </div>
                
                <div className={\`text-right font-bold text-sm \${stock.dir === 'up' ? 'ticker-green' : 'ticker-red'}\`}>
                  {stock.price}
                </div>

                <div className={\`text-right font-bold text-xs \${parseFloat(stock.change) >= 0 ? 'ticker-green' : 'ticker-red'}\`}>
                  {parseFloat(stock.change) > 0 ? '▲' : '▼'} {Math.abs(stock.change)}%
                </div>

                <div className="text-right text-xs font-bold text-gray-400">
                  {stock.vol}
                </div>

                <div className="text-right text-xs font-bold text-gray-500">
                  {stock.cap}
                </div>

                <div className="text-right">
                  <button className="text-[9px] border terminal-border px-2 py-1 hover:bg-white hover:text-black transition-colors font-bold text-gray-500">
                    ANALYZE
                  </button>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-700">
                <span className="text-4xl mb-4 opacity-20">⚠️</span>
                <p className="text-xs font-bold uppercase tracking-widest">No matching instrument found in current scope</p>
              </div>
            )}
          </div>

          {/* Footer Ticker Strip */}
          <footer className="bg-black border-t terminal-border py-1 px-4 flex gap-10 whitespace-nowrap overflow-hidden">
             <div className="animate-marquee flex gap-10">
                {stocks.slice(0, 20).map(s => (
                  <div key={s.s} className="text-[10px] font-bold">
                    <span className="text-gray-500">{s.s}</span> <span className={s.dir === 'up' ? 'text-emerald-500' : 'text-red-500'}>{s.price}</span>
                  </div>
                ))}
             </div>
          </footer>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>

  <style>
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      display: flex;
      animation: marquee 30s linear infinite;
    }
  </style>
</body>
</html>`;

  return (
    <iframe
      srcDoc={html}
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="Wall Street Data Terminal"
    />
  );
}