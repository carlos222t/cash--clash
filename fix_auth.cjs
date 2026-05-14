const fs = require('fs');
const path = './src/pages/Investments.jsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(
  `auth.getUser().then(({ data }) => {
      if (!data?.user) return;
      profilesApi.getByUserId(data.user.id)`,
  `auth.me().then(me => {
      profilesApi.getByUserId(me.id)`
);
fs.writeFileSync(path, code);
console.log('Done:', code.includes('auth.me()') ? 'FIXED' : 'NOT FOUND');
