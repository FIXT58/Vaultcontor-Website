/* =====================================================================
   Vaultcontor · Website · gemeinsames Skript für alle Seiten
   Jeder Baustein prüft zuerst, ob er auf der aktuellen Seite vorkommt.
   ===================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var mx = 0, my = 0;

  function $(id) { return document.getElementById(id); }
  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  /* ---------- Kopfzeile und Menü ---------- */
  var top = $("top");
  var nav = $("pnav");
  var menuBtn = $("menuBtn");

  function closeMenu() {
    if (!nav || !menuBtn) return;
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Menü öffnen");
  }

  if (nav && menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !nav.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
    });
  }

  /* ---------- Heatmaps (fester Startwert, damit sie bei jedem Laden gleich aussehen) ---------- */
  function rng(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }
  var stufen = ["var(--h0)", "var(--h1)", "var(--h2)", "var(--h3)", "var(--h4)"];
  function heat(el, cols, rows, seed) {
    if (!el) return;
    var r = rng(seed), html = "";
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var wochenende = y >= 5, v = r();
        var lvl = wochenende ? (v > .85 ? 1 : 0) : (v < .12 ? 0 : v < .35 ? 1 : v < .62 ? 2 : v < .86 ? 3 : 4);
        html += '<i style="background:' + stufen[lvl] + ';grid-area:' + (y + 1) + "/" + (x + 1) + '"></i>';
      }
    }
    el.innerHTML = html;
  }
  heat($("heatBig"), 30, 7, 7);
  heat($("heatSm"), 26, 7, 42);

  /* ---------- Laufband verdoppeln für nahtlose Schleife ---------- */
  var mq = $("mq");
  if (mq) {
    var n = mq.children.length;
    mq.innerHTML += mq.innerHTML;
    Array.prototype.forEach.call(mq.children, function (c, i) {
      if (i >= n) c.setAttribute("aria-hidden", "true");
    });
  }

  /* ---------- Dashboard-Ansicht skalieren und beim Scrollen aufrichten ---------- */
  var screen = $("screen"), screenIn = $("screenIn"), mk = $("mk");
  function fit() {
    if (!screenIn || !mk) return;
    var s = screenIn.clientWidth / 1280;
    mk.style.transform = "scale(" + s + ")";
    screenIn.style.height = (780 * s) + "px";
  }
  if (screenIn && mk) {
    fit();
    window.addEventListener("resize", fit);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (top) top.classList.toggle("scrolled", window.scrollY > 20);
      if (screen && !reduce) {
        var r = screen.getBoundingClientRect(), vh = window.innerHeight;
        var p = Math.min(1, Math.max(0, (vh - r.top) / (vh * .85)));
        var e = 1 - Math.pow(1 - p, 3);
        screen.style.transform = "rotateX(" + (22 * (1 - e)).toFixed(2) + "deg) scale(" + (.94 + .06 * e).toFixed(4) + ")";
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Einblenden beim Scrollen ---------- */
  var reveal = all(".rv, #setup");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    reveal.forEach(function (el) { io.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 3D-Neigen der Kacheln und Pakete ---------- */
  if (fine && !reduce) {
    all("[data-tilt]").forEach(function (el) {
      var max = el.classList.contains("plan") ? 7 : 5;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", (x * 100) + "%");
        el.style.setProperty("--my", (y * 100) + "%");
        el.style.transition = "transform .12s ease-out, box-shadow .4s";
        el.style.transform = "perspective(1000px) rotateX(" + ((.5 - y) * max).toFixed(2) + "deg) rotateY(" + ((x - .5) * max).toFixed(2) + "deg) translateY(-4px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "";
        el.style.transform = "";
      });
    });
  }

  /* ---------- Reiter "Im Detail" (Funktionen) ---------- */
  var tabs = all('[role="tab"]');
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (o) {
        var on = o === t;
        o.setAttribute("aria-selected", on ? "true" : "false");
        o.setAttribute("tabindex", on ? "0" : "-1");
        var p = $(o.getAttribute("aria-controls"));
        if (p) { p.classList.toggle("on", on); p.hidden = !on; }
      });
    });
    t.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var i = tabs.indexOf(t);
      var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      next.click();
    });
  });

  /* ---------- Monatlich / Jährlich (Pakete) ---------- */
  var billBtns = all("[data-bill]");
  billBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-bill");
      billBtns.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      all(".price b[data-m]").forEach(function (el) { el.innerHTML = el.getAttribute("data-" + k) + "<sup>€</sup>"; });
      all(".pnote[data-m]").forEach(function (el) { el.textContent = el.getAttribute("data-" + k); });
    });
  });

  /* ---------- Demo-Formular ---------- */
  var form = $("form");
  if (form) {
    // Paket aus dem Link übernehmen, z. B. demo.html?paket=Standard
    var paketFeld = $("f-paket");
    var m = /[?&]paket=([^&#]+)/.exec(window.location.search);
    if (paketFeld && m) {
      var wunsch = decodeURIComponent(m[1].replace(/\+/g, " "));
      Array.prototype.forEach.call(paketFeld.options, function (o) {
        if (o.value === wunsch) paketFeld.value = wunsch;
      });
    }

    var errBox = $("formErr");
    var sendBtn = form.querySelector('button[type="submit"]');
    var btnHtml = sendBtn ? sendBtn.innerHTML : "";
    var MAIL = "info@vaultcontor.de";

    function zeigeHinweis(text) {
      if (!errBox) return;
      errBox.classList.add("info");
      errBox.textContent = text;
      errBox.hidden = false;
    }

    function zeigeFehler(text) {
      if (!errBox) return;
      errBox.classList.remove("info");
      errBox.textContent = text + " ";
      var a = document.createElement("a");
      a.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("Demo-Anfrage");
      a.textContent = MAIL;
      errBox.appendChild(a);
      errBox.hidden = false;
    }

    function senden(laeuft) {
      if (!sendBtn) return;
      sendBtn.disabled = laeuft;
      sendBtn.innerHTML = laeuft ? "Wird gesendet …" : btnHtml;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (errBox) errBox.hidden = true;
      var ok = true;
      Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (f) {
        var wert = f.value.trim();
        var gut = wert !== "" && (f.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wert));
        f.style.boxShadow = gut ? "" : "inset 0 0 0 1.5px var(--bad)";
        f.setAttribute("aria-invalid", gut ? "false" : "true");
        if (!gut && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;

      // Direkt vom Computer geöffnet (file://): es gibt keinen Server, der senden könnte
      if (window.location.protocol === "file:") {
        zeigeHinweis("Lokale Vorschau: Die Eingaben sind korrekt. Verschickt wird die Anfrage erst, wenn die Website auf dem Server liegt.");
        return;
      }

      if (!window.fetch || !window.FormData) { form.submit(); return; }

      senden(true);
      fetch(form.getAttribute("action"), {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok && data && data.ok, data: data }; },
                                 function () { return { ok: false, data: null }; });
        })
        .then(function (r) {
          senden(false);
          if (r.ok) {
            form.classList.add("sent");
          } else {
            zeigeFehler(((r.data && r.data.meldung) || "Die Anfrage konnte gerade nicht verschickt werden.") + " Oder schreib uns direkt an");
          }
        })
        .catch(function () {
          senden(false);
          zeigeFehler("Die Anfrage konnte gerade nicht verschickt werden. Oder schreib uns direkt an");
        });
    });
  }

  /* ---------- Schwebende Karten folgen der Maus (Startseite) ---------- */
  var stage = $("stage");
  if (stage && fine && !reduce) {
    var floats = stage.querySelectorAll(".float");
    window.addEventListener("pointermove", function (e) {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      Array.prototype.forEach.call(floats, function (f) {
        var d = +f.getAttribute("data-depth");
        f.style.transform = "translate3d(" + (mx * d * .3).toFixed(1) + "px," + (my * d * .3).toFixed(1) + "px,0) rotateY(" + (mx * 8).toFixed(2) + "deg) rotateX(" + (-my * 8).toFixed(2) + "deg)";
      });
    }, { passive: true });
  }

  /* ---------- 3D-Ring (WebGL, ohne Bibliothek, Startseite) ----------
     Ein beleuchteter Torus in Limette mit Periwinkle-Kante, wie der Ring-Hintergrund im Dashboard. */
  function ring(cv) {
    var gl = cv.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;

    var vs = "attribute vec3 p;attribute vec3 n;uniform mat4 M;uniform mat4 P;varying vec3 vN;varying vec3 vP;" +
             "void main(){vec4 w=M*vec4(p,1.0);vP=w.xyz;vN=(M*vec4(n,0.0)).xyz;gl_Position=P*w;}";
    var fs = "precision highp float;varying vec3 vN;varying vec3 vP;uniform vec3 L1;uniform vec3 C2;" +
             "void main(){vec3 N=normalize(vN);vec3 V=normalize(-vP);vec3 R=reflect(-V,N);" +
             "vec3 Ld=normalize(vec3(-.55,.75,.6));float d=max(dot(N,Ld),0.);" +
             "float s=pow(max(dot(R,Ld),0.),60.);" +
             "float env=smoothstep(.05,.7,R.y);float band=exp(-pow((R.x-.25)*4.,2.))*smoothstep(-.2,.4,R.y);" +
             "float f=pow(1.-max(dot(N,V),0.),2.6);" +
             "vec3 c=L1*(.1+.55*d)+L1*env*.65+vec3(1.)*(s*.9+band*.25);" +
             "c+=C2*f*.75*clamp(.6-N.x,0.,1.)+L1*f*.25;" +
             "c=c/(1.+c*.18);gl_FragColor=vec4(c,1.);}";
    function sh(t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);

    // Torus-Gitter
    var R = 1.0, r = .3, NU = 180, NV = 64, pos = [], nor = [], idx = [], i, j;
    for (i = 0; i <= NU; i++) {
      var u = i / NU * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u);
      for (j = 0; j <= NV; j++) {
        var v = j / NV * Math.PI * 2, cvv = Math.cos(v), svv = Math.sin(v);
        pos.push((R + r * cvv) * cu, (R + r * cvv) * su, r * svv);
        nor.push(cvv * cu, cvv * su, svv);
      }
    }
    for (i = 0; i < NU; i++) {
      for (j = 0; j < NV; j++) {
        var a = i * (NV + 1) + j, b = a + NV + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    function buf(data, loc) {
      var bb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      var l = gl.getAttribLocation(pr, loc);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, 3, gl.FLOAT, false, 0, 0);
    }
    buf(pos, "p");
    buf(nor, "n");
    var ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    var uM = gl.getUniformLocation(pr, "M"), uP = gl.getUniformLocation(pr, "P");
    gl.uniform3f(gl.getUniformLocation(pr, "L1"), .824, 1.0, .302);
    gl.uniform3f(gl.getUniformLocation(pr, "C2"), .639, .616, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    function mul(a, b) { var o = new Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3]; return o; }
    function rx(w) { var c = Math.cos(w), s = Math.sin(w); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
    function ry(w) { var c = Math.cos(w), s = Math.sin(w); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
    function rz(w) { var c = Math.cos(w), s = Math.sin(w); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
    function persp(fov, asp, n, f) { var t = 1 / Math.tan(fov / 2), nf = 1 / (n - f); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]; }

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniformMatrix4fv(uP, false, persp(.62, w / h, .1, 50));
    }
    size();
    window.addEventListener("resize", size);

    var sx = 0, sy = 0, t0 = performance.now(), running = true;
    function frame(now) {
      var t = (now - t0) / 1000;
      sx += (mx - sx) * .05;
      sy += (my - sy) * .05;
      var m = mul(rz(t * .12), rx(-.95 + Math.sin(t * .4) * .06));
      m = mul(rx(sy * .35), m);
      m = mul(ry(.5 + sx * .45), m);
      m[12] = .15; m[13] = .05; m[14] = -5.2;
      gl.uniformMatrix4fv(uM, false, m);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      if (running && !reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // Pausieren, wenn der Ring nicht sichtbar ist
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(frame); }
        running = vis;
      }).observe(cv);
    }
  }
  var cv = $("ring");
  if (cv) ring(cv);
})();
