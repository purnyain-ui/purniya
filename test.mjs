const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.instagram.com/p/DB1Wc7GtzfK/embed/');
fetch(url)
  .then(r => r.json())
  .then(data => {
    const html = data.contents;
    const m = html.match(/<img class="EmbeddedMediaImage"[^>]+src="([^"]+)"/i);
    console.log(m ? m[1] : 'NOT FOUND');
  });
