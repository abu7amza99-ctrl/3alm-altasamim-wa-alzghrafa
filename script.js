// ========== تطبيق عالم التصاميم والزخرفة ==========
// إعداد فعلي ونهائي - قاعدة نهائية أبو حمزة

document.addEventListener("DOMContentLoaded", () => {

  // ========== رسالة الترحيب ==========
  const startBtn = document.getElementById("startApp");
  const welcomeModal = document.getElementById("welcomeModal");

  if (startBtn && welcomeModal) {
    startBtn.addEventListener("click", () => {
      welcomeModal.classList.add("hidden");
    });
  }

  // ========== القائمة الجانبية ==========
  const sideNav = document.getElementById("sideNav");
  const openSideBtn = document.getElementById("openSide");
  const closeSideBtn = document.getElementById("closeSide");

  if (openSideBtn && sideNav) {
    openSideBtn.addEventListener("click", () => {
      sideNav.classList.remove("hidden");
    });
  }

  if (closeSideBtn && sideNav) {
    closeSideBtn.addEventListener("click", () => {
      sideNav.classList.add("hidden");
    });
  }

  // ========== التنقل بين الأقسام ==========
  const sideItems = document.querySelectorAll(".side-item");
  const pages = document.querySelectorAll(".page");

  sideItems.forEach(item => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-target");

      sideItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      pages.forEach(page => {
        if (page.id === target) page.classList.add("active");
        else page.classList.remove("active");
      });

      // إغلاق القائمة تلقائيًا على الجوال
      sideNav.classList.add("hidden");
    });
  });

  // ========== لوحة التحكم ==========
  const openPanelBtn = document.getElementById("openPanel");
  const controlModal = document.getElementById("controlModal");
  const controlInner = document.querySelector(".control-inner");
  const closePanelBtn = document.getElementById("closePanel");
  const passInput = document.getElementById("panelPass");
  const passBtn = document.getElementById("checkPass");
  const controlSections = document.getElementById("controlSections");

  if (openPanelBtn && controlModal) {
    openPanelBtn.addEventListener("click", () => {
      controlModal.classList.remove("hidden");
      controlSections.classList.add("hidden");
    });
  }

  if (closePanelBtn && controlModal) {
    closePanelBtn.addEventListener("click", () => {
      controlModal.classList.add("hidden");
      passInput.value = "";
    });
  }

  if (passBtn) {
    passBtn.addEventListener("click", () => {
      if (passInput.value === "asd321") {
        controlSections.classList.remove("hidden");
        passInput.value = "";
      } else {
        alert("كلمة المرور غير صحيحة ⚠️");
      }
    });
  }

  // ========== صفحة الصفحة الرئيسية ==========
  const searchInput = document.getElementById("searchInput");
  const searchGrid = document.getElementById("searchResults");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const val = searchInput.value.trim().toLowerCase();
      const cards = document.querySelectorAll(".gold-card");

      cards.forEach(card => {
        const name = card.getAttribute("data-name")?.toLowerCase() || "";
        card.style.display = name.includes(val) ? "block" : "none";
      });
    });
  }

  // ========== صفحة زخرفة الخطوط ==========
  const fontSelect = document.getElementById("fontSelect");
  const colorMode = document.getElementById("colorMode");
  const colorPicker = document.getElementById("colorPicker");
  const gradientSelect = document.getElementById("gradientSelect");
  const previewText = document.getElementById("fontPreview");

  const gradients = [
    "linear-gradient(90deg, #d4af37, #fceabb)",
    "linear-gradient(90deg, #ff9966, #ff5e62)",
    "linear-gradient(90deg, #00c6ff, #0072ff)",
    "linear-gradient(90deg, #f7971e, #ffd200)",
    "linear-gradient(90deg, #8E2DE2, #4A00E0)",
    "linear-gradient(90deg, #00b09b, #96c93d)",
    "linear-gradient(90deg, #f953c6, #b91d73)"
  ];

  gradients.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g.replace("linear-gradient(90deg,", "").replace(")", "");
    gradientSelect.appendChild(opt);
  });

  const updatePreview = () => {
    const text = document.getElementById("fontNameInput").value;
    previewText.textContent = text || "نص تجريبي";

    const font = fontSelect.value;
    previewText.style.fontFamily = font;

    const mode = colorMode.value;
    if (mode === "solid") {
      previewText.style.background = "none";
      previewText.style.color = colorPicker.value;
    } else if (mode === "gradient") {
      previewText.style.background = gradientSelect.value;
      previewText.style.webkitBackgroundClip = "text";
      previewText.style.color = "transparent";
    } else if (mode === "texture") {
      const img = document.getElementById("textureSelect").value;
      previewText.style.background = `url('${img}')`;
      previewText.style.backgroundSize = "cover";
      previewText.style.webkitBackgroundClip = "text";
      previewText.style.color = "transparent";
    }
  };

  const fontInputs = ["fontNameInput", "fontSelect", "colorMode", "colorPicker", "gradientSelect", "textureSelect"];
  fontInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updatePreview);
  });

  // ========== حفظ الإعدادات في LocalStorage ==========
  function saveSetting(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadSetting(key, def) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : def;
  }

  // تفعيل إعدادات محفوظة مسبقًا
  const savedTheme = loadSetting("appTheme", "default");
  document.body.classList.add(savedTheme);

});
/* script-part2.js
   الجزء 2/2 — رفع ملفات، إدارة الستايلات، تطبيق زخارف الأسماء، تخزين محلي، ومعالجات العرض
   النسخة النهائية — متوافقة مع index.html و style.css و script-part1.js
*/

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    // --- Helpers: تخزين واسترجاع مع حماية ---
    const saveJSON = (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn("LocalStorage save failed", e);
      }
    };
    const loadJSON = (key, def = []) => {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : def;
      } catch (e) {
        console.warn("LocalStorage load failed", e);
        return def;
      }
    };

    // --- عناصر لوحة التحكم ---
    const uploadImages = document.getElementById("uploadImages"); // صور الواجهة الرئيسية
    const uploadClothes = document.getElementById("uploadClothes"); // صور تلبيس
    const uploadFonts = document.getElementById("uploadFonts"); // خطوط
    const uploadStyles = document.getElementById("uploadStyles"); // ستايلات (json/js)
    const addContactImageBtn = document.getElementById("addContactImage");
    const contactImageFile = document.getElementById("contactImageFile");
    const contactImageLink = document.getElementById("contactImageLink");
    const aboutEditor = document.getElementById("aboutEditor");
    const contactEditor = document.getElementById("contactEditor");
    const saveControl = document.getElementById("saveControl");
    const logoutBtn = document.getElementById("logoutBtn");
    const primaryColorInput = document.getElementById("primaryColor");

    // --- عناصر العرض في الواجهة ---
    const gallery = document.getElementById("gallery"); // معرض الصور في الصفحة الرئيسية
    const nameResults = document.getElementById("nameResults"); // نتائج زخرفة الأسماء
    const fontSelect = document.getElementById("fontSelect");
    const clotheSelect = document.getElementById("clotheSelect");
    const gradientSelect = document.getElementById("gradientSelect");
    const fontPreview = document.getElementById("fontPreview");
    const aboutText = document.getElementById("aboutText");
    const contactLinks = document.getElementById("contactLinks");
    const uploadImagesMax = 50;

    // --- تحميل البيانات المبدئية من localStorage ---
    let storedImages = loadJSON("userImages", []); // [{name,data}]
    let storedClothes = loadJSON("clothesImages", []); // [dataURL,...]
    let storedFonts = loadJSON("uploadedFonts", []); // [{name,url}]
    let storedNameStyles = loadJSON("nameStyles", []); // [object or {js:...,name:...}]
    let storedContactImages = loadJSON("contactImages", []); // [{src,link}]
    let savedAboutText = localStorage.getItem("aboutText") || "";
    let savedContactText = localStorage.getItem("contactText") || "";
    const savedPrimaryColor = localStorage.getItem("primaryColor") || "#d4af37";

    // Apply saved textual content and primary color
    if (aboutText) aboutText.textContent = savedAboutText;
    if (contactEditor) contactEditor.value = savedContactText;
    if (aboutEditor) aboutEditor.value = savedAboutText;
    if (primaryColorInput) primaryColorInput.value = savedPrimaryColor;
    if (primaryColorInput) {
      document.documentElement.style.setProperty("--primary-gold", savedPrimaryColor);
    }

    // --- وظائف العرض: معرض الصور في الصفحة الرئيسية ---
    function renderGallery() {
      if (!gallery) return;
      gallery.innerHTML = "";
      if (!storedImages.length) {
        const empty = document.createElement("div");
        empty.className = "gold-card";
        empty.textContent = "لا توجد صور مضافة بعد — استخدم لوحة التحكم لإضافة صور";
        gallery.appendChild(empty);
        return;
      }
      storedImages.forEach((img) => {
        const card = document.createElement("div");
        card.className = "design-card";
        card.innerHTML = `
          <img src="${img.data}" alt="${img.name}" />
          <div class="actions">
            <button class="btn download-btn" data-name="${img.name}">تحميل</button>
          </div>
        `;
        gallery.appendChild(card);
      });

      // attach download handlers
      Array.from(document.querySelectorAll(".download-btn")).forEach((b) =>
        b.addEventListener("click", (e) => {
          const name = b.getAttribute("data-name") || "download.png";
          const target = storedImages.find((it) => it.name === name);
          if (target) downloadDataURL(target.data, target.name);
        })
      );
    }

    // download helper
    function downloadDataURL(dataUrl, filename) {
      try {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {
        console.warn("download failed", e);
      }
    }

    // --- رفع صور للواجهة الرئيسية (uploadImages) ---
    if (uploadImages) {
      uploadImages.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files).slice(0, uploadImagesMax);
        if (!files.length) return;
        const readers = files.map(
          (f) =>
            new Promise((res, rej) => {
              const r = new FileReader();
              r.onload = (e) => res({ name: f.name, data: e.target.result });
              r.onerror = rej;
              r.readAsDataURL(f);
            })
        );
        Promise.all(readers)
          .then((list) => {
            storedImages = storedImages.concat(list);
            saveJSON("userImages", storedImages);
            renderGallery();
            alert("تم رفع الصور وحفظها للعرض في الصفحة الرئيسية ✅");
            uploadImages.value = "";
          })
          .catch(() => alert("فشل رفع الصور — حاول مرة أخرى"));
      });
    }

    // --- رفع صور التلبيس (clothes) ---
    if (uploadClothes) {
      uploadClothes.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files);
        if (!files.length) return;
        const readers = files.map(
          (f) =>
            new Promise((res, rej) => {
              const r = new FileReader();
              r.onload = (e) => res(e.target.result);
              r.onerror = rej;
              r.readAsDataURL(f);
            })
        );
        Promise.all(readers)
          .then((list) => {
            storedClothes = storedClothes.concat(list);
            saveJSON("clothesImages", storedClothes);
            populateClotheSelect();
            alert("تم رفع تلبيسات الألوان ✅");
            uploadClothes.value = "";
          })
          .catch(() => alert("فشل رفع التلبيسات"));
      });
    }

    function populateClotheSelect() {
      if (!clotheSelect) return;
      clotheSelect.innerHTML = "";
      if (!storedClothes.length) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "لا توجد تلبيسات";
        clotheSelect.appendChild(opt);
        return;
      }
      storedClothes.forEach((d, i) => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = `تلبيس ${i + 1}`;
        clotheSelect.appendChild(opt);
      });
    }
    populateClotheSelect();

    // --- رفع خطوط (uploadFonts) ---
    if (uploadFonts) {
      uploadFonts.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files);
        if (!files.length) return;
        const readers = files.map(
          (f) =>
            new Promise((res, rej) => {
              const r = new FileReader();
              r.onload = (e) => res({ name: f.name, data: e.target.result });
              r.onerror = rej;
              r.readAsDataURL(f);
            })
        );
        Promise.all(readers)
          .then((list) => {
            const existing = loadJSON("uploadedFonts", []);
            list.forEach((f) => {
              existing.push({ name: f.name, url: f.data });
              // register @font-face for preview
              const fontFaceName = f.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
              if (!document.getElementById("font-" + fontFaceName)) {
                const style = document.createElement("style");
                style.id = "font-" + fontFaceName;
                style.innerHTML = `@font-face{font-family:'${fontFaceName}';src:url('${f.data}');}`;
                document.head.appendChild(style);
              }
            });
            saveJSON("uploadedFonts", existing);
            storedFonts = existing;
            populateFontSelect();
            alert("تم رفع الخطوط وحفظها ✅");
            uploadFonts.value = "";
          })
          .catch(() => alert("فشل رفع الخطوط"));
      });
    }

    function populateFontSelect() {
      if (!fontSelect) return;
      fontSelect.innerHTML = "";
      // خطوط افتراضية
      const defaults = [
        "Cairo",
        "Reem Kufi",
        "Amiri",
        "Tajawal",
        "Noto Kufi Arabic",
        "El Messiri",
        "Changa",
      ];
      defaults.forEach((f) => {
        const o = document.createElement("option");
        o.value = f;
        o.textContent = f;
        fontSelect.appendChild(o);
      });
      // خطوط مرفوعة
      const uploaded = loadJSON("uploadedFonts", []);
      uploaded.forEach((f) => {
        const o = document.createElement("option");
        o.value = f.url;
        o.textContent = f.name;
        fontSelect.appendChild(o);
      });
    }
    populateFontSelect();

    // --- رفع ستايلات زخرفة الأسماء (json / js) ---
    if (uploadStyles) {
      uploadStyles.addEventListener("change", (ev) => {
        const files = Array.from(ev.target.files);
        if (!files.length) return;
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              if (file.name.toLowerCase().endsWith(".json")) {
                const parsed = JSON.parse(e.target.result);
                const all = loadJSON("nameStyles", []);
                all.push(parsed);
                saveJSON("nameStyles", all);
                storedNameStyles = all;
              } else if (file.name.toLowerCase().endsWith(".js")) {
                // حفظ نص JS كمرجع آمن (لا ننفذ)
                const all = loadJSON("nameStyles", []);
                all.push({ js: e.target.result, name: file.name });
                saveJSON("nameStyles", all);
                storedNameStyles = all;
              }
              alert(`تم إضافة ستايل: ${file.name}`);
            } catch (err) {
              console.warn("style load error", err);
              alert("فشل قراءة ملف الستايل — تأكد من الصيغة");
            }
          };
          reader.readAsText(file);
        });
        uploadStyles.value = "";
      });
    }
    storedNameStyles = loadJSON("nameStyles", []);

    // --- توليد زخارف الأسماء باستخدام الستايلات المرفوعة ---
    const genNameBtn = document.getElementById("genNameStyles");
    const nameInput = document.getElementById("nameInput");

    function applyDecorationStyle(text, style) {
      // style قد يكون: string, {pattern: "..."} أو {js: "...", name: "..."}
      if (!style) return text;
      try {
        if (typeof style === "string") return style.replace("{{text}}", text);
        if (typeof style === "object") {
          if (style.pattern && typeof style.pattern === "string") return style.pattern.replace("{{text}}", text);
          if (style.js && typeof style.js === "string") {
            // نحاول استخراج نمط pattern من داخل نص JS بشكل آمن (نبحث عن 'pattern' في النص)
            const m = style.js.match(/pattern\s*[:=]\s*['"`]([^'"`]+)['"`]/);
            if (m && m[1]) return m[1].replace("{{text}}", text);
            // أو نبحث عن سلاسل تحتوي {{text}} مباشرة
            const m2 = style.js.match(/['"`]([^'"`{]*\{\{text\}\}[^'"`]*)['"`]/);
            if (m2 && m2[1]) return m2[1].replace("{{text}}", text);
          }
        }
      } catch (e) {
        console.warn("applyDecorationStyle error", e);
      }
      return text;
    }

    function renderNameResults(text) {
      if (!nameResults) return;
      nameResults.innerHTML = "";
      const styles = loadJSON("nameStyles", []);
      if (!styles.length) {
        const no = document.createElement("div");
        no.className = "gold-card";
        no.textContent = "لا توجد ستايلات مرفوعة بعد — ارفعها من لوحة التحكم";
        nameResults.appendChild(no);
        return;
      }
      // نعرض حتى 100 نتيجة أو 2x50 إذا كانت ستايلات كثيرة
      const limit = Math.min(styles.length, 100);
      for (let i = 0; i < limit; i++) {
        const s = styles[i % styles.length];
        const out = applyDecorationStyle(text, s);
        const box = document.createElement("div");
        box.className = "name-box";
        box.textContent = out;
        nameResults.appendChild(box);
      }
    }

    if (genNameBtn && nameInput) {
      genNameBtn.addEventListener("click", () => {
        const v = (nameInput.value || "").trim();
        if (!v) return alert("أدخل الاسم أولاً");
        renderNameResults(v);
      });
    }

    // --- إضافة صورة + رابط لقسم اتصل بنا ---
    if (addContactImageBtn && contactImageFile && contactImageLink) {
      addContactImageBtn.addEventListener("click", () => {
        const file = contactImageFile.files ? contactImageFile.files[0] : null;
        const link = (contactImageLink.value || "").trim();
        if (!file || !link) return alert("اختر صورة وأدخل رابطاً");
        const reader = new FileReader();
        reader.onload = (e) => {
          const ci = loadJSON("contactImages", []);
          ci.push({ src: e.target.result, link });
          saveJSON("contactImages", ci);
          renderContactLinks();
          alert("تم إضافة الصورة مع الرابط لقسم اتصل بنا ✅");
          contactImageFile.value = "";
          contactImageLink.value = "";
        };
        reader.readAsDataURL(file);
      });
    }

    function renderContactLinks() {
      if (!contactLinks) return;
      contactLinks.innerHTML = "";
      const list = loadJSON("contactImages", []);
      if (!list.length) {
        const no = document.createElement("div");
        no.className = "gold-card";
        no.textContent = "لا توجد روابط بعد";
        contactLinks.appendChild(no);
        return;
      }
      list.forEach((ci) => {
        const a = document.createElement("a");
        a.href = ci.link;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = `<img src="${ci.src}" alt="contact" />`;
        contactLinks.appendChild(a);
      });
    }
    renderContactLinks();

    // --- حفظ نصوص "لمحة" و "اتصل بنا" من لوحة التحكم ---
    if (saveControl) {
      saveControl.addEventListener("click", () => {
        const a = aboutEditor ? aboutEditor.value.trim() : "";
        const c = contactEditor ? contactEditor.value.trim() : "";
        if (a && aboutText) aboutText.textContent = a;
        localStorage.setItem("aboutText", a);
        localStorage.setItem("contactText", c);
        alert("تم حفظ تعديلات لوحة التحكم ✅");
      });
    }

    // --- تطبيق تدرجات افتراضية للـ gradientSelect للواجهة ---
    (function populateDefaultGradients() {
      if (!gradientSelect) return;
      const gradients = [
        "linear-gradient(90deg,#ffd700,#ff8c00)",
        "linear-gradient(90deg,#ff9a9e,#fad0c4)",
        "linear-gradient(90deg,#a1c4fd,#c2e9fb)",
        "linear-gradient(90deg,#fbc2eb,#a6c1ee)",
        "linear-gradient(90deg,#ffecd2,#fcb69f)",
        "linear-gradient(90deg,#7f00ff,#e100ff)",
        "linear-gradient(90deg,#00c6ff,#0072ff)",
        "linear-gradient(90deg,#f7971e,#ffd200)"
      ];
      gradientSelect.innerHTML = "";
      gradients.forEach((g, i) => {
        const o = document.createElement("option");
        o.value = g;
        o.textContent = "تدرج " + (i + 1);
        gradientSelect.appendChild(o);
      });
    })();

    // --- تغيير اللون الأساسي للتطبيق وتخزينه ---
    if (primaryColorInput) {
      primaryColorInput.addEventListener("input", (e) => {
        const v = e.target.value;
        document.documentElement.style.setProperty("--primary-gold", v);
        localStorage.setItem("primaryColor", v);
      });
      // apply initial
      document.documentElement.style.setProperty("--primary-gold", savedPrimaryColor);
    }

    // --- تحميل الخطوط المخزنة مسبقاً (و register للعرض) ---
    (function loadUploadedFontsOnStart() {
      const uploaded = loadJSON("uploadedFonts", []);
      uploaded.forEach((f) => {
        const fontFaceName = f.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
        if (!document.getElementById("font-" + fontFaceName)) {
          const style = document.createElement("style");
          style.id = "font-" + fontFaceName;
          style.innerHTML = `@font-face{font-family:'${fontFaceName}';src:url('${f.url}');}`;
          document.head.appendChild(style);
        }
      });
    })();

    // --- helpers صغيرين لواجهة أخرى ---
    function populateClotheSelectSafely() {
      populateClotheSelect();
    }
    function populateFontSelectSafely() {
      populateFontSelect();
    }

    // --- تحميل المعطيات الأولية إلى الواجهة ---
    renderGallery();
    populateClotheSelectSafely();
    populateFontSelectSafely();
    renderContactLinks();

    // --- حفظ تلقائي قبل الخروج (خياري) ---
    window.addEventListener("beforeunload", () => {
      saveJSON("userImages", storedImages);
      saveJSON("clothesImages", storedClothes);
      saveJSON("uploadedFonts", storedFonts);
      saveJSON("nameStyles", storedNameStyles);
      saveJSON("contactImages", storedContactImages);
      // aboutText and contact text are saved when 'saveControl' clicked
    });

    // --- نهاية DOMContentLoaded ---
  });
})();