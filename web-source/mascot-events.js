/**
 * KDP PubEngine - Mascot Event & AI Reaction System
 * Acts as the nervous system for Yuki & Kira, responding to tool events and idle states.
 * Built with non-blocking CSS animations for heavy processing tasks.
 */

(function initMascotEvents() {
  // 1. Language Detection
  const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const isRTL = lang === 'ar';

  // 2. Data Vault (Dialogues by Category)
  const T = {
    ar: {
      idle: [
        { s: "Y", t: "(يشخر ببطء)... Zzz... خمس دقائق أخرى فقط...", state: "sleeping" },
        { s: "K", t: "يوكي! استيقظ، أنت تنام وعيناك مفتوحتان!", state: "normal" },
        { s: "Y", t: "Zzz... لا، لا تأكلي قطعة البيتزا الأخيرة...", state: "sleeping" },
        { s: "K", t: "(ترتشف العصير)... ممم، عصير المانجو بارد ومنعش جداً اليوم!", state: "normal" },
        { s: "Y", t: "متى يحين وقت الغداء؟ أنا جائع لدرجة أنني أستطيع أكل شطيرتين بحجم عائلي.", state: "normal" },
        { s: "K", t: "هل أكلت كل البسكويت يا يوكي؟ لم تترك لي شيئاً!", state: "normal" },
        { s: "K", t: "يسسس! أخيراً هزمت هذا الوحش الصعب!", state: "playing" },
        { s: "Y", t: "(يضغط على الأزرار بسرعة)... لا لا، مستحيل أن أخسر مجدداً في هذه المرحلة!", state: "playing" },
        { s: "K", t: "يوكي، توقف عن الغش! لقد رأيتك تنظر إلى شاشتي.", state: "normal" },
        { s: "Y", t: "هل رأيتِ سترتي؟ لا أستطيع تذكر أين وضعتها البارحة.", state: "normal" },
        { s: "K", t: "أتساءل متى سينزل الموسم الجديد من مسلسلي المفضل...", state: "normal" },
        { s: "Y", t: "الجو غريب اليوم، أليس كذلك؟", state: "normal" },
        { s: "Y", t: "بجدية يا كيرا، هل تعتقدين أنهما كانا في فترة استراحة فعلاً؟", state: "normal" },
        { s: "K", t: "ابتعد عن شطيرتي! أنت تعرف جيداً أن كيرا لا تشارك طعامها أبداً!", state: "normal" },
        { s: "Y", t: "الحلقة الماضية من المسلسل كانت مضحكة جداً، لا أستطيع التوقف عن الضحك كلما تذكرتها.", state: "playing" },
        { s: "K", t: "ما رأيك أن نلعب \"ولد النار وبنت الماء\" لاحقاً؟ أنا سأختار فتاة الماء هذه المرة!", state: "playing" },
        { s: "Y", t: "أين وضعتُ بطاقة الذاكرة (Memory Card)؟ كنت على وشك إنهاء مرحلة صعبة جداً...", state: "normal" },
        { s: "K", t: "موسيقى لعبة \"بيتزا تاور\" (Pizza Tower) لا تفارق رأسي منذ الصباح!", state: "playing" },
        { s: "Y", t: "هل هناك من يلعب معي جولة سريعة؟ أحتاج لتحدٍ جديد.", state: "playing" },
        { s: "Y", t: "أشم رائحة حلويات تقليدية تُخبز في مكان ما... أنا أتضور جوعاً!", state: "normal" },
        { s: "K", t: "يا إلهي، أشتهي بعض حلويات اللوز مع كوب شاي بالنعناع الآن.", state: "normal" },
        { s: "Y", t: "لو كان بإمكاني تحويل هذه الملفات إلى قطع حلوى لفعلت ذلك فوراً.", state: "normal" },
        { s: "K", t: "هاتفي لا يتوقف عن الاهتزاز، أين وضعته؟", state: "playing" },
        { s: "Y", t: "الجو يبدو رائعاً اليوم... ربما يجب أن نخرج للمشي لاحقاً.", state: "normal" },
        { s: "K", t: "هل قمت بتحديث نظام هاتفك؟ لقد تغير شكل الأيقونات بالكامل ولم أعتد عليه بعد.", state: "playing" }
      ],
      actions: {
        save: [
          { s: "Y", t: "أضع أوراقك في خزانتي السرية... لا تقلق، مفتاحها معي فقط!", state: "working" },
          { s: "K", t: "أرتب ملفاتك في حقيبتي... كل شيء في أمان تام للرحلة القادمة.", state: "working" }
        ],
        scan: [
          { s: "K", t: "أمسح الغبار عن رسوماتك... ستلمع الآن وكأنها جديدة!", state: "working" },
          { s: "Y", t: "أحضر ألواني وأقلامي... سأجعل هذه الخطوط تبدو مذهلة في لمح البصر.", state: "working" }
        ],
        recover: [
          { s: "Y", t: "لا تقلق، سأقوم بمحاولة إنعاش هذه الصور فوراً!", state: "working" },
          { s: "K", t: "حسناً، لنجرب مرة أخرى... هذه المرة ستنجح بالتأكيد!", state: "working" }
        ],
        clear: [
          { s: "Y", t: "تنظيف شامل! وداعاً للزحمة القديمة.", state: "playing" },
          { s: "K", t: "رائع! مساحة عمل نظيفة تعني أفكاراً وإبداعاً جديداً.", state: "working" }
        ],
        print: [
          { s: "Y", t: "أرتدي قبعتي الهندسية! سأرتب شكل الكتاب ليكون على المقاس تماماً.", state: "working" },
          { s: "K", t: "أمسك شريط القياس الخاص بي... يمين قليلاً، يسار قليلاً... رائع، جاهز!", state: "working" }
        ],
        cover: [
          { s: "K", t: "أضع اللمسة الفنية الأخيرة هنا... واو، هذا الغلاف سيخطف الأنظار بالتأكيد.", state: "working" },
          { s: "Y", t: "أشعر وكأنني رسام مشهور! لوحتنا تكتمل وتصبح جاهزة.", state: "working" }
        ],
        promo: [
          { s: "K", t: "هدوء في الاستوديو! الكاميرا تدور... نصنع لك إعلاناً يخطف الأنفاس!", state: "working" },
          { s: "Y", t: "سأذهب لإحضار بعض الفشار بينما يكتمل تصوير فيلمك القصير.", state: "playing" }
        ],
        export: [
          { s: "Y", t: "أجهز الطابعات وأرتب الأوراق! كتابك أصبح حقيقة الآن.", state: "working" },
          { s: "K", t: "أربط الصندوق بشريط جميل. تفضل، حزمتك جاهزة للانطلاق للجمهور!", state: "working" }
        ]
      }
    },
    en: {
      idle: [
        { s: "Y", t: "(Snoring softly)... Zzz... Just five more minutes...", state: "sleeping" },
        { s: "K", t: "Yuki! Wake up, you're sleeping with your eyes open!", state: "normal" },
        { s: "Y", t: "Zzz... No, don't eat the last slice of pizza...", state: "sleeping" },
        { s: "K", t: "(Sips juice)... Mmm, this mango juice is so cold and refreshing today!", state: "normal" },
        { s: "Y", t: "When is lunchtime? I'm so hungry I could eat two family-sized sandwiches.", state: "normal" },
        { s: "K", t: "Did you eat all the cookies, Yuki? You didn't leave me any!", state: "normal" },
        { s: "K", t: "Yesss! I finally beat this hard boss!", state: "playing" },
        { s: "Y", t: "(Button mashing)... No, no, there's no way I lost this level again!", state: "playing" },
        { s: "K", t: "Yuki, stop cheating! I saw you looking at my screen.", state: "normal" },
        { s: "Y", t: "Have you seen my jacket? I can't remember where I put it yesterday.", state: "normal" },
        { s: "K", t: "I wonder when the new season of my favorite show is dropping...", state: "normal" },
        { s: "Y", t: "The weather is a bit weird today, isn't it?", state: "normal" },
        { s: "Y", t: "Seriously Kira, do you think they were really on a break?", state: "normal" },
        { s: "K", t: "Step away from my sandwich! You know very well that Kira doesn't share food!", state: "normal" },
        { s: "Y", t: "The last episode of the show was so funny, I can't stop laughing every time I remember it.", state: "playing" },
        { s: "K", t: "What do you say we play \"Fireboy and Watergirl\" later? I'm picking Watergirl this time!", state: "playing" },
        { s: "Y", t: "Where did I put my Memory Card? I was about to finish a really hard level...", state: "normal" },
        { s: "K", t: "The music from Pizza Tower has been stuck in my head since this morning!", state: "playing" },
        { s: "Y", t: "Anyone up for a quick match? I need a new challenge.", state: "playing" },
        { s: "Y", t: "I smell traditional sweets baking somewhere... I'm starving!", state: "normal" },
        { s: "K", t: "Oh man, I'm craving some almond sweets with a cup of mint tea right now.", state: "normal" },
        { s: "Y", t: "If I could turn these files into candy, I would do it immediately.", state: "normal" },
        { s: "K", t: "My phone keeps vibrating, where did I put it?", state: "playing" },
        { s: "Y", t: "The weather looks great today... maybe we should go for a walk later.", state: "normal" },
        { s: "K", t: "Did you update your phone's system? The icons completely changed and I'm still not used to it.", state: "playing" }
      ],
      actions: {
        save: [
          { s: "Y", t: "Putting your papers in my secret safe... Don't worry, I'm the only one with the key!", state: "working" },
          { s: "K", t: "Packing your files in my bag... Everything is completely safe for the next trip.", state: "working" }
        ],
        scan: [
          { s: "K", t: "Wiping the dust off your drawings... They will shine like new now!", state: "working" },
          { s: "Y", t: "Grabbing my colors and pens... I'll make these lines look amazing in a blink.", state: "working" }
        ],
        recover: [
          { s: "Y", t: "Don't worry, I'll try to revive these images right away!", state: "working" },
          { s: "K", t: "Alright, let's try again... This time it'll definitely work!", state: "working" }
        ],
        clear: [
          { s: "Y", t: "Total sweep! Goodbye clutter.", state: "playing" },
          { s: "K", t: "Awesome! A clean workspace means fresh creativity.", state: "working" }
        ],
        print: [
          { s: "Y", t: "Putting on my engineering hat! I'll shape the book to fit perfectly.", state: "working" },
          { s: "K", t: "Holding my measuring tape... a bit to the right, a bit to the left... Awesome, ready!", state: "working" }
        ],
        cover: [
          { s: "K", t: "Adding the final artistic touch here... Wow, this cover will definitely steal the show.", state: "working" },
          { s: "Y", t: "I feel like a famous painter! Our masterpiece is coming together and getting ready.", state: "working" }
        ],
        promo: [
          { s: "K", t: "Quiet on set! Camera is rolling... making a breathtaking commercial for you!", state: "working" },
          { s: "Y", t: "I'll go grab some popcorn while your short movie finishes filming.", state: "playing" }
        ],
        export: [
          { s: "Y", t: "Getting the printers ready and organizing the papers! Your book is a reality now.", state: "working" },
          { s: "K", t: "Tying the box with a pretty ribbon. Here you go, your package is ready to meet the audience!", state: "working" }
        ]
      }
    }
  };

  const texts = T[lang];

  // 3. Inject Animation CSS for Non-Blocking GPU rendering
  const style = document.createElement('style');
  style.textContent = `
    .kdp-sleeping { animation: kdpSleep 3s infinite ease-in-out !important; filter: grayscale(40%) brightness(0.8) !important; }
    .kdp-working { animation: kdpWork 0.2s infinite alternate !important; filter: drop-shadow(0 0 4px var(--accent)) !important; }
    .kdp-playing { animation: kdpPlay 0.15s infinite alternate !important; }

    @keyframes kdpSleep { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.92) translateY(3px); } }
    @keyframes kdpWork { 0% { transform: translateY(0) rotate(-6deg) scale(1.05); } 100% { transform: translateY(-5px) rotate(6deg) scale(1.05); } }
    @keyframes kdpPlay { 0% { transform: translateX(-3px) translateY(0); } 100% { transform: translateX(3px) translateY(-2px); } }
  `;
  document.head.appendChild(style);

  // 4. Interaction Engine
  let idleTimer = null;
  const IDLE_TIME_MS = 45000; // 45 seconds

  function getRandomDialog(array) {
      return array[Math.floor(Math.random() * array.length)];
  }

  function triggerDialog(dialogObj) {
      // Prevent interrupting the main educational tour if it's running
      if (window.KDP_isTourActive) return;

      const bubble = document.getElementById('kdp-tour-bubble');
      const textContainer = document.getElementById('kdp-tour-text');
      const controlsContainer = document.getElementById('kdp-tour-controls');
      const speakerBadge = document.getElementById('kdp-tour-speaker');
      const charY = document.getElementById('char-yuki');
      const charK = document.getElementById('char-kira');

      if (!bubble || !charY || !charK) return;

      // Reset states
      charY.className = 'kdp-pixel-char kdp-yuki';
      charK.className = 'kdp-pixel-char kdp-kira';

      // Setup Speaker (إزالة التحكم بالذيل من هنا وتسليمه للمحرك الفيزيائي في الملف الأول)
      if (dialogObj.s === 'Y') {
          speakerBadge.textContent = texts.yukiName || (lang === 'ar' ? 'يوكي' : 'Yuki');
          speakerBadge.style.background = 'var(--info)';
          charY.classList.add('kdp-char-active');
          if (dialogObj.state) charY.classList.add(`kdp-${dialogObj.state}`);
      } else {
          speakerBadge.textContent = texts.kiraName || (lang === 'ar' ? 'كيرا' : 'Kira');
          speakerBadge.style.background = 'var(--danger)';
          charK.classList.add('kdp-char-active');
          if (dialogObj.state) charK.classList.add(`kdp-${dialogObj.state}`);
      }

      // Render Text & Close Button
      bubble.style.display = 'block';
      textContainer.innerHTML = dialogObj.t;
      controlsContainer.innerHTML = `<button id="btn-close-event" style="padding:4px 10px; font-size:0.7rem; background:var(--bg-panel-2);">✕</button>`;
      
      document.getElementById('btn-close-event').onclick = () => {
          bubble.style.display = 'none';
          charY.className = 'kdp-pixel-char kdp-yuki';
          charK.className = 'kdp-pixel-char kdp-kira';
      };

      resetIdleTimer();
  }

  function triggerIdle() {
      const dialog = getRandomDialog(texts.idle);
      triggerDialog(dialog);
  }

  function resetIdleTimer() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(triggerIdle, IDLE_TIME_MS);
  }

  // 5. Connect to DOM Events
  // Bind standard browser events to reset the idle timer
  ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, resetIdleTimer, { passive: true });
  });

  // Function to safely attach to KDP tool buttons
  function bindAction(buttonId, actionCategory) {
      const btn = document.getElementById(buttonId);
      if (btn) {
          btn.addEventListener('click', () => {
              const dialog = getRandomDialog(texts.actions[actionCategory]);
              triggerDialog(dialog);
          });
      }
  }

  // Bind extracted IDs from the provided files to specific dialogue categories
  setTimeout(() => {
      // Save / Open
      bindAction('saveProjectBtn', 'save');
      bindAction('openProjectBtn', 'save');
      
      // Scan / Process
      bindAction('processBtn', 'scan');
      bindAction('retryAllFailedBtn', 'recover');
      bindAction('clearBtn', 'clear');
      bindAction('clearAllBtn', 'clear');
      
      // Print
      bindAction('trimSizeGrid', 'print');
      
      // Cover & Spine Elements
      bindAction('openCoverEngineBtn', 'cover');
      bindAction('addAsLogoBtn', 'cover');
      bindAction('addAsMiniCoverBtn', 'cover');
      bindAction('addPromoTextBtn', 'cover');
      bindAction('setSpineImageBtn', 'cover');
      bindAction('addSpineTextBtn', 'cover');
      
      // Promo Video
      bindAction('generateVideoBtn', 'promo');
      
      // Export
      bindAction('exportInteriorBtn', 'export');
      bindAction('exportCoverBtn', 'export');
      bindAction('exportZipBtn', 'export');

      // Start the idle engine
      resetIdleTimer();
  }, 2000); // Small delay to ensure all DOM elements are fully loaded

})();
