const fs = require('fs');
const path = 'src/App.jsx';
let c = fs.readFileSync(path, 'utf8');

// Add import
if (!c.includes('DayTrading')) {
  c = c.replace(
    `import StockMarket from './pages/StockMarket';`,
    `import StockMarket from './pages/StockMarket';\nimport DayTrading from './pages/DayTrading';`
  );

  // Add route
  c = c.replace(
    `<Route path="/StockMarket" element={<StockMarket />} />`,
    `<Route path="/StockMarket" element={<StockMarket />} />\n          <Route path="/DayTrading" element={<DayTrading />} />`
  );

  fs.writeFileSync(path, c);
  console.log('✓ Route added to App.jsx');
} else {
  console.log('Already added');
}
