(function (g) {
  var A = { version: "1.0.0" };

  var OPS = {
    hoursAfter: function (val, ref) {
      var v = t2n(val), r = t2n(ref);
      if (v === null || r === null) return 0;
      var d = v - r;
      return d > 0 ? Math.round(d * 100) / 100 : 0;
    },
    hoursBetween: function (val, ref, row, col, spec, other) {
      var a = t2n(other), b = t2n(val);
      if (a === null || b === null) return 0;
      return Math.round((b - a) * 100) / 100;
    },
    beforeAfter: function (val, ref, row, col) {
      var v = t2n(val), r = t2n(ref);
      if (v === null) return col.after;
      return v < r ? col.before : col.after;
    }
  };

  function t2n(t) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(t == null ? "" : t).trim());
    if (!m) return null;
    var h = +m[1], n = +m[2];
    if (h > 23 || n > 59) return null;
    return h + n / 60;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function trim(v) { return String(v == null ? "" : v).trim(); }
  function round(n) { return Math.round(n * 100) / 100; }

  function validCell(col, val) {
    if (col.required && !trim(val)) return false;
    if (col.type === "time" && trim(val) && t2n(val) === null) return false;
    if (col.type === "number" && trim(val) && isNaN(parseFloat(val))) return false;
    return true;
  }

  function listFor(spec, col) {
    var o = col.options;
    if (typeof o === "string" && o.charAt(0) === "$") o = (spec.lists || {})[o.slice(1)];
    return Array.isArray(o) ? o : [];
  }

  function injectStyle() {
    if (document.getElementById("ac-style")) return;
    var s = document.createElement("style");
    s.id = "ac-style";
    s.textContent =
      ".ac{background:var(--surface-2);border:.5px solid var(--border);border-radius:12px}" +
      ".ac input,.ac select{height:28px;font-size:12px;padding:2px 5px;border:.5px solid transparent;background:transparent;border-radius:4px;width:100%;color:var(--text-primary);font-family:var(--font-sans)}" +
      ".ac input:hover,.ac select:hover{border-color:var(--border)}" +
      ".ac input:focus,.ac select:focus{border-color:var(--border-accent);background:var(--surface-2);outline:none}" +
      ".ac table{width:100%;table-layout:fixed;border-collapse:collapse}" +
      ".ac th{font-size:11px;font-weight:400;color:var(--text-muted);text-align:left;padding:0 5px 6px}" +
      ".ac td{padding:1px 2px;border-bottom:.5px solid var(--border)}" +
      ".ac .bad input,.ac .bad select{border-color:var(--border-danger)}" +
      ".ac .rm{width:24px;height:24px;padding:0;border:none;background:transparent;color:var(--text-muted);cursor:pointer;font-size:14px}" +
      ".ac .rm:hover{color:var(--text-danger)}" +
      ".ac .hd{display:flex;align-items:center;gap:10px;padding:12px 1rem;border-bottom:.5px solid var(--border)}" +
      ".ac .ti-block{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:1rem;border-bottom:.5px solid var(--border)}" +
      ".ac .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}" +
      ".ac .mark{width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500}";
    document.head.appendChild(s);
  }

  function brandMark(b) {
    if (b.logo && /^https?:/.test(b.logo))
      return '<img src="' + esc(b.logo) + '" alt="" style="height:24px;width:auto;display:block">';
    if (b.logo) return '<span style="display:block;height:24px">' + b.logo + "</span>";
    return '<span class="mark" style="background:' + esc(b.tint || "var(--surface-1)") +
      ";color:" + esc(b.ink || "var(--text-primary)") + '">' + esc(b.initials || "") + "</span>";
  }

  A.render = function (target, spec, opts) {
    opts = opts || {};
    injectStyle();
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    if (typeof spec.brand === "string") {
      var base = opts.brandBase || spec.brandBase || "";
      el.innerHTML = '<div style="padding:1rem;font-size:13px;color:var(--text-secondary)">carregando…</div>';
      fetch(base + spec.brand + ".json")
        .then(function (r) { return r.json(); })
        .then(function (b) { mount(el, spec, b); })
        .catch(function () { mount(el, spec, { name: spec.brand, initials: "?" }); });
      return;
    }
    mount(el, spec, spec.brand || {});
  };

  function mount(el, spec, brand) {
    if (brand.lists) {
      var merged = {}, k;
      for (k in brand.lists) merged[k] = brand.lists[k];
      for (k in (spec.lists || {})) merged[k] = spec.lists[k];
      spec.lists = merged;
    }
    var cols = spec.columns || [];
    var rows = (spec.rows || []).map(function (r) {
      var o = {}; cols.forEach(function (c) { o[c.key] = r[c.key] == null ? "" : r[c.key]; });
      o.__locked = {};
      return o;
    });
    var accent = brand.color || "var(--text-primary)";
    var onInk = brand.onColor || "#fff";

    el.className = "ac";
    el.innerHTML =
      '<h2 class="sr">' + esc(spec.title || "") + ". " + esc(spec.subtitle || "") + "</h2>" +
      '<div class="hd">' + brandMark(brand) +
      '<span style="font-size:13px;color:var(--text-secondary);flex:1">' + esc(brand.name || "") + "</span>" +
      (spec.headerIcon ? '<i class="ti ' + esc(spec.headerIcon) + '" style="font-size:16px;color:var(--text-muted)" aria-hidden="true"></i>' : "") +
      "</div>" +
      '<div class="ti-block"><div>' +
      '<p style="font-size:18px;font-weight:500;margin:0;color:var(--text-primary)">' + esc(spec.title || "") + "</p>" +
      (spec.subtitle ? '<p style="font-size:13px;margin:3px 0 0;color:var(--text-secondary)">' + spec.subtitle + "</p>" : "") +
      "</div>" +
      (spec.meta ? '<input id="ac-meta" type="' + esc(spec.meta.type || "text") + '" value="' + esc(spec.meta.value || "") +
        '" style="width:150px;height:32px;border:.5px solid var(--border);text-align:right">' : "") +
      "</div>" +
      (spec.body ? '<div style="padding:1.25rem;font-size:15px;color:var(--text-primary)">' + spec.body + "</div>" : "") +
      (cols.length ? '<div style="padding:10px 1rem 0"><table><colgroup>' +
        cols.map(function (c) { return '<col style="width:' + (c.width ? c.width + "px" : "auto") + '">'; }).join("") +
        (spec.removeRows !== false ? '<col style="width:26px">' : "") + "</colgroup><thead><tr>" +
        cols.map(function (c) { return "<th>" + esc(c.label || c.key) + "</th>"; }).join("") +
        (spec.removeRows !== false ? "<th></th>" : "") +
        '</tr></thead><tbody id="ac-tb"></tbody></table></div>' : "") +
      (spec.addRows ? '<div style="padding:8px 1rem 0"><button id="ac-add" style="height:28px;font-size:12px;padding:0 10px">' +
        esc(spec.addRowsLabel || "Add row") + "</button></div>" : "") +
      '<div id="ac-tot" style="margin:10px 1rem 0;border-top:.5px solid var(--border-strong);padding:10px 0 0;display:flex;flex-wrap:wrap;gap:16px;font-size:13px"></div>' +
      '<div id="ac-blk" style="margin:10px 1rem 0;font-size:13px;color:var(--text-danger)"></div>' +
      '<div style="display:flex;gap:10px;padding:1rem">' +
      (spec.actions || []).map(function (a, i) {
        return '<button data-act="' + i + '"' +
          (a.style === "primary" ? ' style="background:' + esc(accent) + ";color:" + esc(onInk) + ";border-color:" + esc(accent) + ';flex:1"' : "") +
          ">" + esc(a.label) + "</button>";
      }).join("") + "</div>";

    var tb = el.querySelector("#ac-tb");

    function derive(row, col) {
      if (!col.derive || row.__locked[col.key]) return row[col.key];
      var d = col.derive, src = row[d.from];
      var fn = OPS[d.op];
      if (!fn) return row[col.key];
      return fn(src, d.ref, row, d, spec, row[d.and]);
    }

    function cell(row, col, i) {
      var v = row[col.key];
      var bad = validCell(col, v) ? "" : " class=\"bad\"";
      if (col.type === "static") return "<td" + bad + '><span style="font-size:12px;padding:0 5px">' + esc(v) + "</span></td>";
      if (col.type === "select") {
        var o = listFor(spec, col);
        return "<td" + bad + '><select data-k="' + col.key + '"><option value=""></option>' +
          o.map(function (x) {
            var val = typeof x === "string" ? x : x.value, lab = typeof x === "string" ? x : x.label;
            return "<option value=\"" + esc(val) + "\"" + (val === v ? " selected" : "") + ">" + esc(lab) + "</option>";
          }).join("") + "</select></td>";
      }
      return "<td" + bad + '><input data-k="' + col.key + '" value="' + esc(v) +
        '"' + (col.placeholder ? ' placeholder="' + esc(col.placeholder) + '"' : "") + "></td>";
    }

    function draw() {
      rows.forEach(function (r) { cols.forEach(function (c) { if (c.derive) r[c.key] = derive(r, c); }); });
      if (tb) tb.innerHTML = rows.map(function (r, i) {
        return '<tr data-i="' + i + '">' + cols.map(function (c) { return cell(r, c, i); }).join("") +
          (spec.removeRows !== false ? '<td><button class="rm" data-rm="1" aria-label="remove"><i class="ti ti-x" aria-hidden="true"></i></button></td>' : "") + "</tr>";
      }).join("");

      var tot = el.querySelector("#ac-tot");
      tot.innerHTML = (spec.totals || []).map(function (t) {
        var v;
        if (t.type === "count") v = rows.length;
        else if (t.type === "sum") v = round(rows.reduce(function (a, r) { return a + num(r[t.key]); }, 0));
        else if (t.type === "countBy") v = rows.filter(function (r) {
          var cv = trim(r[t.key]);
          if (t.match === "@empty") return !cv;
          if (t.match === "@notEmpty") return !!cv;
          return cv === t.match;
        }).length;
        else v = "";
        var warn = t.warnIfAny && v > 0;
        return '<span style="color:var(--text-secondary)">' + esc(t.label) + ' <b style="font-weight:500;color:' +
          (warn ? "var(--text-danger)" : "var(--text-primary)") + '">' + v + "</b></span>";
      }).join("");

      var probs = [];
      cols.forEach(function (c) {
        if (rows.some(function (r) { return !validCell(c, r[c.key]); }))
          probs.push(c.invalidLabel || c.label || c.key);
      });
      el.querySelector("#ac-blk").textContent = probs.length ? (spec.blockLabel || "Fix first") + ": " + probs.join(", ") + "." : "";
      (spec.actions || []).forEach(function (a, i) {
        if (!a.requiresValid) return;
        var b = el.querySelector('[data-act="' + i + '"]');
        b.style.opacity = probs.length ? "0.45" : "1";
        b.dataset.block = probs.length ? "1" : "";
      });
    }

    if (tb) {
      tb.addEventListener("input", function (e) {
        var k = e.target.dataset.k; if (!k) return;
        var i = +e.target.closest("tr").dataset.i;
        rows[i][k] = e.target.value;
        if (cols.some(function (c) { return c.key === k && c.derive; })) rows[i].__locked[k] = true;
        draw();
      });
      tb.addEventListener("change", function (e) {
        var k = e.target.dataset.k; if (!k || e.target.tagName !== "SELECT") return;
        var i = +e.target.closest("tr").dataset.i;
        rows[i][k] = e.target.value;
        if (cols.some(function (c) { return c.key === k && c.derive; })) rows[i].__locked[k] = true;
        draw();
      });
      tb.addEventListener("click", function (e) {
        var b = e.target.closest("[data-rm]"); if (!b) return;
        rows.splice(+b.closest("tr").dataset.i, 1); draw();
      });
    }
    var add = el.querySelector("#ac-add");
    if (add) add.addEventListener("click", function () {
      var o = { __locked: {} };
      cols.forEach(function (c) { o[c.key] = c.default == null ? "" : c.default; });
      rows.push(o); draw();
    });

    function payload() {
      return cols.map(function (c) { return c.key; }).join(" | ") + "\n" +
        rows.map(function (r) {
          return cols.map(function (c) { return trim(r[c.key]) || "-"; }).join(" | ");
        }).join("\n");
    }

    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      if (b.dataset.block) return;
      var a = spec.actions[+b.dataset.act];
      var m = el.querySelector("#ac-meta");
      var txt = String(a.prompt || a.label)
        .replace("{{ROWS}}", payload())
        .replace("{{META}}", m ? m.value : "");
      if (typeof sendPrompt === "function") sendPrompt(txt);
    });

    draw();
  }

  A._util = { t2n: t2n, OPS: OPS, validCell: validCell };
  g.ActionCard = A;
})(typeof window !== "undefined" ? window : globalThis);
