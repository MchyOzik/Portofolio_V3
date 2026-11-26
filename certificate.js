/* ============================================================
   DATA SERTIFIKAT: tambah sertifikat baru = tambah 1 blok { ... }
   cat: "net" | "cyber" | "sys" | "event"
   img: nama file gambar di folder img/
   link: link Google Drive (isi "#" kalau belum ada)
   badge: (opsional) teks lencana merah di pojok gambar
   ============================================================ */
const LINK = {
  aguna:    "https://drive.google.com/drive/folders/1N0KKXHHVSIKKyc-HjS8yXp3NV0Mky7jD?usp=sharing",
  idn:      "https://drive.google.com/drive/folders/1WgwoiKJE4fBrPT8LMy0ZPJZud5hjC3p5?usp=sharing",
  netacad:  "https://drive.google.com/drive/folders/1VCSZ0oaQWlZnJz4CMo64zatz06RnAD0T?usp=sharing",
  redhat:   "https://drive.google.com/drive/folders/1qw3vd1PT4HgkThjsGv1n9BwiKtLhnSd5?usp=sharing",
  fortinet: "https://drive.google.com/drive/folders/1rumTHtjGWM2UxDVO8bqT3FBmhHqpP4nw?usp=sharing"
};

const CERTS = [
  {
    title: "Finalist JCC 2026 | Junior Cyber Security",
    issuer: "JCC 2026", cat: "event", badge: "FINALIST",
    img: "img/jcc.jpg", link: "#",
    desc: "Reached the finals of the Junior Cyber Security competition (JCC 2026), solving security challenges against other participants.",
    tags: ["CTF", "Competition", "Cyber Security"]
  },
  {
    title: "CCNA: Introduction to Networks",
    issuer: "Cisco Networking Academy (Netacad)", cat: "net",
    img: "img/Netacad.jpg", link: LINK.netacad,
    desc: "Covers how networks work: IP addressing, Ethernet, network devices, and basic configuration of Cisco routers and switches.",
    tags: ["Cisco", "IP Addressing", "Switching", "Routing"]
  },
  {
    title: "FCF - Technical Introduction to Cybersecurity 1.0",
    issuer: "Fortinet", cat: "cyber",
    img: "img/F1.jpg", link: LINK.fortinet,
    desc: "Introduces the technical side of cybersecurity, including core network security concepts and the technologies used to protect systems.",
    tags: ["Fortinet", "Network Security", "Fundamentals"]
  },
  {
    title: "FCF - Introduction to the Threat Landscape 2.0",
    issuer: "Fortinet", cat: "cyber",
    img: "img/F1.jpg", link: LINK.fortinet,
    desc: "Explains today's cyber threat landscape: common attack types, threat actors, and how attackers think and operate.",
    tags: ["Fortinet", "Threats", "Attack Types"]
  },
  {
    title: "FCF - Getting Started in Cybersecurity 2.0",
    issuer: "Fortinet", cat: "cyber",
    img: "img/F1.jpg", link: LINK.fortinet,
    desc: "A starting point for the cybersecurity field: key concepts, why security matters, and the roles people play in defending organizations.",
    tags: ["Fortinet", "Basics", "Career Path"]
  },
  {
    title: "Cyber Shield",
    issuer: "IDwebhost", cat: "cyber",
    img: "img/cybershield.jpg", link: "#",
    desc: "Cyber security program from IDwebhost focused on awareness and basic defense against online threats.",
    tags: ["IDwebhost", "Awareness", "Cyber Security"]
  },
  {
    title: "CYBERFRONTIER | Event",
    issuer: "CYBERFRONTIER", cat: "event",
    img: "img/cyberfrontier.jpg", link: "#",
    desc: "Participation certificate from the CYBERFRONTIER cyber security event.",
    tags: ["Event", "Cyber Security"]
  },
  {
    title: "COMFEST 16",
    issuer: "COMFEST 16", cat: "event",
    img: "img/comfest.jpg", link: "#",
    desc: "Participation certificate from COMFEST 16, a technology and communication festival.",
    tags: ["Event", "Festival"]
  },
  {
    title: "Network Fundamental",
    issuer: "Aguna Course", cat: "net",
    img: "img/Network.jpg", link: LINK.aguna,
    desc: "Builds the foundation of computer networking: network models, IP addressing, and how common network devices work together.",
    tags: ["Aguna", "OSI / TCP-IP", "IP Addressing"]
  },
  {
    title: "Network Simulation using PNETLab",
    issuer: "Aguna Course", cat: "net",
    img: "img/Network.jpg", link: LINK.aguna,
    desc: "Hands-on practice designing and testing network topologies inside PNETLab, without needing physical devices.",
    tags: ["Aguna", "PNETLab", "Lab", "Topology"]
  },
  {
    title: "IDN Academy Goes to School - Network Training",
    issuer: "ID-Networkers", cat: "net",
    img: "img/IDN.png", link: LINK.idn,
    desc: "Network training delivered by ID-Networkers (IDN Academy) at school, covering practical networking skills.",
    tags: ["IDN", "Network Training", "MikroTik"]
  },
  {
    title: "Linux Fundamental",
    issuer: "Aguna Course", cat: "sys",
    img: "img/Network.jpg", link: LINK.aguna,
    desc: "Introduces Linux from the command line: the file system, users and permissions, and everyday administration tasks.",
    tags: ["Aguna", "Linux", "CLI", "Permissions"]
  },
  {
    title: "Virtual Machine",
    issuer: "Aguna Course", cat: "sys",
    img: "img/Network.jpg", link: LINK.aguna,
    desc: "Teaches how to create and manage virtual machines for safe, repeatable practice with servers and operating systems.",
    tags: ["Aguna", "Virtualization", "VirtualBox / VMware"]
  },
  {
    title: "Python Fundamental",
    issuer: "Aguna Course", cat: "sys",
    img: "img/Network.jpg", link: LINK.aguna,
    desc: "Covers Python basics: syntax, variables, control flow, and functions, as a base for scripting and automation.",
    tags: ["Aguna", "Python", "Scripting"]
  },
  {
    title: "Red Hat 104",
    issuer: "Red Hat", cat: "sys",
    img: "img/Redhat.jpg", link: LINK.redhat,
    desc: "Red Hat training on working with Linux systems in an enterprise-style environment.",
    tags: ["Red Hat", "Linux", "System Administration"]
  }
];

const CATS = {
  net:   { label: "Networking",     icon: "fa-network-wired" },
  cyber: { label: "Cyber Security", icon: "fa-shield-halved" },
  sys:   { label: "Linux & Dev",    icon: "fa-terminal" },
  event: { label: "Competition & Event", icon: "fa-trophy" }
};

(function () {
  const grid = document.getElementById("ctGrid");
  const search = document.getElementById("ctSearch");
  const clearBtn = document.getElementById("ctClear");
  const filterBox = document.getElementById("ctFilter");
  const countEl = document.getElementById("ctCount");
  const emptyEl = document.getElementById("ctEmpty");
  const lb = document.getElementById("ctLightbox");
  const lbImg = document.getElementById("ctLbImg");
  const lbCap = document.getElementById("ctLbCap");

  let activeCat = "all";

  /* ----- tombol filter + jumlah ----- */
  function buildFilters() {
    const items = [["all", "All", CERTS.length]];
    Object.keys(CATS).forEach(function (k) {
      items.push([k, CATS[k].label, CERTS.filter(function (c) { return c.cat === k; }).length]);
    });
    filterBox.innerHTML = items.map(function (it) {
      return '<button data-cat="' + it[0] + '" class="' + (it[0] === activeCat ? "active" : "") + '">' +
             it[1] + '<span>' + it[2] + '</span></button>';
    }).join("");
  }

  /* ----- kartu ----- */
  function cardHTML(c, i) {
    const cat = CATS[c.cat];
    const badge = c.badge ? '<span class="ct-badge"><i class="fa-solid fa-trophy"></i> ' + c.badge + '</span>' : "";
    const tags = c.tags.map(function (t) { return "<span>" + t + "</span>"; }).join("");
    const btnText = c.link === "#" ? "Link coming soon" : 'View Certificate <i class="fa-solid fa-arrow-up-right-from-square"></i>';
    return '' +
      '<article class="ct-card" style="animation-delay:' + (i % 6) * 60 + 'ms">' +
        '<div class="ct-img" data-title="' + c.title.replace(/"/g, "&quot;") + '">' +
          '<div class="ct-ph"><i class="fa-solid ' + cat.icon + '"></i><span>' + c.img + '</span></div>' +
          '<img src="' + c.img + '" alt="' + c.title.replace(/"/g, "&quot;") + '" loading="lazy" ' +
            'onerror="this.parentNode.classList.add(\'noimg\');this.remove();">' +
          '<span class="ct-issuer">' + c.issuer.split(" (")[0] + '</span>' + badge +
          '<span class="ct-zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></span>' +
        '</div>' +
        '<div class="ct-body">' +
          '<div class="ct-cat"><i class="fa-solid ' + cat.icon + '"></i> ' + cat.label.toUpperCase() + '</div>' +
          '<h3>' + c.title + '</h3>' +
          '<p class="ct-by">Issued by <b>' + c.issuer + '</b></p>' +
          '<p class="ct-desc">' + c.desc + '</p>' +
          '<div class="ct-tags">' + tags + '</div>' +
          '<a class="ct-btn" href="' + c.link + '" target="_blank" rel="noopener">' + btnText + '</a>' +
        '</div>' +
      '</article>';
  }

  /* ----- tampilkan sesuai pencarian + kategori ----- */
  function render() {
    const q = search.value.trim().toLowerCase();
    const list = CERTS.filter(function (c) {
      if (activeCat !== "all" && c.cat !== activeCat) return false;
      if (!q) return true;
      const hay = (c.title + " " + c.issuer + " " + c.desc + " " + c.tags.join(" ") + " " + CATS[c.cat].label).toLowerCase();
      return q.split(/\s+/).every(function (word) { return hay.indexOf(word) !== -1; });
    });

    grid.innerHTML = list.map(cardHTML).join("");
    emptyEl.hidden = list.length > 0;
    clearBtn.hidden = q === "";
    countEl.innerHTML = "SHOWING <b>" + list.length + "</b> OF " + CERTS.length + " CERTIFICATES";
  }

  filterBox.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    activeCat = btn.dataset.cat;
    buildFilters();
    render();
  });

  search.addEventListener("input", render);
  clearBtn.addEventListener("click", function () { search.value = ""; render(); search.focus(); });

  /* ----- preview gambar ----- */
  grid.addEventListener("click", function (e) {
    const box = e.target.closest(".ct-img");
    if (!box || box.classList.contains("noimg")) return;
    const img = box.querySelector("img");
    if (!img) return;
    lbImg.src = img.src;
    lbImg.alt = box.dataset.title;
    lbCap.textContent = box.dataset.title;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  });

  function closeLb() { lb.hidden = true; lbImg.src = ""; document.body.style.overflow = ""; }
  document.getElementById("ctLbClose").addEventListener("click", closeLb);
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });

  /* ----- keyboard: "/" fokus cari, Esc tutup / hapus ----- */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!lb.hidden) closeLb();
      else if (search.value) { search.value = ""; render(); }
    }
    if (e.key === "/" && document.activeElement !== search) {
      e.preventDefault();
      search.focus();
    }
  });

  buildFilters();
  render();
})();