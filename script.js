/* script.js — النسخة النهائية الكاملة
   شامل كل وظائف "وصف تطبيقي" و"قاعدة نهائية أبو حمزة"
   - رسالة ترحيب (ابدأ الآن)
   - شريط علوي بخلفية shbg.png (تُعرض عبر CSS على topbar)
   - قائمة جانبية/تنقل أقسام
   - لوحة تحكم بمصادقة + تغيير كلمة المرور
   - رفع صور/تلبيسات/خطوط/ستايلات (.json/.js) -> حفظ محلي
   - إدراج خطوط محليًا عبر @font-face (ttf, otf, woff, woff2)
   - توليد زخارف أسماء آمن (قراءة من json/js بدون eval)
   - تنزيل صور + دعم OCR (عند إضافة Tesseract)
   - إشعارات ذهبيّة (toast) عند رفع ستايلات/صور/خطوط
   - حفظ تلقائي إلى localStorage
   - مكتوب بعناية لتقليل الأخطاء والتداخل
*/

(function () {
  "use strict";

  /* ======================
     إعدادات وأسامي مفاتيح التخزين
     ====================== */
  const DEFAULT_ADMIN_PWD = "asd321";
  const LS_KEYS = {
    adminPwd: "abohamza_admin_pwd_v1",
    userImages: "abohamza_user_images_v1",
    clothesImages: "abohamza_clothes_images_v1",
    uploadedFonts: "abohamza_uploaded_fonts_v1",
    nameStyles: "abohamza_name_styles_v1",
    contactImages: "abohamza_contact_images_v1",
    aboutText: "abohamza_about_text_v1",
    contactText: "abohamza_contact_text_v1"
  };

  /* ======================
     أدوات مساعدة للحفظ والقراءة من localStorage
     ====================== */
  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("saveJSON error:", e);
    }
  }
  function loadJSON(key, def) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : (def === undefined ? null : def);
    } catch (e) {
      console.warn("loadJSON error:", e);
      return def === undefined ? null : def;
    }
  }

  /* ======================
     عناصر DOM التي نحتاجها (نحصل عليها عند DOMContentLoaded)
     ====================== */
  let dom = {};

  function $id(id) { return document.getElementById(id); }

  /* ======================
     Toast — إشعار ذهبي صغير (حسب اختيارك "1")
     ====================== */
  function showToast(msg, duration = 2200) {
    let t = document.querySelector(".ab-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "ab-toast";
      // style minimal to ensure appears even if style.css missed something
      t.style.position = "fixed";
      t.style.left = "50%";
      t.style.transform = "translateX(-50%) translateY(10px)";
      t.style.bottom = "24px";
      t.style.background = "linear-gradient(90deg,#d4af37,#f5d77c)";
      t.style.color = "#111";
      t.style.padding = "10px 16px";
      t.style.borderRadius = "12px";
      t.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      t.style.zIndex = "20000";
      t.style.opacity = "0";
      t.style.transition = "opacity .28s, transform .28s";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => {
      t.style.opacity = "1";
      t.style.transform = "translateX(-50%) translateY(0)";
    });
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateX(-50%) translateY(10px)";
    }, duration);
  }

  /* ======================
     تحميل/تنزيل صورة من DataURL
     ====================== */
  function downloadDataURL(dataURL, filename) {
    try {
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = filename || "download.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.warn("download error", e);
      alert("فشل التحميل");
    }
  }

  /* ======================
     hide any visible default password text (prevents asd321 leakage)
     ====================== */
  function sanitizeVisibleDefaultPassword() {
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const toReplace = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeValue && node.nodeValue.indexOf(DEFAULT_ADMIN_PWD) !== -1) {
          toReplace.push(node);
        }
      }
      toReplace.forEach(n => {
        n.nodeValue = n.nodeValue.replace(new RegExp(DEFAULT_ADMIN_PWD, "g"), "••••••");
      });
    } catch (e) {
      console.warn("sanitizeVisibleDefaultPassword error", e);
    }
  }

  /* ======================
     تحميل بيانات مخزنة محلياً
     ====================== */
  let state = {
    userImages: loadJSON(LS_KEYS.userImages, []),
    clothesImages: loadJSON(LS_KEYS.clothesImages, []),
    uploadedFonts: loadJSON(LS_KEYS.uploadedFonts, []),
    nameStyles: loadJSON(LS_KEYS.nameStyles, []),
    contactImages: loadJSON(LS_KEYS.contactImages, []),
  };

  /* ======================
     دوال لإدراج خط ديناميكي عبر @font-face
     يدعم ttf, otf, woff, woff2
     ====================== */
  function registerFontFromDataURL(filename, dataURL) {
    try {
      // اسم عائلة الخط بدون الامتداد
      const family = filename.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
      const styleId = "ab_font_" + family;
      if (document.getElementById(styleId)) return family; // مسجل مسبقًا
      const style = document.createElement("style");
      style.id = styleId;
      style.type = "text/css";
      // نحاول معرفة نوع الخط من dataURL أو اسم الملف
      let format = "";
      if (/\.woff2$/i.test(filename)) format = "woff2";
      else if (/\.woff$/i.test(filename)) format = "woff";
      else if (/\.ttf$/i.test(filename)) format = "truetype";
      else if (/\.otf$/i.test(filename)) format = "opentype";
      else {
        // sniff dataURL header
        if (dataURL && dataURL.indexOf("data:font/woff2") === 0) format = "woff2";
        else if (dataURL && dataURL.indexOf("data:font/woff") === 0) format = "woff";
      }
      style.textContent = `
        @font-face {
          font-family: '${family}';
          src: url('${dataURL}') format('${format || "truetype"}');
          font-weight: normal;
          font-style: normal;
        }
      `;
      document.head.appendChild(style);
      return family;
    } catch (e) {
      console.warn("registerFontFromDataURL error", e);
      return null;
    }
  }

  /* ======================
     آمن: استخراج نمط زخرفة (pattern) من ملف js أو json المرفوع
     لا ننفذ أي كود JS — فقط نحاول استخرج نصوص تحتوي {{text}}
     ====================== */
  function extractPatternFromStyleObject(objOrJsText) {
    try {
      if (!objOrJsText) return null;
      if (typeof objOrJsText === "string") {
        // النص قد يكون JS نصي أو نص JSON
        // أول محاولة: بحث عن نمط نصي بين علامات اقتباس يحتوي {{text}}
        const m = objOrJsText.match(/['"`]([^'"`{]*\{\{text\}\}[^'"`]*)['"`]/);
        if (m && m[1]) return m[1];
        // محاولة ثانية: بحث عن key pattern : "..."
        const m2 = objOrJsText.match(/pattern\s*[:=]\s*['"`]([^'"`]*)['"`]/);
        if (m2 && m2[1]) return m2[1];
        // محاولة ثالثة: لو هو نص JSON خام
        try {
          const parsed = JSON.parse(objOrJsText);
          if (parsed && parsed.pattern && typeof parsed.pattern === "string") return parsed.pattern;
        } catch (e) {
          // not JSON
        }
        return null;
      } else if (typeof objOrJsText === "object") {
        if (objOrJsText.pattern && typeof objOrJsText.pattern === "string") return objOrJsText.pattern;
      }
    } catch (e) {
      console.warn("extractPatternFromStyleObject error", e);
    }
    return null;
  }

  /* ======================
     safeApplyDecoration: يطبق النمط بأمان على النص (يحل محل {{text}})
     ====================== */
  function safeApplyDecoration(text, styleObj) {
    try {
      if (!styleObj) return text;
      // إذا كان كائن JSON مع مفتاح pattern
      if (typeof styleObj === "object" && styleObj.pattern) {
        return styleObj.pattern.replace(/\{\{text\}\}/g, text);
      }
      // إذا كان سلسلة JS أو JSON نصية
      if (typeof styleObj === "string") {
        const p = extractPatternFromStyleObject(styleObj);
        if (p) return p.replace(/\{\{text\}\}/g, text);
      }
      // لو هو كائن JS مخزن مثل { js: "...", name: "..." }
      if (styleObj.js && typeof styleObj.js === "string") {
        const p = extractPatternFromStyleObject(styleObj.js);
        if (p) return p.replace(/\{\{text\}\}/g, text);
      }
    } catch (e) {
      console.warn("safeApplyDecoration error", e);
    }
    return text;
  }

  /* ======================
     render name decorations (زخرفة الأسماء)
     ====================== */
  function renderNameResults(text) {
    const out = $id("nameResults");
    if (!out) return;
    out.innerHTML = "";
    const styles = loadJSON(LS_KEYS.nameStyles, []);
    if (!styles || !styles.length) {
      const d = document.createElement("div");
      d.className = "gold-card";
      d.textContent = "لا توجد ستايلات مرفوعة بعد — ارفع ملفات json/js من لوحة التحكم";
      out.appendChild(d);
      return;
    }
    // عرض 2x50 كما طلبت - لكن نأخذ الحد الأدنى من الأنماط
    const limit = Math.min(styles.length, 100);
    for (let i = 0; i < limit; i++) {
      const s = styles[i % styles.length];
      const decorated = safeApplyDecoration(text, s);
      const box = document.createElement("div");
      box.className = "name-box";
      box.textContent = decorated;
      out.appendChild(box);
    }
  }

  /* ======================
     render gallery (الصفحة الرئيسية)
     ====================== */
  function renderGallery() {
    const gallery = $id("gallery");
    if (!gallery) return;
    gallery.innerHTML = "";
    const images = loadJSON(LS_KEYS.userImages, []);
    if (!images || !images.length) {
      const d = document.createElement("div");
      d.className = "gold-card";
      d.textContent = "لا توجد صور مضافة — استخدم لوحة التحكم لإضافة صور";
      gallery.appendChild(d);
      return;
    }
    images.forEach(img => {
      const card = document.createElement("div");
      card.className = "design-card";
      card.innerHTML = `
        <img src="${img.data}" alt="${img.name}" />
        <div style="margin-top:8px;font-size:0.95rem">${img.name}</div>
        <div style="margin-top:8px">
          <button class="btn download-btn" data-name="${img.name}">تحميل</button>
          <button class="btn ocr-img-btn" data-name="${img.name}">OCR على الصورة</button>
        </div>
      `;
      gallery.appendChild(card);
    });
    // ربط أزرار التحميل وOCR
    Array.from(gallery.querySelectorAll(".download-btn")).forEach(b => {
      b.addEventListener("click", () => {
        const name = b.getAttribute("data-name");
        const imgs = loadJSON(LS_KEYS.userImages, []);
        const found = imgs.find(x => x.name === name);
        if (found) downloadDataURL(found.data, found.name);
      });
    });
    Array.from(gallery.querySelectorAll(".ocr-img-btn")).forEach(b => {
      b.addEventListener("click", () => {
        const name = b.getAttribute("data-name");
        const imgs = loadJSON(LS_KEYS.userImages, []);
        const found = imgs.find(x => x.name === name);
        if (found) {
          document.dispatchEvent(new CustomEvent("perform:ocr", { detail: { name: name, data: found.data } }));
        }
      });
    });
  }

  /* ======================
     render results grid (بحث)
     ====================== */
  function renderResultsGrid(list) {
    const rg = $id("resultsGrid");
    if (!rg) return;
    rg.innerHTML = "";
    if (!list || !list.length) {
      const d = document.createElement("div");
      d.className = "gold-card";
      d.textContent = "لا توجد نتائج";
      rg.appendChild(d);
      return;
    }
    list.forEach(item => {
      const card = document.createElement("div");
      card.className = "result-card";
      card.innerHTML = `<img src="${item.data}" alt="${item.name}" /><div style="margin-top:8px;font-size:0.95rem">${item.name}</div>
        <div style="margin-top:8px"><button class="btn download-btn" data-name="${item.name}">تحميل</button></div>`;
      rg.appendChild(card);
    });
    Array.from(rg.querySelectorAll(".download-btn")).forEach(b => {
      b.addEventListener("click", () => {
        const name = b.getAttribute("data-name");
        const imgs = loadJSON(LS_KEYS.userImages, []);
        const found = imgs.find(x => x.name === name);
        if (found) downloadDataURL(found.data, found.name);
      });
    });
  }

  /* ======================
     populate selects: fonts and clothes
     ====================== */
  function populateFontSelect() {
    const sel = $id("fontSelect");
    if (!sel) return;
    sel.innerHTML = "";
    const defaults = ["Cairo", "Reem Kufi", "Amiri", "Tajawal", "Noto Kufi Arabic", "El Messiri", "Changa"];
    defaults.forEach(f => {
      const o = document.createElement("option");
      o.value = f;
      o.textContent = f;
      sel.appendChild(o);
    });
    const up = loadJSON(LS_KEYS.uploadedFonts, []);
    up.forEach(f => {
      const o = document.createElement("option");
      o.value = f.url; // نستخدم dataURL كقيمة للاختيار
      o.textContent = f.name;
      sel.appendChild(o);
    });
  }

  function populateClotheSelect() {
    const sel = $id("clotheSelect");
    if (!sel) return;
    sel.innerHTML = "";
    const clothes = loadJSON(LS_KEYS.clothesImages, []);
    if (!clothes || !clothes.length) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "لا توجد تلبيسات";
      sel.appendChild(o);
      return;
    }
    clothes.forEach((d, i) => {
      const o = document.createElement("option");
      o.value = d;
      o.textContent = `تلبيس ${i + 1}`;
      sel.appendChild(o);
    });
  }

  /* ======================
     file upload handlers — صور، تلبيسات، خطوط، ستايلات
     ====================== */
  function wireUploads() {
    const uploadImages = $id("uploadImages");
    const uploadClothes = $id("uploadClothes");
    const uploadFonts = $id("uploadFonts");
    const uploadStyles = $id("uploadStyles");

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
          const existing = loadJSON(LS_KEYS.userImages, []);
          const merged = existing.concat(list);
          saveJSON(LS_KEYS.userImages, merged);
          state.userImages = merged;
          renderGallery();
          showToast(`تم رفع ${list.length} صورة`);
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
          const existing = loadJSON(LS_KEYS.clothesImages, []);
          const merged = existing.concat(list);
          saveJSON(LS_KEYS.clothesImages, merged);
          state.clothesImages = merged;
          populateClotheSelect();
          showToast(`تم رفع ${list.length} تلبيسات`);
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
          // حفظ البيانات في localStorage
          const existing = loadJSON(LS_KEYS.uploadedFonts, []);
          list.forEach(f => {
            existing.push({ name: f.name, url: f.data });
            // تسجيل الخط باستخدام @font-face
            try {
              registerFontFromDataURL(f.name, f.data);
            } catch (e) { console.warn("font register err", e); }
          });
          saveJSON(LS_KEYS.uploadedFonts, existing);
          state.uploadedFonts = existing;
          populateFontSelect();
          showToast(`تم رفع ${list.length} خطوط`);
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
              const text = e.target.result;
              if (file.name.toLowerCase().endsWith(".json")) {
                const parsed = JSON.parse(text);
                const existing = loadJSON(LS_KEYS.nameStyles, []);
                existing.push(parsed);
                saveJSON(LS_KEYS.nameStyles, existing);
                state.nameStyles = existing;
                showToast(`تم إضافة ستايل: ${file.name}`);
              } else if (file.name.toLowerCase().endsWith(".js")) {
                // نخزن النص فقط، دون تنفيذ
                const existing = loadJSON(LS_KEYS.nameStyles, []);
                existing.push({ js: text, name: file.name });
                saveJSON(LS_KEYS.nameStyles, existing);
                state.nameStyles = existing;
                showToast(`تم إضافة ستايل JS: ${file.name}`);
              } else {
                showToast("امتداد غير مدعوم للستايل");
              }
            } catch (err) {
              console.warn("style upload error", err);
              alert("فشل قراءة ملف الستايل");
            }
          };
          r.readAsText(file);
        });
        uploadStyles.value = "";
      });
    }
  }

  /* ======================
     wire control actions: add contact image (with link), save about/contact, change password
     ====================== */
  function wireControlActions() {
    const addContactBtn = $id("addContactImage");
    const contactFile = $id("contactImageFile");
    const contactLink = $id("contactImageLink");
    const saveBtn = $id("saveControl");
    const aboutEditor = $id("aboutEditor");
    const contactEditor = $id("contactEditor");

    if (addContactBtn && contactFile && contactLink) {
      addContactBtn.addEventListener("click", () => {
        const f = contactFile.files && contactFile.files[0];
        const link = (contactLink.value || "").trim();
        if (!f || !link) return alert("اختر صورة وأدخل رابط");
        const r = new FileReader();
        r.onload = e => {
          const existing = loadJSON(LS_KEYS.contactImages, []);
          existing.push({ src: e.target.result, link: link });
          saveJSON(LS_KEYS.contactImages, existing);
          state.contactImages = existing;
          renderContactLinks();
          showToast("تم إضافة صورة التواصل");
          contactFile.value = "";
          contactLink.value = "";
        };
        r.readAsDataURL(f);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const a = aboutEditor ? aboutEditor.value.trim() : "";
        const c = contactEditor ? contactEditor.value.trim() : "";
        if ($id("aboutText") && a) $id("aboutText").textContent = a;
        localStorage.setItem(LS_KEYS.aboutText, a);
        localStorage.setItem(LS_KEYS.contactText, c);
        showToast("تم حفظ التغييرات");
      });
    }

    // render initial about/contact values
    if (aboutEditor) aboutEditor.value = localStorage.getItem(LS_KEYS.aboutText) || ($id("aboutText") ? $id("aboutText").textContent : "");
    if (contactEditor) contactEditor.value = localStorage.getItem(LS_KEYS.contactText) || "";

    renderContactLinks();

    // change password logic
    const changeBtn = $id("changePwdBtn");
    if (changeBtn) {
      changeBtn.addEventListener("click", () => {
        const cur = ($id("curAdminPwd") && $id("curAdminPwd").value) ? $id("curAdminPwd").value.trim() : "";
        const nw = ($id("newAdminPwd") && $id("newAdminPwd").value) ? $id("newAdminPwd").value.trim() : "";
        const cf = ($id("confirmAdminPwd") && $id("confirmAdminPwd").value) ? $id("confirmAdminPwd").value.trim() : "";
        const saved = localStorage.getItem(LS_KEYS.adminPwd) || DEFAULT_ADMIN_PWD;
        if (!cur || !nw) return alert("املأ الحقول المطلوبة");
        if (cur !== saved) return alert("كلمة المرور الحالية غير صحيحة");
        if (nw.length < 4) return alert("يجب أن تكون كلمة المرور الجديدة 4 أحرف على الأقل");
        if (nw !== cf) return alert("تأكيد كلمة المرور غير مطابق");
        localStorage.setItem(LS_KEYS.adminPwd, nw);
        showToast("تم تغيير كلمة المرور بنجاح");
        if ($id("curAdminPwd")) $id("curAdminPwd").value = "";
        if ($id("newAdminPwd")) $id("newAdminPwd").value = "";
        if ($id("confirmAdminPwd")) $id("confirmAdminPwd").value = "";
      });
    }
  }

  /* ======================
     render contact links
     ====================== */
  function renderContactLinks() {
    const el = $id("contactLinks");
    if (!el) return;
    el.innerHTML = "";
    const arr = loadJSON(LS_KEYS.contactImages, []);
    if (!arr || !arr.length) {
      const d = document.createElement("div");
      d.className = "gold-card";
      d.textContent = "لا توجد روابط بعد";
      el.appendChild(d);
      return;
    }
    arr.forEach(ci => {
      const a = document.createElement("a");
      a.href = ci.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `<img src="${ci.src}" alt="contact" />`;
      el.appendChild(a);
    });
  }

  /* ======================
     Authentication for control panel
     ====================== */
  function ensureAdminPwdExists() {
    if (!localStorage.getItem(LS_KEYS.adminPwd)) {
      localStorage.setItem(LS_KEYS.adminPwd, DEFAULT_ADMIN_PWD);
    }
  }

  function wireControlAuth() {
    const adminLogin = $id("adminLogin");
    const adminPass = $id("adminPass");
    const controlAuth = $id("controlAuth");
    const controlArea = $id("controlArea");
    const logoutBtn = $id("logoutBtn");

    ensureAdminPwdExists();
    // hide visible default password text
    sanitizeVisibleDefaultPassword();

    if (adminLogin && adminPass) {
      adminLogin.addEventListener("click", () => {
        const v = (adminPass.value || "").trim();
        const saved = localStorage.getItem(LS_KEYS.adminPwd) || DEFAULT_ADMIN_PWD;
        if (v === saved) {
          if (controlAuth) controlAuth.style.display = "none";
          if (controlArea) controlArea.classList.remove("hidden");
          showToast("تم تسجيل الدخول");
          // refresh UI inside control
          populateClotheSelect();
          populateFontSelect();
          renderGallery();
          renderContactLinks();
        } else {
          alert("كلمة المرور غير صحيحة");
          adminPass.value = "";
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (controlArea) controlArea.classList.add("hidden");
        if (controlAuth) controlAuth.style.display = "";
        const modal = $id("controlModal");
        if (modal) modal.classList.add("hidden");
      });
    }
  }

  /* ======================
     Search handling
     ====================== */
  function doSearch() {
    const qEl = $id("fileSearch");
    const q = qEl && qEl.value ? qEl.value.trim().toLowerCase() : "";
    try {
      const stored = loadJSON(LS_KEYS.userImages, []);
      const filtered = stored.filter(i => (i.name || "").toLowerCase().includes(q));
      renderResultsGrid(filtered);
    } catch (e) {
      console.warn("doSearch error", e);
      renderResultsGrid([]);
    }
  }

  /* ======================
     OCR handler (uses Tesseract if included)
     ====================== */
  async function handlePerformOCR(detail) {
    const data = detail && detail.data;
    if (!data) return alert("لا توجد صورة لمعالجتها");
    if (window.Tesseract && typeof window.Tesseract.recognize === "function") {
      try {
        const worker = window.Tesseract.createWorker();
        await worker.load();
        await worker.loadLanguage("ara+eng");
        await worker.initialize("ara+eng");
        const { data: { text } } = await worker.recognize(data);
        await worker.terminate();
        alert("نتيجة OCR:\n\n" + (text || "(لم يتم قراءة نص)"));
      } catch (e) {
        console.warn("OCR error", e);
        alert("خطأ أثناء معالجة OCR");
      }
    } else {
      alert("OCR غير مفعّل محليًا. لإضافة OCR أضف tesseract.js إلى index.html.");
    }
  }

  /* ======================
     wire UI interactions: welcome, sidebar, topbar, etc.
     ====================== */
  function wireUI() {
    const startBtn = $id("startApp");
    const welcome = $id("welcomeModal");
    const main = $id("mainContent");
    const sectionsToggle = $id("sectionsToggle");
    const sideNav = $id("sideNav");
    const closeSide = $id("closeSide");
    const sideItems = Array.from(document.querySelectorAll(".side-item") || []);
    const pages = Array.from(document.querySelectorAll(".page") || []);
    const controlBtn = $id("controlBtn");
    const controlModal = $id("controlModal");
    const closeControl = $id("closeControl");
    const searchBtn = $id("searchBtn");
    const fileSearch = $id("fileSearch");
    const ocrBtn = $id("ocrBtn");

    if (startBtn && welcome) {
      startBtn.addEventListener("click", () => {
        welcome.style.transition = "opacity .35s ease, transform .35s ease";
        welcome.style.opacity = "0";
        welcome.style.transform = "scale(.98)";
        setTimeout(() => {
          if (welcome && welcome.parentNode) welcome.parentNode.removeChild(welcome);
        }, 360);
        if (main) main.classList.remove("hidden");
        document.dispatchEvent(new CustomEvent("app:started"));
        renderGallery();
      });
    }

    if (sectionsToggle && sideNav) {
      sectionsToggle.addEventListener("click", () => {
        sideNav.classList.toggle("hidden");
        sideNav.setAttribute("aria-hidden", sideNav.classList.contains("hidden") ? "true" : "false");
      });
    }
    if (closeSide) {
      closeSide.addEventListener("click", () => {
        if (sideNav) {
          sideNav.classList.add("hidden");
          sideNav.setAttribute("aria-hidden", "true");
        }
      });
    }

    // side navigation click
    sideItems.forEach(li => {
      li.addEventListener("click", () => {
        sideItems.forEach(i => i.classList.remove("active"));
        li.classList.add("active");
        const target = li.dataset.target;
        pages.forEach(p => p.classList.toggle("active", p.id === target));
        if (sideNav) { sideNav.classList.add("hidden"); sideNav.setAttribute("aria-hidden", "true"); }
      });
    });

    // control modal open/close
    if (controlBtn && controlModal) {
      controlBtn.addEventListener("click", () => {
        controlModal.classList.toggle("hidden");
        controlModal.setAttribute("aria-hidden", controlModal.classList.contains("hidden") ? "true" : "false");
        // reset auth view
        if ($id("controlAuth")) $id("controlAuth").style.display = "";
        if ($id("controlArea")) $id("controlArea").classList.add("hidden");
        if ($id("adminPass")) $id("adminPass").value = "";
      });
    }
    if (closeControl) {
      closeControl.addEventListener("click", () => {
        if (controlModal) controlModal.classList.add("hidden");
      });
    }

    // search
    if (searchBtn) searchBtn.addEventListener("click", doSearch);
    if (fileSearch) fileSearch.addEventListener("keyup", (e) => { if (e.key === "Enter") doSearch(); });

    if (ocrBtn) ocrBtn.addEventListener("click", () => {
      alert("لاستخراج نص بواسطة OCR: اختر صورة من 'الصور المضافة' ثم اضغط زر 'OCR على الصورة' في بطاقة الصورة.");
    });
  }

  /* ======================
     initialize everything after DOM loaded
     ====================== */
  document.addEventListener("DOMContentLoaded", () => {
    // sanitization
    sanitizeVisibleDefaultPassword();
    ensureAdminPwdExists();

    // wire UI and uploads and control
    wireUI();
    wireUploads();
    wireControlActions();
    wireControlAuth();

    // populate selects and render initial data
    populateClotheSelect();
    populateFontSelect();
    renderGallery();
    renderContactLinks();

    // global listeners
    document.addEventListener("perform:ocr", (ev) => handlePerformOCR(ev.detail || {}));
    document.addEventListener("app:started", () => {
      // when app starts, refresh dynamic UI
      populateClotheSelect();
      populateFontSelect();
      renderGallery();
      renderContactLinks();
    });

    // custom search event for compatibility with part1/part2 split earlier
    document.addEventListener("ui:search", () => doSearch());

    // protect and hide default password text anywhere
    sanitizeVisibleDefaultPassword();
  });

  /* ======================
     auto-save at unload
     ====================== */
  window.addEventListener("beforeunload", () => {
    try {
      // We saved on changes already, but ensure final persistence
      saveJSON(LS_KEYS.userImages, loadJSON(LS_KEYS.userImages, []));
      saveJSON(LS_KEYS.clothesImages, loadJSON(LS_KEYS.clothesImages, []));
      saveJSON(LS_KEYS.uploadedFonts, loadJSON(LS_KEYS.uploadedFonts, []));
      saveJSON(LS_KEYS.nameStyles, loadJSON(LS_KEYS.nameStyles, []));
      saveJSON(LS_KEYS.contactImages, loadJSON(LS_KEYS.contactImages, []));
    } catch (e) { console.warn("beforeunload save error", e); }
  });

  /* ======================
     exposed helpers (for debug if needed)
     ====================== */
  window.ABOHAMZA = {
    renderGallery,
    renderNameResults,
    renderResultsGrid,
    downloadDataURL,
    registerFontFromDataURL,
    safeApplyDecoration
  };

})(); // IIFE end
