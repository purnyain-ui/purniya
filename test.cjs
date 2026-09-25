const fetch = require('node-fetch'); // wait node 18 has fetch

fetch('https://www.instagram.com/p/DB1Wc7GtzfK/', { 
  headers: { 
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' 
  } 
})
.then(r=>r.text())
.then(html => { 
  const m = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i); 
  console.log(m ? m[1] : 'NOT FOUND'); 
});
