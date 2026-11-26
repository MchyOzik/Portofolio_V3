/* Animasi muncul saat di-scroll (dipakai Skills dan My Work) */
(function () {
  const targets = document.querySelectorAll(".sk-card, .ex-card, .wk-book");
  if (!("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(function (el, i) {
    el.classList.add("reveal-ready");
    el.style.transitionDelay = (i % 3) * 80 + "ms";
    io.observe(el);
  });
})();

fgets(buffer, sizeof(buffer), stdin);