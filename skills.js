/* Filter kategori skill */
(function () {
  const buttons = document.querySelectorAll("#skFilter button");
  const cards = document.querySelectorAll(".sk-card");

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      buttons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      const f = btn.dataset.filter;
      cards.forEach(function (card) {
        const show = f === "all" || card.dataset.cat === f;
        card.classList.toggle("hide", !show);
      });
    });
  });
})();