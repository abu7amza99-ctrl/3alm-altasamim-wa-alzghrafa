/* script.js
   ملف موحّد ونهائي — يجمع وظائف الجزئين
   - ترحيب (Start)
   - Sidebar navigation
   - لوحة تحكم بمصادقة وميزة تغيير كلمة المرور
   - رفع/حفظ الصور، الخطوط، التلبيسات، الستايلات (localStorage)
   - تنزيل الصور، OCR placeholder (يدعم Tesseract إذا أضفته)
   - يصلح مشكلة عرض كلمة المرور الصريحة ويخفيها
*/

(function () {
  "use strict";

  // --------------------------
  // إعدادات عامة
  // --------------------------
  const DEFAULT_ADMIN_PWD = "asd321";
  const LS_KEYS = {
    adminPwd: "app_admin_pwd_v1",
    userImages: "userImages",
    clothesImages: "clothesImages",
    uploadedFonts: "uploadedFonts",
    nameStyles: "nameStyles",
    contactImages: "contactImages"
  };

  // --------------------------
  // مساعدة حفظ/تحميل JSON
  // --------------------------
  function saveJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch (e) { console.warn("saveJSON failed", e); }
  }
  function loadJSON(k, def = []) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : def;
    } catch (e) {
      console.warn("loadJSON failed", e);
      return def;
    }
  }

  // --------------------------
  // إخفاء أي عنصر يظهر فيه النص "asd321" (يمنع ظهور كلمة المرور بالصفحة)
  // --------------------------
  function hideVisibleDefaultPwd() {
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const t = walker.currentNode;
        if (t.nodeValue && t.nodeValue.includes(DEFAULT_ADMIN_PWD)) nodes.push(t);
      }
      nodes.forEach(n => {
        const parent = n.parentNode;
        if (parent) {
          // استبدال النص بنص يخفي كلمة المرور
          n.nodeValue = n.nodeValue.replace(new RegExp(DEFAULT_ADMIN_PWD, "g"), "••••••");
          // لو parent يحتوي فقط هذا النص، نضيف ملاحظة مخفية بصرياً بدل النص
          parent.setAttribute && parent.setAttribute("data-hidden-pwd", "true");
        }
      });
    } catch (e) { console.warn("hideVisibleDefaultPwd error", e); }
  }

  // --------------------------
  // ادوات DOM: تأكد من وجود العنصر
  // --------------------------
  function $(id) { return document.getElementById(id); }
  function on(el, ev, fn) { if (!el) return; el.addEventListener(ev, fn); }

  // --------------------------
  // تحميل البيانات الابتدائية
  // --------------------------
  let userImages = loadJSON(LS_KEYS.userImages, []);
  let clothesImages = loadJSON(LS_KEYS.clothesImages, []);
  let uploadedFonts = loadJSON(LS_KEYS.uploadedFonts, []);
  let nameStyles = loadJSON(LS_KEYS.nameStyles, []);
  let contactImages = loadJSON(LS_KEYS.contactImages, []);

  // --------------------------
  // دوال العرض: معرض الصور ونتائج البحث
  // --------------------------
  function renderGallery() {
    const gallery = $("gallery");
    if (!gallery) return;
    gallery.innerHTML = "";
    if (!userImages.length) {
      const no = document.createElement("div"); no.className = "gold-card"; no.textContent = "لا توجد صور مضافة بعد — استخدم لوحة التحكم لإضافة صور"; gallery.appendChild(no); return;
    }
    userImages.forEach(img => {
      const card = document.createElement("div");
      card.className = "design-card";
      card.innerHTML = `
        <img src="${img.data}" alt="${img.name}" />
        <div style="margin-top:8px;font-size:0.95rem">${img.name}</div>
        <div style="margin-top:8px">
          <button class="btn download-btn" data-name="${img.name}">تحميل</button>
          <button class="btn ocr-on-img" data-name="${img.name}">OCR على الصورة</button>
        </div>`;
      gallery.appendChild(card);
    });

    Array.from(gallery.querySelectorAll(".download-btn")).forEach(b => {
      b.addEventListener("click", () => {
        const nm = b.getAttribute("data-name");
        const found = userImages.find(it => it.name === nm);
        if (found) downloadDataURL(found.data, found.name);
      });
    });

    Array.from(gallery.querySelectorAll(".ocr-on-img")).forEach(b => {
      b.addEventListener("click", () => {
        const nm = b.getAttribute("data-name");
        const found = userImages.find(it => it.name === nm);
        if (!found) return alert("الصورة غير موجودة");
        document.dispatchEvent(new CustomEvent("perform:ocr", { detail: { name: nm, data: found.data } }));
      });
    });
  }

  window.renderResultsGrid = function (list) {
    const resultsGrid = $("resultsGrid");
    if (!resultsGrid) return;
    resultsGrid.innerHTML = "";
    if (!list || !list.length) {
      const no = document.createElement("div"); no.className = "gold-card"; no.textContent = "لا توجد نتائج"; resultsGrid.appendChild(no); return;
    }
    list.forEach(item => {
      const card = document.createElement("div"); card.className = "result-card";
      const nm = item.name || "image";
      card.dataset.name = nm;
      card.innerHTML = `<img src="${item.data}" alt="${nm}" /><div style="margin-top:8px;font-size:0.95rem">${nm}</div>
        <div style="margin-top:8px"><button class="btn download-btn" data-name="${nm}">تحميل</button></div>`;
      resultsGrid.appendChild(card);
    });
    Array.from(resultsGrid.querySelectorAll(".download-btn")).forEach(b => {
      b.addEventListener("click", () => {
        const nm = b.getAttribute("data-name");
        const found = userImages.find(it => it.name === nm);
        if (found) downloadDataURL(found.data, found.name);
      });
    });
  };

  // --------------------------
  // download helper
  // --------------------------
  function downloadDataURL(dataUrl, filename) {
    try {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename || "download.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) { console.warn("download failed", e); alert("فشل التحميل"); }
  }

  // --------------------------
  // وظائف رفع الصور/خطوط/تلبيسات/ستايلات
  // --------------------------
  function wireControlUploads() {
    const uploadImages = $("uploadImages");
    const uploadClothes = $("uploadClothes");
    const uploadFonts = $("uploadFonts");
    const uploadStyles = $("uploadStyles");

    if (uploadImages) {
      uploadImages.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files || []);
        if (!files.length) return;
        const readers = files.map(f => new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = e => res({ name: f.name, data: e.target.result });
          r.onerror = rej;
          r.readAsDataURL(f);
        }));
        Promise.all(readers).then(list => {
          userImages = userImages.concat(list);
          saveJSON(LS_KEYS.userImages, userImages);
          renderGallery();
          alert(`تم إضافة ${list.length} صورة للمعرض`);
          uploadImages.value = "";
        }).catch(err => { console.warn(err); alert("فشل رفع الصور"); });
      });
    }

    if (uploadClothes) {
      uploadClothes.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files || []);
        if (!files.length) return;
        const readers = files.map(f => new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = e => res(e.target.result);
          r.onerror = rej;
          r.readAsDataURL(f);
        }));
        Promise.all(readers).then(list => {
          clothesImages = clothesImages.concat(list);
          saveJSON(LS_KEYS.clothesImages, clothesImages);
          populateClotheSelect();
          alert(`تم رفع ${list.length} تلبيسات`);
          uploadClothes.value = "";
        }).catch(err => { console.warn(err); alert("فشل رفع التلبيسات"); });
      });
    }

    if (uploadFonts) {
      uploadFonts.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files || []);
        if (!files.length) return;
        const readers = files.map(f => new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = e => res({ name: f.name, data: e.target.result });
          r.onerror = rej;
          r.readAsDataURL(f);
        }));
        Promise.all(readers).then(list => {
          const existing = loadJSON(LS_KEYS.uploadedFonts, []);
          list.forEach(f => {
            existing.push({ name: f.name, url: f.data });
            try {
              const fontFaceName = f.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
              if (!document.getElementById("font-" + fontFaceName)) {
                const style = document.createElement("style");
                style.id = "font-" + fontFaceName;
                style.innerHTML = `@font-face{font-family:'${fontFaceName}';src:url('${f.data}');}`;
                document.head.appendChild(style);
              }
            } catch (err) { console.warn("font register err", err); }
          });
          saveJSON(LS_KEYS.uploadedFonts, existing);
          uploadedFonts = existing;
          populateFontSelect();
          alert(`تم رفع ${list.length} خطوط`);
          uploadFonts.value = "";
        }).catch(err => { console.warn(err); alert("فشل رفع الخطوط"); });
      });
    }

    if (uploadStyles) {
      uploadStyles.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files || []);
        if (!files.length) return;
        files.forEach(file => {
          const r = new FileReader();
          r.onload = e => {
            try {
              if (file.name.toLowerCase().endsWith(".json")) {
                const parsed = JSON.parse(e.target.result);
                nameStyles.push(parsed);
                saveJSON(LS_KEYS.nameStyles, nameStyles);
              } else if (file.name.toLowerCase().endsWith(".js")) {
                nameStyles.push({ js: e.target.result, name: file.name });
                saveJSON(LS_KEYS.nameStyles, nameStyles);
              }
              alert(`تم إضافة ستايل: ${file.name}`);
            } catch (err) {
              console.warn("style load error", err);
              alert("فشل قراءة ملف الستايل");
            }
          };
          r.readAsText(file);
        });
        uploadStyles.value = "";
      });
    }
  }

  function populateClotheSelect() {
    const sel = $("clotheSelect");
    if (!sel) return;
    sel.innerHTML = "";
    if (!clothesImages.length) {
      const o = document.createElement("option"); o.value = ""; o.textContent = "لا توجد تلبيسات"; sel.appendChild(o); return;
    }
    clothesImages.forEach((d, i) => {
      const o = document.createElement("option"); o.value = d; o.textContent = `تلبيس ${i + 1}`; sel.appendChild(o);
    });
  }

  function populateFontSelect() {
    const sel = $("fontSelect");
    if (!sel) return;
    sel.innerHTML = "";
    const defaults = ["Cairo", "Reem Kufi", "Amiri", "Tajawal", "Noto Kufi Arabic", "El Messiri", "Changa"];
    defaults.forEach(f => { const o = document.createElement("option"); o.value = f; o.textContent = f; sel.appendChild(o); });
    const up = loadJSON(LS_KEYS.uploadedFonts, []);
    up.forEach(f => { const o = document.createElement("option"); o.value = f.url; o.textContent = f.name; sel.appendChild(o); });
  }

  // --------------------------
  // زخرفة الأسماء (آمن) بالاعتماد على الستايلات المرفوعة
  // --------------------------
  function safeApplyStyle(text, style) {
    if (!style) return text;
    try {
      if (typeof style === "string") return style.replace("{{text}}", text);
      if (style.pattern && typeof style.pattern === "string") return style.pattern.replace("{{text}}", text);
      if (style.js && typeof style.js === "string") {
        const m = style.js.match(/pattern\s*[:=]\s*['"`]([^'"`]+)['"`]/);
        if (m && m[1]) return m[1].replace("{{text}}", text);
        const m2 = style.js.match(/['"`]([^'"`{]*\{\{text\}\}[^'"`]*)['"`]/);
        if (m2 && m2[1]) return m2[1].replace("{{text}}", text);
      }
    } catch (e) { console.warn("safeApplyStyle", e); }
    return text;
  }

  function renderNameResults(text) {
    const out = $("nameResults");
    if (!out) return;
    out.innerHTML = "";
    const styles = loadJSON(LS_KEYS.nameStyles, []);
    if (!styles.length) {
      const no = document.createElement("div"); no.className = "gold-card"; no.textContent = "لا توجد ستايلات مرفوعة بعد"; out.appendChild(no); return;
    }
    const limit = Math.min(styles.length, 100);
    for (let i = 0; i < limit; i++) {
      const s = styles[i % styles.length];
      const res = safeApplyStyle(text, s);
      const box = document.createElement("div"); box.className = "name-box"; box.textContent = res; out.appendChild(box);
    }
  }

  // --------------------------
  // OCR handler (إذا أضفت tesseract.js سيعمل)
  // --------------------------
  document.addEventListener("perform:ocr", async (ev) => {
    const detail = ev.detail || {};
    const data = detail.data;
    if (!data) return alert("لا توجد صورة لمعالجتها");
    if (window.Tesseract && typeof window.Tesseract.recognize === "function") {
      try {
        const worker = window.Tesseract.createWorker();
        await worker.load();
        await worker.loadLanguage("ara+eng");
        await worker.initialize("ara+eng");
        const { data: { text } } = await worker.recognize(data);
        await worker.terminate();
        alert("نتيجة OCR:\n\n" + (text || "(لا يوجد نص)"));
      } catch (e) { console.warn(e); alert("خطأ أثناء OCR"); }
    } else {
      alert("OCR غير مفعل محلياً. لإضافة OCR أضف tesseract.js إلى index.html.");
    }
  });

  // --------------------------
  // إدارة لوحة التحكم: مصادقة و تغيير كلمة المرور
  // --------------------------
  function getSavedAdminPwd() {
    const p = localStorage.getItem(LS_KEYS.adminPwd);
    return p ? p : null;
  }
  function ensureAdminPwdExists() {
    if (!getSavedAdminPwd()) localStorage.setItem(LS_KEYS.adminPwd, DEFAULT_ADMIN_PWD);
  }
  function setAdminPwd(newPwd) {
    localStorage.setItem(LS_KEYS.adminPwd, newPwd);
  }

  function wireControlAuthAndChangePwd() {
    const adminLogin = $("adminLogin");
    const adminPass = $("adminPass");
    const controlAuth = $("controlAuth");
    const controlArea = $("controlArea");
    const logoutBtn = $("logoutBtn");

    // hide any visible default password text in DOM
    hideVisibleDefaultPwd();

    ensureAdminPwdExists();
    on(adminLogin, "click", () => {
      const val = (adminPass && adminPass.value ? adminPass.value.trim() : "");
      const saved = getSavedAdminPwd() || DEFAULT_ADMIN_PWD;
      if (val === saved) {
        if (controlAuth) controlAuth.style.display = "none";
        if (controlArea) controlArea.classList.remove("hidden");
        document.dispatchEvent(new CustomEvent("control:authenticated"));
      } else {
        alert("كلمة المرور غير صحيحة");
        if (adminPass) adminPass.value = "";
      }
    });

    // إضافة واجهة تغيير كلمة المرور داخل controlArea (إذا الDOM يحتوي already نستخدمه)
    const controlInner = document.querySelector(".control-inner");
    if (controlInner) {
      // ابحث إن كان فيه مكان لتغيير كلمة المرور أصلاً (لمنع الازدواج)
      if (!document.getElementById("changePwdSection")) {
        const sec = document.createElement("section");
        sec.id = "changePwdSection";
        sec.className = "control-section";
        sec.innerHTML = `
          <h4>تغيير كلمة مرور لوحة التحكم</h4>
          <label>كلمة المرور الحالية</label>
          <input type="password" id="curAdminPwd" class="input" placeholder="أدخل كلمة المرور الحالية" />
          <label>كلمة المرور الجديدة</label>
          <input type="password" id="newAdminPwd" class="input" placeholder="أدخل كلمة المرور الجديدة" />
          <label>تأكيد كلمة المرور الجديدة</label>
          <input type="password" id="confirmAdminPwd" class="input" placeholder="أكد كلمة المرور الجديدة" />
          <button id="changePwdBtn" class="btn">تغيير كلمة المرور</button>
        `;
        // ضعها قبل أزرار الحفظ إن وجدت
        const controlActions = document.querySelector(".control-actions");
        if (controlActions) controlInner.insertBefore(sec, controlActions);
        else controlInner.appendChild(sec);

        // فعل الزر
        on(document.getElementById("changePwdBtn"), "click", () => {
          const cur = (document.getElementById("curAdminPwd").value || "").trim();
          const nw = (document.getElementById("newAdminPwd").value || "").trim();
          const cf = (document.getElementById("confirmAdminPwd").value || "").trim();
          const saved = getSavedAdminPwd() || DEFAULT_ADMIN_PWD;
          if (!cur || !nw) return alert("املأ الحقول المطلوبة");
          if (cur !== saved) return alert("كلمة المرور الحالية غير صحيحة");
          if (nw.length < 4) return alert("يجب أن تكون كلمة المرور الجديدة 4 أحرف على الأقل");
          if (nw !== cf) return alert("تأكيد كلمة المرور غير مطابق");
          setAdminPwd(nw);
          alert("تم تغيير كلمة المرور بنجاح");
          // افراغ الحقول
          document.getElementById("curAdminPwd").value = "";
          document.getElementById("newAdminPwd").value = "";
          document.getElementById("confirmAdminPwd").value = "";
        });
      }
    }

    on(logoutBtn, "click", () => {
      if (controlArea) controlArea.classList.add("hidden");
      if (controlAuth) controlAuth.style.display = "";
      const modal = $("controlModal");
      if (modal) modal.classList.add("hidden");
    });
  }

  // --------------------------
  // Search functionality
  // --------------------------
  function doSearch() {
    const qEl = $("fileSearch");
    const q = qEl && qEl.value ? qEl.value.trim().toLowerCase() : "";
    try {
      const stored = loadJSON(LS_KEYS.userImages, []);
      const filtered = stored.filter(i => (i.name || "").toLowerCase().includes(q));
      window.renderResultsGrid(filtered);
    } catch (e) { console.warn(e); window.renderResultsGrid([]); }
  }

  // --------------------------
  // Event wiring (UI interactions common)
  // --------------------------
  function wireUI() {
    // welcome start button
    on($("startApp"), "click", () => {
      const welcome = $("welcomeModal");
      if (welcome) {
        welcome.style.transition = "opacity .35s ease, transform .35s ease";
        welcome.style.opacity = "0"; welcome.style.transform = "scale(.98)";
        setTimeout(() => { if (welcome && welcome.parentNode) welcome.parentNode.removeChild(welcome); }, 360);
      }
      const main = $("mainContent");
      if (main) main.classList.remove("hidden");
      document.dispatchEvent(new CustomEvent("app:started"));
      // refresh gallery in case uploads happened earlier
      renderGallery();
    });

    // sidebar toggle
    on($("sectionsToggle"), "click", () => {
      const side = $("sideNav");
      if (!side) return;
      side.classList.toggle("hidden");
      side.setAttribute("aria-hidden", side.classList.contains("hidden") ? "true" : "false");
    });
    on($("closeSide"), "click", () => {
      const side = $("sideNav"); if (side) { side.classList.add("hidden"); side.setAttribute("aria-hidden", "true"); }
    });

    // side navigation
    const sideItems = Array.from(document.querySelectorAll(".side-item") || []);
    const pages = Array.from(document.querySelectorAll(".page") || []);
    sideItems.forEach(li => {
      li.addEventListener("click", () => {
        const target = li.dataset.target;
        if (!target) return;
        sideItems.forEach(s => s.classList.remove("active"));
        li.classList.add("active");
        pages.forEach(p => p.id === target ? p.classList.add("active") : p.classList.remove("active"));
        const side = $("sideNav"); if (side) { side.classList.add("hidden"); side.setAttribute("aria-hidden", "true"); }
      });
    });

    // control modal open/close
    on($("controlBtn"), "click", () => {
      const modal = $("controlModal");
      if (!modal) return;
      modal.classList.toggle("hidden");
      modal.setAttribute("aria-hidden", modal.classList.contains("hidden") ? "true" : "false");
      // reset auth
      const adminPass = $("adminPass"); if (adminPass) adminPass.value = "";
      const controlAuth = $("controlAuth"); if (controlAuth) controlAuth.style.display = "";
      const controlArea = $("controlArea"); if (controlArea) controlArea.classList.add("hidden");
    });
    on($("closeControl"), "click", () => {
      const modal = $("controlModal"); if (modal) modal.classList.add("hidden");
    });

    // search handlers
    on($("searchBtn"), "click", doSearch);
    const fileSearch = $("fileSearch");
    if (fileSearch) fileSearch.addEventListener("keyup", (e) => { if (e.key === "Enter") doSearch(); });

    // OCR request button (explains flow)
    on($("ocrBtn"), "click", () => {
      alert("لإجراء OCR: اختر صورة من 'الصور المضافة' ثم اضغط زر 'OCR على الصورة' في بطاقة الصورة.");
    });
  }

  // --------------------------
  // رابط الأحداث مع أجزاء العمل
  // --------------------------
  document.addEventListener("DOMContentLoaded", () => {
    // إخفاء أي كلمة مرور ظاهرة في النص
    hideVisibleDefaultPwd();

    // تأكد من وجود كلمة مرور محفوظة
    ensureAdminPwdExists();

    // واصل تهيئة واجهة لوحة التحكم
    wireControlUploads(); // رفع الملفات
    populateClotheSelect();
    populateFontSelect();
    renderGallery();

    wireUI();
    wireControlAuthAndChangePwd();

    // حدث جاهزية التطبيق
    document.dispatchEvent(new CustomEvent("app:ready"));
  });

  // --------------------------
  // حفظ تلقائي قبل الخروج
  // --------------------------
  window.addEventListener("beforeunload", () => {
    saveJSON(LS_KEYS.userImages, userImages);
    saveJSON(LS_KEYS.clothesImages, clothesImages);
    saveJSON(LS_KEYS.uploadedFonts, uploadedFonts);
    saveJSON(LS_KEYS.nameStyles, nameStyles);
    saveJSON(LS_KEYS.contactImages, contactImages);
  });

  // --------------------------
  // exposed helpers (optional)
  // --------------------------
  window.appHelper = {
    downloadDataURL,
    renderGallery,
    renderResultsGrid,
    setAdminPwd
  };

})(); // IIFE
