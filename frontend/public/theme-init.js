// Applies the saved theme before React mounts, so a dark-mode user never sees a white
// flash. A file rather than an inline script in index.html: the deployed site's content
// security policy allows scripts from its own origin only, and an inline one would need a
// hash kept in step with its every edit. Loaded without async or defer on purpose, so it
// runs before the first paint.
(function () {
  try {
    var s = localStorage.getItem('vitalpair-theme');
    var dark = s ? s === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
