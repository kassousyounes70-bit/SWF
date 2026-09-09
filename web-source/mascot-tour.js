/**
 * KDP PubEngine - Mascot Onboarding Tour
 * Single Source of Truth for both Arabic and English tools.
 * Built with vanilla JS, CSS-based pixel avatars, AI Roaming, and Dynamic Drag & Drop.
 */

(function initMascotTour() {
  // 1. Language Detection
  const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const isRTL = lang === 'ar';

  // 2. Data Structure (Dialogues & Targets)
  const T = {
    ar: {
      yukiName: "يوكي", kiraName: "كيرا",
      welcomeY: "مرحباً بك يا صديقي كيف حالك؟ أنا \"يوكي\"، وهذه صديقتي \"كيرا\".",
      welcomeK: "أهلاً بك! نحن هنا لمساعدتك في تجهيز كتابك لنشره على أمازون بكل سهولة. هل تريد أن نأخذ جولة سريعة لنتعرف على الأداة؟",
      btnYes: "نعم، بالتأكيد! 🚀",
      btnNo: "لا، أعرف طريقي ✕",
      btnNext: "التالي ❯",
      btnEnd: "إنهاء الجولة ✕",
      skipY: "يبدو أنك خبير في هذه الأداة!",
      skipK: "بالتوفيق! نحن هنا إذا احتجت إلينا.",
      idleY: "سنكون متواجدين هنا بالجوار طوال الوقت!",
      idleK: "بالضبط! إذا احتجت إلى أي مساعدة، نحن في الخدمة!",
      steps: [
        { s: "Y", t: "رائع! اربط حزام الأمان، هيا بنا ننطلق!", target: null },
        { s: "K", t: "أولاً، من هنا (SAVE.SYS) يمكنك حفظ عملك في ملف واحد لتكملته لاحقاً، أو لفتح مشروع قديم.", target: 0 },
        { s: "Y", t: "تذكر دائماً أن تحفظ مشروعك لتتجنب فقدان أي جهد قمت به!", target: 0 },
        { s: "Y", t: "في هذا القسم، اسحب صورك وأفلتها لتتحول تلقائياً إلى رسومات عالية الدقة وجاهزة للطباعة.", target: 1 },
        { s: "K", t: "صحيح! ويمكنك تعديل وضوح الرسمة بلمسات بسيطة لتكون مثالية تماماً.", target: 1 },
        { s: "K", t: "وصلنا إلى (PRINT.CFG). من هنا تختار شكل كتابك النهائي وحجمه.", target: 2 },
        { s: "Y", t: "لا تقلق بشأن التفاصيل المعقدة، الأداة ستتولى ترتيب كل شيء ليقبله موقع أمازون فوراً!", target: 2 },
        { s: "Y", t: "في هذا القسم، أضف لمستك الخاصة على ظهر الكتاب بوضع شعارك أو كتابة كلمة جميلة للقراء.", target: 3 },
        { s: "K", t: "ويمكنك أيضاً تلوين النص وتزيينه ليخطف الأنظار!", target: 3 },
        { s: "K", t: "هنا نلون جانب الكتاب (الكعب)! اختر لونك المفضل أو ضع صورة واكتب اسمك كناشر.", target: 4 },
        { s: "Y", t: "لا تحمل هم الترتيب، نحن سنضبط كل شيء تلقائياً ليظهر الكتاب بشكل رائع ومرتب.", target: 4 },
        { s: "Y", t: "هذا هو الجزء الممتع! هنا ترى غلاف كتابك كاملاً أمام عينيك.", target: 5 },
        { s: "K", t: "حرك العناصر، كبرها أو صغرها كما تحب، لتصنع غلافاً مذهلاً بكل حرية!", target: 5 },
        { s: "K", t: "وقبل التصدير، هذا القسم يتيح لك صنع فيديو ترويجي مبهر لكتابك بضغطة زر.", target: 6 },
        { s: "Y", t: "جرب التأثيرات الرائعة مثل \"مارفل\" أو \"هاري بوتر\"! والمميز أن كل هذا يحدث مباشرة داخل جهازك.", target: 6 },
        { s: "Y", t: "أخيراً (EXPORT)! هنا تضغط لتحميل كتابك في ملف جاهز للرفع مباشرة على أمازون.", target: 7 },
        { s: "K", t: "نصيحة أخيرة: يمكنك إضافة صفحة فارغة بعد كل رسمة تلقائياً لحماية الألوان. بالتوفيق في نشر كتابك الأول!", target: 7 }
      ]
    },
    en: {
      yukiName: "Yuki", kiraName: "Kira",
      welcomeY: "Welcome, my friend! How are you? I'm \"Yuki\", and this is my friend \"Kira\".",
      welcomeK: "Hello! We are here to help you prepare your book for publishing on Amazon with ease. Would you like to take a quick tour to get to know the tool?",
      btnYes: "Yes, sure! 🚀",
      btnNo: "No, I know my way ✕",
      btnNext: "Next ❯",
      btnEnd: "End Tour ✕",
      skipY: "Looks like you're an expert here!",
      skipK: "Good luck! We're here if you need us.",
      idleY: "We will be right here around the corner all the time!",
      idleK: "Exactly! If you need any help, we are at your service!",
      steps: [
        { s: "Y", t: "Awesome! Fasten your seatbelt, let's go!", target: null },
        { s: "K", t: "First, from here (SAVE.SYS) you can save your work in a single file to continue later, or to open an old project.", target: 0 },
        { s: "Y", t: "Always remember to save your project so you don't lose any of your hard work!", target: 0 },
        { s: "Y", t: "In this section, drag and drop your images to automatically turn them into high-resolution, print-ready drawings.", target: 1 },
        { s: "K", t: "That's right! And you can adjust the clarity of the drawing with simple touches to make it absolutely perfect.", target: 1 },
        { s: "K", t: "We've reached (PRINT.CFG). From here you choose the final look and size of your book.", target: 2 },
        { s: "Y", t: "Don't worry about complicated details, the tool will handle arranging everything so Amazon accepts it instantly!", target: 2 },
        { s: "Y", t: "In this section, add your personal touch to the back of the book by placing your logo or writing a nice word for the readers.", target: 3 },
        { s: "K", t: "You can also color and decorate the text to catch everyone's eye!", target: 3 },
        { s: "K", t: "Here we color the side of the book (the spine)! Choose your favorite color or use an image, and write your name as the publisher.", target: 4 },
        { s: "Y", t: "Don't worry about the arrangement, we'll automatically adjust everything so the book looks great and neat.", target: 4 },
        { s: "Y", t: "This is the fun part! Here you see your full book cover right before your eyes.", target: 5 },
        { s: "K", t: "Move elements, enlarge or shrink them as you like, to freely create a stunning cover!", target: 5 },
        { s: "K", t: "Before exporting, this section lets you create a dazzling promo video for your book with a single click.", target: 6 },
        { s: "Y", t: "Try awesome effects like \"Marvel\" or \"Harry Potter\"! The best part is that all of this happens directly inside your device.", target: 6 },
        { s: "Y", t: "Finally (EXPORT)! Click here to download your book in a file ready for direct upload to Amazon.", target: 7 },
        { s: "K", t: "Final tip: you can automatically add a blank page after each drawing to protect the colors. Good luck publishing your first book!", target: 7 }
      ]
    }
  };
  const texts = T[lang];

  // 3. Inject Core CSS for Mascots, Layout, and Highlights
  const style = document.createElement('style');
  style.textContent = `
    /* إزالة المستطيل الأزرق المزعج في الهواتف */
    #kdp-tour-bubble *, .kdp-pixel-char { -webkit-tap-highlight-color: transparent; outline: none; }

    #kdp-tour-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.75); z-index: 9998;
      opacity: 0; pointer-events: none; transition: opacity 0.4s ease;
      height: 100%; min-height: 100vh;
    }
    #kdp-tour-overlay.active { opacity: 1; pointer-events: auto; }
    
    .kdp-tour-focus {
      position: relative !important; z-index: 9999 !important;
      box-shadow: 0 0 0 4px var(--bg-deep), 0 0 0 8px var(--accent), 0 0 40px rgba(94, 201, 143, 0.6) !important;
      transform: scale(1.01); transition: all 0.4s ease; background: var(--bg-panel) !important;
    }

    /* Bubble Styling - Free Floating */
    .kdp-bubble {
      position: fixed; z-index: 10001; 
      transform: translate(-50%, -100%); /* Centers over the character's head */
      background: var(--ink); color: var(--bg-deep); border: 3px solid var(--pixel-border);
      padding: 16px; border-radius: 12px; width: max-content; max-width: 85vw;
      box-shadow: 0 6px 0 rgba(0,0,0,0.15), var(--shadow-md); box-sizing: border-box;
      font-family: var(--font-body); font-size: 0.9rem; font-weight: 700; line-height: 1.6;
      animation: kdpPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    /* Dynamic Bubble Tail */
    .kdp-bubble::before {
      content: ""; position: absolute; top: 100%;
      left: var(--tail-pos, 50%); transform: translateX(-50%);
      border-width: 14px 14px 0 14px; border-style: solid;
      border-color: var(--pixel-border) transparent transparent transparent;
    }
    .kdp-bubble::after {
      content: ""; position: absolute; top: 100%;
      left: var(--tail-pos, 50%); transform: translateX(-50%);
      border-width: 9px 9px 0 9px; border-style: solid;
      border-color: var(--ink) transparent transparent transparent; margin-top: -4px;
    }

    .kdp-bubble-speaker {
      display: inline-block; background: var(--accent); color: var(--bg-deep);
      font-family: var(--font-pixel); font-size: 0.55rem; padding: 4px 8px;
      margin-bottom: 10px; border: 2px solid var(--pixel-border); box-shadow: 2px 2px 0 var(--pixel-border);
    }
    
    .kdp-tour-controls { margin-top: 14px; display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
    .kdp-tour-controls button {
      background: var(--bg-panel-2); color: var(--ink); border: 2px solid var(--pixel-border);
      font-family: var(--font-body); font-size: 0.8rem; font-weight: bold; padding: 8px 14px;
      cursor: pointer; box-shadow: 2px 2px 0 var(--pixel-border); transition: transform 0.1s;
    }
    .kdp-tour-controls button:active { transform: translate(2px, 2px); box-shadow: none; }
    .kdp-tour-controls button.primary { background: var(--accent); color: var(--bg-deep); }
    .kdp-tour-controls button.danger { background: var(--danger); color: var(--bg-deep); }

    /* CSS Pixel Art Characters - Floating Free */
    .kdp-pixel-char {
      width: 48px; height: 48px; position: fixed; z-index: 10000;
      image-rendering: pixelated; background-size: 100% 100%; 
      opacity: 0.85; filter: grayscale(15%); touch-action: none; cursor: grab;
    }
    .kdp-pixel-char:active { cursor: grabbing; }
    
    /* Animation States */
    .kdp-char-active { opacity: 1; filter: none; animation: kdpBounce 0.5s infinite alternate; }
    .kdp-walking { animation: kdpWalk 0.35s infinite linear; }
    .kdp-flip { transform: scaleX(-1); }

    /* Yuki (Boy) - Detailed 16x16 Pixel Matrix */
    .kdp-yuki {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="4" y="1" width="8" height="3" fill="%232c3e50"/><rect x="3" y="2" width="2" height="4" fill="%232c3e50"/><rect x="11" y="2" width="2" height="4" fill="%232c3e50"/><rect x="4" y="4" width="8" height="5" fill="%23f1c27d"/><rect x="5" y="6" width="2" height="2" fill="%23fff"/><rect x="6" y="6" width="1" height="1" fill="%23000"/><rect x="9" y="6" width="2" height="2" fill="%23fff"/><rect x="9" y="6" width="1" height="1" fill="%23000"/><rect x="7" y="8" width="2" height="1" fill="%23e74c3c"/><rect x="5" y="9" width="6" height="4" fill="%232980b9"/><rect x="3" y="9" width="2" height="3" fill="%232980b9"/><rect x="11" y="9" width="2" height="3" fill="%232980b9"/><rect x="3" y="12" width="2" height="1" fill="%23f1c27d"/><rect x="11" y="12" width="2" height="1" fill="%23f1c27d"/><rect x="5" y="13" width="6" height="2" fill="%231a252f"/><rect x="5" y="15" width="2" height="1" fill="%23000"/><rect x="9" y="15" width="2" height="1" fill="%23000"/></svg>');
    }
    /* Kira (Girl) - Detailed 16x16 Pixel Matrix */
    .kdp-kira {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="3" y="1" width="10" height="4" fill="%23c0392b"/><rect x="2" y="3" width="2" height="6" fill="%23c0392b"/><rect x="12" y="3" width="2" height="6" fill="%23c0392b"/><rect x="4" y="4" width="8" height="5" fill="%23f1c27d"/><rect x="5" y="6" width="2" height="2" fill="%23fff"/><rect x="6" y="6" width="1" height="1" fill="%23000"/><rect x="9" y="6" width="2" height="2" fill="%23fff"/><rect x="9" y="6" width="1" height="1" fill="%23000"/><rect x="7" y="8" width="2" height="1" fill="%23e74c3c"/><rect x="5" y="9" width="6" height="5" fill="%23f1c40f"/><rect x="3" y="9" width="2" height="3" fill="%23f1c27d"/><rect x="11" y="9" width="2" height="3" fill="%23f1c27d"/><rect x="5" y="14" width="2" height="1" fill="%23f1c27d"/><rect x="9" y="14" width="2" height="1" fill="%23f1c27d"/><rect x="5" y="15" width="2" height="1" fill="%238e44ad"/><rect x="9" y="15" width="2" height="1" fill="%238e44ad"/></svg>');
    }

    @keyframes kdpPopIn { 0% { transform: scale(0.8) translate(-50%, -100%); opacity: 0; } 100% { transform: scale(1) translate(-50%, -100%); opacity: 1; } }
    @keyframes kdpBounce { 0% { margin-top: 0; } 100% { margin-top: -6px; } }
    @keyframes kdpWalk {
      0%   { transform: rotate(0deg); }
      25%  { transform: rotate(8deg); }
      50%  { transform: rotate(0deg); }
      75%  { transform: rotate(-8deg); }
      100% { transform: rotate(0deg); }
    }
  `;
  document.head.appendChild(style);

  // 4. Build DOM Elements Directly in Body
  const overlay = document.createElement('div');
  overlay.id = 'kdp-tour-overlay';
  document.body.appendChild(overlay);

  const bubble = document.createElement('div');
  bubble.id = 'kdp-tour-bubble';
  bubble.className = 'kdp-bubble';
  bubble.style.display = 'none';
  bubble.innerHTML = `
    <div id="kdp-tour-speaker" class="kdp-bubble-speaker"></div>
    <div id="kdp-tour-text"></div>
    <div id="kdp-tour-controls" class="kdp-tour-controls"></div>
  `;
  document.body.appendChild(bubble);

  const charY = document.createElement('div');
  charY.id = 'char-yuki';
  charY.className = 'kdp-pixel-char kdp-yuki';
  charY.title = texts.yukiName;
  document.body.appendChild(charY);

  const charK = document.createElement('div');
  charK.id = 'char-kira';
  charK.className = 'kdp-pixel-char kdp-kira';
  charK.title = texts.kiraName;
  document.body.appendChild(charK);

  // Initial Placement
  function resetPositions() {
      const wWidth = window.innerWidth;
      const wHeight = window.innerHeight;
      charY.style.left = `${(wWidth / 2) - 40}px`;
      charY.style.top = `${wHeight - 80}px`;
      charK.style.left = `${(wWidth / 2) + 10}px`;
      charK.style.top = `${wHeight - 80}px`;
  }
  resetPositions();

  const speakerBadge = document.getElementById('kdp-tour-speaker');
  const textContainer = document.getElementById('kdp-tour-text');
  const controlsContainer = document.getElementById('kdp-tour-controls');

  // 5. State Management & Variables
  let currentStep = -1;
  let isTourActive = false;
  let sections = [];
  let aiInterval = null;

  // --- Dynamic Drag & Drop Engine ---
  function makeDraggable(el) {
      let isDragging = false, startX, startY, initialX, initialY;
      el.addEventListener('pointerdown', e => {
          isDragging = true;
          el.style.transition = 'none';
          el.classList.remove('kdp-walking');
          
          const rect = el.getBoundingClientRect();
          startX = e.clientX;
          startY = e.clientY;
          initialX = rect.left;
          initialY = rect.top;
          el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', e => {
          if (!isDragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          el.style.left = `${initialX + dx}px`;
          el.style.top = `${initialY + dy}px`;
      });
      el.addEventListener('pointerup', e => {
          isDragging = false;
          el.releasePointerCapture(e.pointerId);
      });
  }
  makeDraggable(charY);
  makeDraggable(charK);

  // --- Dynamic Global Bubble Tracking Engine (60 FPS) ---
  // تم تصحيح الخلل هنا: المحرك يبحث ديناميكياً عن الشخصية النشطة أياً كان مصدر الأمر
  function trackBubble() {
      const activeEl = document.querySelector('.kdp-char-active');
      if (bubble.style.display !== 'none' && activeEl) {
          const rect = activeEl.getBoundingClientRect();
          const bubbleW = bubble.offsetWidth;
          
          let targetX = rect.left + rect.width / 2;
          // Clamp bubble to window bounds so it's never cut off
          const padding = 15;
          if (targetX - bubbleW/2 < padding) targetX = bubbleW/2 + padding;
          if (targetX + bubbleW/2 > window.innerWidth - padding) targetX = window.innerWidth - bubbleW/2 - padding;

          // Adjust tail position dynamically to point at the character's head
          const shift = targetX - (rect.left + rect.width / 2);
          bubble.style.setProperty('--tail-pos', `calc(50% - ${shift}px)`);

          bubble.style.left = `${targetX}px`;
          bubble.style.top = `${rect.top - 18}px`; // Just above the head
      }
      requestAnimationFrame(trackBubble);
  }
  trackBubble();

  // --- AI Animation Systems ---
  function setWalkTransition(el, duration) {
      el.style.transition = `top ${duration}s linear, left ${duration}s linear`;
  }

  function startPacing() {
      clearInterval(aiInterval);
      aiInterval = setInterval(() => {
          [charY, charK].forEach(char => {
              if (window.KDP_helpActive) return;
              if (Math.random() > 0.6) return; // Sometimes stand still
              const rect = char.getBoundingClientRect();
              const offset = (Math.random() - 0.5) * 80; // move max 40px left or right
              let targetX = rect.left + offset;
              targetX = Math.max(10, Math.min(window.innerWidth - 60, targetX));
              
              setWalkTransition(char, 1);
              char.classList.toggle('kdp-flip', targetX < rect.left);
              char.classList.add('kdp-walking');
              char.style.left = `${targetX}px`;
              
              setTimeout(() => char.classList.remove('kdp-walking'), 1000);
          });
      }, 2500);
  }

  function startRoaming() {
      clearInterval(aiInterval);
      aiInterval = setInterval(() => {
          [charY, charK].forEach(char => {
              if (window.KDP_helpActive) return;
              if (Math.random() > 0.7) return; // Sometimes stand still
              const targetX = Math.max(10, Math.random() * (window.innerWidth - 60));
              const targetY = Math.max(10, Math.random() * (window.innerHeight - 60));
              
              const rect = char.getBoundingClientRect();
              const dist = Math.hypot(targetX - rect.left, targetY - rect.top);
              const duration = Math.max(1, dist / 80); // Speed calculation
              
              setWalkTransition(char, duration);
              char.classList.toggle('kdp-flip', targetX < rect.left);
              char.classList.add('kdp-walking');
              
              char.style.left = `${targetX}px`;
              char.style.top = `${targetY}px`;
              
              setTimeout(() => char.classList.remove('kdp-walking'), duration * 1000);
          });
      }, 3500);
  }

  // 6. Core Functions
  function initSections() {
    sections = document.querySelectorAll('.wrap > .cartridge');
    overlay.style.height = `${document.documentElement.scrollHeight}px`;
  }

  function clearFocus() {
    document.querySelectorAll('.kdp-tour-focus').forEach(el => el.classList.remove('kdp-tour-focus'));
    overlay.classList.remove('active');
  }

  function setSpeaker(type) {
    charY.classList.remove('kdp-char-active');
    charK.classList.remove('kdp-char-active');
    
    if (type === 'Y') {
      speakerBadge.textContent = texts.yukiName;
      speakerBadge.style.background = 'var(--info)';
      charY.classList.add('kdp-char-active');
    } else {
      speakerBadge.textContent = texts.kiraName;
      speakerBadge.style.background = 'var(--danger)';
      charK.classList.add('kdp-char-active');
    }
  }

  function renderDialog(speaker, text, buttonsHtml) {
    bubble.style.display = 'block';
    setSpeaker(speaker);
    textContainer.innerHTML = text;
    controlsContainer.innerHTML = buttonsHtml || '';
    bindButtons();
  }

  function jumpTo(targetIndex) {
    clearFocus();
    if (targetIndex !== null && sections[targetIndex]) {
        const targetElement = sections[targetIndex];
        overlay.classList.add('active');
        targetElement.classList.add('kdp-tour-focus');
        
        // التمرير مباشرة لجعل أعلى القسم مرئياً بوضوح
        const targetY = targetElement.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // 7. Tour Flow Logic
  // Public hook used by the help extension to return to free roaming.
  window.KDP_resumeMascotRoaming = function() { startRoaming(); };

  window.KDP_startTour = function() {
    initSections();
    isTourActive = true;
    currentStep = 0;
    resetPositions();
    startPacing(); // Start walking left/right during the tour
    showStep();
  };

  window.KDP_endTour = function(speaker = 'Y', idleMsg = texts.idleY) {
    isTourActive = false;
    currentStep = -1;
    clearFocus();
    renderDialog(speaker, idleMsg, `<button id="btn-close-bubble">✕</button>`);
    startRoaming(); // Start free roaming around the screen
  };

  function showStep() {
    if (currentStep >= texts.steps.length) {
      window.KDP_endTour('Y', texts.idleY);
      return;
    }

    const stepData = texts.steps[currentStep];
    jumpTo(stepData.target);
    
    let btns = `<button id="btn-end" class="danger">${texts.btnEnd}</button>`;
    btns += `<button id="btn-next" class="primary">${texts.btnNext}</button>`;
    renderDialog(stepData.s, stepData.t, btns);
  }

  function bindButtons() {
    const btnNext = document.getElementById('btn-next');
    const btnEnd = document.getElementById('btn-end');
    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');
    const btnClose = document.getElementById('btn-close-bubble');

    if (btnNext) btnNext.onclick = () => { currentStep++; showStep(); };
    if (btnEnd) btnEnd.onclick = () => window.KDP_endTour('K', texts.idleK);
    if (btnYes) btnYes.onclick = () => window.KDP_startTour();
    if (btnNo) btnNo.onclick = () => {
       renderDialog('Y', texts.skipY, `<button id="btn-close-bubble">✕</button>`);
       setTimeout(() => window.KDP_endTour('K', texts.skipK), 2000);
    };
    if (btnClose) btnClose.onclick = () => { bubble.style.display = 'none'; clearFocus(); charY.classList.remove('kdp-char-active'); charK.classList.remove('kdp-char-active'); };
  }

  // 8. Initialization (Triggers on load)
  setTimeout(() => {
    initSections();
    if (sections.length === 0) return; 

    // Start with Welcome Message and gentle pacing
    startPacing();
    const initialBtns = `<button id="btn-no">${texts.btnNo}</button><button id="btn-yes" class="primary">${texts.btnYes}</button>`;
    renderDialog('Y', `<strong>${texts.welcomeY}</strong><br><br>${texts.welcomeK}`, initialBtns);
    
  }, 1500);

  // Click avatars to reopen bubble if closed
  charY.onclick = () => { if(!isTourActive) renderDialog('Y', texts.idleY, `<button id="btn-close-bubble">✕</button>`); };
  charK.onclick = () => { if(!isTourActive) renderDialog('K', texts.idleK, `<button id="btn-close-bubble">✕</button>`); };

})();
