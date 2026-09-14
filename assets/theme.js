/* Runs before the stylesheet: applies the saved appearance choice, else the device setting. */
(function () {
  try {
    var s = localStorage.getItem('proteus-theme');
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = (s === 'dark' || s === 'light') ? s : (d ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
