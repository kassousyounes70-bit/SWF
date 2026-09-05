/**
 * KDP PubEngine - Mascot Onboarding Tour
 * Single Source of Truth for both Arabic and English tools.
 * Built with vanilla JS, CSS-based pixel avatars, and dynamic pathfinding.
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

  // 3. Inject Core CSS for Mascots, Walking Mechanics, and Highlights
  const style = document.createElement('style');
  style.textContent = `
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

    #kdp-mascot-wrapper {
      position: absolute; z-index: 10000; display: flex; align-items: flex-end; gap: 15px; 
      font-family: var(--font-body); flex-direction: ${isRTL ? 'row-reverse' : 'row'};
      pointer-events: none;
    }
    #kdp-mascot-wrapper * { pointer-events: auto; }

    .kdp-bubble {
      background: var(--ink); color: var(--bg-deep); border: 3px solid var(--pixel-border);
      padding: 12px 16px; border-radius: 8px; max-width: 320px; box-shadow: var(--shadow-md);
      position: relative; font-size: 0.88rem; font-weight: 600; line-height: 1.5;
      animation: kdpPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .kdp-bubble::after {
      content: ""; position: absolute; bottom: 15px;
      ${isRTL ? 'left: -10px;' : 'right: -10px;'} 
      border-width: 10px; border-style: solid;
      border-color: transparent transparent transparent var(--ink);
      ${isRTL ? 'transform: rotate(180deg);' : ''}
    }
    .kdp-bubble-speaker {
      display: inline-block; background: var(--accent); color: var(--bg-deep);
      font-family: var(--font-pixel); font-size: 0.55rem; padding: 4px 8px;
      margin-bottom: 8px; border: 2px solid var(--pixel-border); box-shadow: 2px 2px 0 var(--pixel-border);
    }
    
    .kdp-tour-controls { margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end; }
    .kdp-tour-controls button {
      background: var(--bg-panel-2); color: var(--ink); border: 2px solid var(--pixel-border);
      font-family: var(--font-body); font-size: 0.75rem; font-weight: bold; padding: 6px 12px;
      cursor: pointer; box-shadow: 2px 2px 0 var(--pixel-border); transition: transform 0.1s;
    }
    .kdp-tour-controls button:active { transform: translate(2px, 2px); box-shadow: none; }
    .kdp-tour-controls button.primary { background: var(--accent); color: var(--bg-deep); }
    .kdp-tour-controls button.danger { background: var(--danger); color: var(--bg-deep); }

    /* CSS Pixel Art Characters & Animation States */
    .kdp-avatar-box { display: flex; gap: 8px; align-items: flex-end; cursor: pointer; }
    .kdp-pixel-char {
      width: 48px; height: 48px; position: relative;
      image-rendering: pixelated; background-size: 100% 100%; transition: transform 0.2s;
    }
    .kdp-pixel-char:hover { transform: scale(1.1) translateY(-5px); }
    
    /* Animation States */
    .kdp-char-active { animation: kdpBounce 0.5s infinite alternate; }
    .kdp-walking .kdp-pixel-char { animation: kdpWalk 0.35s infinite linear; }
    .kdp-flip { transform: scaleX(-1); }

    /* Yuki (Boy) - Blue Theme Pixel Matrix */
    .kdp-yuki {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="none"/><rect x="2" y="1" width="4" height="2" fill="%232980b9"/><rect x="2" y="3" width="4" height="3" fill="%23f1c27d"/><rect x="3" y="4" width="1" height="1" fill="%23000"/><rect x="5" y="4" width="1" height="1" fill="%23000"/><rect x="2" y="6" width="4" height="2" fill="%232c3e50"/></svg>');
    }
    /* Kira (Girl) - Red Theme Pixel Matrix */
    .kdp-kira {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="none"/><rect x="1" y="1" width="6" height="3" fill="%23c0392b"/><rect x="2" y="4" width="4" height="2" fill="%23f1c27d"/><rect x="3" y="4" width="1" height="1" fill="%23000"/><rect x="5" y="4" width="1" height="1" fill="%23000"/><rect x="2" y="6" width="4" height="2" fill="%23f1c40f"/></svg>');
    }

    @keyframes kdpPopIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes kdpBounce { 0% { transform: translateY(0); } 100% { transform: translateY(-4px); } }
    @keyframes kdpWalk {
      0%   { transform: translateY(0) rotate(0deg); }
      25%  { transform: translateY(-5px) rotate(8deg); }
      50%  { transform: translateY(0) rotate(0deg); }
      75%  { transform: translateY(-5px) rotate(-8deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }
  `;
  document.head.appendChild(style);

  // 4. Build DOM Elements
  const overlay = document.createElement('div');
  overlay.id = 'kdp-tour-overlay';
  document.body.appendChild(overlay);

  const wrapper = document.createElement('div');
  wrapper.id = 'kdp-mascot-wrapper';
  document.body.appendChild(wrapper);

  wrapper.innerHTML = `
    <div id="kdp-tour-bubble" class="kdp-bubble" style="display:none;">
      <div id="kdp-tour-speaker" class="kdp-bubble-speaker"></div>
      <div id="kdp-tour-text"></div>
      <div id="kdp-tour-controls" class="kdp-tour-controls"></div>
    </div>
    <div class="kdp-avatar-box" id="kdp-avatars">
      <div id="char-yuki" class="kdp-pixel-char kdp-yuki" title="${texts.yukiName}"></div>
      <div id="char-kira" class="kdp-pixel-char kdp-kira" title="${texts.kiraName}"></div>
    </div>
  `;

  const bubble = document.getElementById('kdp-tour-bubble');
  const speakerBadge = document.getElementById('kdp-tour-speaker');
  const textContainer = document.getElementById('kdp-tour-text');
  const controlsContainer = document.getElementById('kdp-tour-controls');
  const avatarsBox = document.getElementById('kdp-avatars');
  const charY = document.getElementById('char-yuki');
  const charK = document.getElementById('char-kira');

  // Set initial position of mascots (bottom of current viewport)
  wrapper.style.top = `${window.scrollY + window.innerHeight - 150}px`;
  wrapper.style.left = isRTL ? '20px' : `${window.innerWidth - 300}px`;

  // 5. State Management
  let currentStep = -1;
  let isTourActive = false;
  let sections = [];
  let isWalking = false;

  // 6. Core Functions
  function initSections() {
    sections = document.querySelectorAll('.cartridge');
    // Extend overlay height to cover the whole document
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

  // --- Dynamic Pathfinding & Walking Engine ---
  function walkTo(targetIndex, onComplete) {
    if (isWalking) return;
    isWalking = true;
    bubble.style.display = 'none'; // Hide dialog while walking
    clearFocus();

    const currentY = parseFloat(wrapper.style.top || 0);
    let targetY = window.scrollY + window.innerHeight - 150;
    let targetX = isRTL ? 20 : window.innerWidth - 300;

    let targetElement = null;
    if (targetIndex !== null && sections[targetIndex]) {
        targetElement = sections[targetIndex];
        const rect = targetElement.getBoundingClientRect();
        targetY = rect.top + window.scrollY - 80; // Stand slightly above the cartridge
        
        // Calculate X position based on language and container bounds
        const wrapRect = document.querySelector('.wrap').getBoundingClientRect();
        targetX = isRTL ? (wrapRect.right - 400) : (wrapRect.left + 20);
    }

    // Determine Walking Direction for Flipping Avatars
    if (targetY < currentY) {
       // Walking up
       avatarsBox.classList.remove('kdp-flip');
    } else {
       // Walking down
       avatarsBox.classList.add('kdp-flip');
    }

    // Calculate dynamic duration based on distance (speed = distance/time)
    const distance = Math.abs(targetY - currentY);
    const duration = Math.max(0.8, Math.min(2.5, distance / 400)); // Between 0.8s and 2.5s

    // Start Walking Animation
    wrapper.classList.add('kdp-walking');
    wrapper.style.transition = `top ${duration}s ease-in-out, left ${duration}s ease-in-out`;
    wrapper.style.top = `${targetY}px`;
    wrapper.style.left = `${targetX}px`;

    // Smooth scroll the viewport alongside the characters
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Await arrival
    setTimeout(() => {
        wrapper.classList.remove('kdp-walking');
        avatarsBox.classList.remove('kdp-flip');
        
        if (targetElement) {
            overlay.classList.add('active');
            targetElement.classList.add('kdp-tour-focus');
        }
        
        isWalking = false;
        if (onComplete) onComplete();
    }, duration * 1000);
  }

  // 7. Tour Flow Logic
  window.KDP_startTour = function() {
    initSections();
    isTourActive = true;
    currentStep = 0;
    showStep();
  };

  window.KDP_endTour = function(speaker = 'Y', idleMsg = texts.idleY) {
    isTourActive = false;
    currentStep = -1;
    walkTo(null, () => {
       renderDialog(speaker, idleMsg, `<button id="btn-close-bubble">✕</button>`);
    });
  };

  function showStep() {
    if (currentStep >= texts.steps.length) {
      window.KDP_endTour('Y', texts.idleY);
      return;
    }

    const stepData = texts.steps[currentStep];
    
    // Command the characters to walk to the target before speaking
    walkTo(stepData.target, () => {
        let btns = `<button id="btn-end" class="danger">${texts.btnEnd}</button>`;
        btns += `<button id="btn-next" class="primary">${texts.btnNext}</button>`;
        renderDialog(stepData.s, stepData.t, btns);
    });
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
    // If there are no cartridges, it's the "Stupid File" (Login page), abort or show specific msg
    initSections();
    if (sections.length === 0) return; // Silent abort for unsupported pages

    // Start with Welcome Message at initial spawn point
    const initialBtns = `<button id="btn-no">${texts.btnNo}</button><button id="btn-yes" class="primary">${texts.btnYes}</button>`;
    renderDialog('Y', `<strong>${texts.welcomeY}</strong><br><br>${texts.welcomeK}`, initialBtns);
    
  }, 1500);

  // Click avatars to reopen bubble if closed
  charY.onclick = () => { if(!isTourActive && !isWalking) renderDialog('Y', texts.idleY, `<button id="btn-close-bubble">✕</button>`); };
  charK.onclick = () => { if(!isTourActive && !isWalking) renderDialog('K', texts.idleK, `<button id="btn-close-bubble">✕</button>`); };

  // Recalculate positions if window resizes
  window.addEventListener('resize', () => {
    if(!isWalking && !isTourActive) {
      wrapper.style.top = `${window.scrollY + window.innerHeight - 150}px`;
      wrapper.style.left = isRTL ? '20px' : `${window.innerWidth - 300}px`;
    }
  });

})();
