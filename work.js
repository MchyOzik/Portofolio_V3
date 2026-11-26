/* ============================================================
   DATA BUKU: tambah buku baru = salin 1 blok { ... } di bawah.
   Rak (layar pertama) dan detail (saat scroll) dibuat otomatis.
   ============================================================ */
const BOOKS = [
  {
    title: "Module MTCNA",
    sub: "MikroTik · Routing & Wireless",
    icon: "fa-network-wired",
    img: "img/mtcna.jpg",
    link: "https://drive.google.com/file/d/1HPAgF8BXjTRK3TUIHDef1jREsG-cnSVe/view?usp=sharing",
    desc: "A practical learning module for MikroTik Certified Network Associate. It walks through the fundamentals of configuring and managing MikroTik routers, from first access to routing and bandwidth control, written as a step-by-step guide for practice and self-study.",
    tags: ["Winbox / SSH / Webfig", "Router Gateway", "DHCP", "Wireless", "Tunnel", "Routing", "Simple Queue"]
  },
  {
    title: "Module Debian 12",
    sub: "Linux Server · Network Services",
    icon: "fa-brands fa-linux",
    img: "img/debian.png",
    link: "https://drive.google.com/file/d/10x9a-lVJXAA-tV856bQFnOKLbJR6QcJi/view?usp=sharing",
    desc: "A hands-on guide to building and administering a Linux server on Debian 12. It covers installation and basic configuration, then moves on to the network and web services commonly used in real server environments.",
    tags: ["Basic Configuration", "DHCP", "DNS Server", "Apache2 / Nginx", "Remote Access", "HAProxy", "CA", "NTP"]
  },
  {
    title: "Module CCNA",
    sub: "Cisco · Switching & Routing",
    icon: "fa-diagram-project",
    img: "img/ccna.png",
    link: "https://drive.google.com/file/d/1EGETz-MRtl9WW_1fngtXspYTBiCL-ZMW/view?usp=drive_link",
    desc: "A learning module on Cisco networking fundamentals. It explains how to configure switches and routers, control traffic, and build resilient networks, with lab-style steps that can be repeated in a simulator.",
    tags: ["Basic Cisco Config", "Switching", "Routing", "Access List", "NAT", "FHRP", "WAN"]
  },
  {
    /* BUKU 4 (BARU): GANTI judul, keterangan, gambar, link, deskripsi, dan tag */
    title: "Module Title Here",
    sub: "Topic · Short Description",
    icon: "fa-shield-halved",
    img: "img/modul4.png",
    link: "GANTI_LINK_GOOGLE_DRIVE_BUKU_4",
    desc: "Write the description of your new module here: what it teaches, who it is for, and what the reader will be able to do after finishing it.",
    tags: ["Topic 1", "Topic 2", "Topic 3"]
  }
];

(function () {
  const shelf = document.getElementById("wkShelf");
  const details = document.getElementById("wkDetails");
  const dots = document.getElementById("wkDots");
  const eyebrow = document.getElementById("wkEyebrow");
  const scrollHint = document.getElementById("wkScroll");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const pad = function (n) { return String(n).padStart(2, "0"); };
  const q = function (s) { return String(s).replace(/"/g, "&quot;"); };

  /* sampul + placeholder (placeholder terlihat kalau gambar belum ada) */
  function art(b) {
    return '<div class="wk-art">' +
      '<div class="wk-ph"><i class="fa-solid ' + b.icon.replace("fa-brands fa-linux", "fa-terminal") + '"></i><span>' + b.img + '</span></div>' +
      '<img src="' + b.img + '" alt="' + q(b.title) + '" loading="lazy" onerror="this.remove()">' +
    '</div>';
  }
  function iconTag(b) {
    return b.icon.indexOf("fa-brands") === 0 ? b.icon : "fa-solid " + b.icon;
  }

  /* ---------- eyebrow ---------- */
  eyebrow.innerHTML = "// BOOKSHELF — <b>" + pad(BOOKS.length) + "</b> MODULES";

  /* ---------- TAHAP 1: rak ---------- */
  shelf.innerHTML = BOOKS.map(function (b, i) {
    return '<a class="wk-item" href="#book-' + (i + 1) + '" style="--i:' + i + '">' +
      '<div class="wk-float"><div class="wk-3d">' + art(b) + '</div></div>' +
      '<div class="wk-stand"></div>' +
      '<div class="wk-meta">' +
        '<span class="wk-no">' + pad(i + 1) + '</span>' +
        '<h3>' + b.title + '</h3>' +
        '<p><i class="' + iconTag(b) + '"></i>' + b.sub + '</p>' +
      '</div>' +
    '</a>';
  }).join("");

  /* ---------- TAHAP 2: detail ---------- */
  details.innerHTML = BOOKS.map(function (b, i) {
    const tags = b.tags.map(function (t) { return "<span>" + t + "</span>"; }).join("");
    const live = b.link.indexOf("GANTI_") !== 0;
    const href = live ? b.link : "#";
    return '<article class="wk-book" id="book-' + (i + 1) + '">' +
      '<a class="wk-cover" href="' + href + '" target="_blank" rel="noopener">' +
        art(b) + '<span class="wk-open"><i class="fa-solid fa-book-open"></i> Open Book</span>' +
      '</a>' +
      '<div class="wk-info">' +
        '<div class="wk-num">' + pad(i + 1) + '</div>' +
        '<div class="wk-label"><i class="' + iconTag(b) + '"></i> MODULE_' + pad(i + 1) + '.pdf</div>' +
        '<h2>' + b.title + '</h2>' +
        '<p>' + b.desc + '</p>' +
        '<div class="wk-tags">' + tags + '</div>' +
        '<a class="wk-btn" href="' + href + '" target="_blank" rel="noopener">Read Module <i class="fa-solid fa-arrow-right"></i></a>' +
      '</div>' +
    '</article>';
  }).join("");

  /* ---------- titik navigasi ---------- */
  dots.innerHTML = '<a href="#shelf" data-t="shelf"><span>Bookshelf</span></a>' +
    BOOKS.map(function (b, i) {
      return '<a href="#book-' + (i + 1) + '" data-t="book-' + (i + 1) + '"><span>' + pad(i + 1) + ' · ' + b.title + '</span></a>';
    }).join("");

  /* ---------- animasi muncul saat scroll ---------- */
  const books = details.querySelectorAll(".wk-book");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.28 });
    books.forEach(function (el) { io.observe(el); });
  } else {
    books.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- titik aktif mengikuti posisi scroll ---------- */
  if ("IntersectionObserver" in window) {
    const dotLinks = dots.querySelectorAll("a");
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        dotLinks.forEach(function (a) { a.classList.toggle("active", a.dataset.t === en.target.id); });
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    spy.observe(document.getElementById("shelf"));
    books.forEach(function (el) { spy.observe(el); });
  }

  /* ---------- petunjuk scroll hilang setelah di-scroll ---------- */
  function onScroll() { scrollHint.classList.toggle("gone", window.scrollY > 80); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- sampul miring mengikuti kursor ---------- */
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    shelf.querySelectorAll(".wk-3d").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(700px) rotateY(" + (x * 18) + "deg) rotateX(" + (-y * 18) + "deg) scale(1.06)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }
})();