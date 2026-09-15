/* Windows copy; dialogue/module content preserved. */
/**
 * KDP PubEngine - Mascot Help / Module Guide Extension
 *
 * Add this file AFTER mascot-tour.js and mascot-events.js.
 * It is self-initializing: once loaded it adds the Help menu to Yuki/Kira
 * clicks, guides the user through the configured modules, scrolls to the
 * correct section, highlights exact controls when possible, and randomly
 * selects one of six closing exchanges.
 *
 * This file intentionally does not replace the existing mascot artwork.
 */
(function initMascotHelp(){
  'use strict';

  const WAIT_MS = 250;
  const MAX_WAIT = 40;
  let tries = 0;
  let initialized = false;

  function boot(){
    const bubble = document.getElementById('kdp-tour-bubble');
    const text = document.getElementById('kdp-tour-text');
    const controls = document.getElementById('kdp-tour-controls');
    const speaker = document.getElementById('kdp-tour-speaker');
    const yuki = document.getElementById('char-yuki');
    const kira = document.getElementById('char-kira');
    if (!bubble || !text || !controls || !speaker || !yuki || !kira) {
      if (++tries < MAX_WAIT) setTimeout(boot, WAIT_MS);
      return;
    }
    if (initialized) return;
    initialized = true;

    const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    const ar = lang === 'ar';

    const UI = ar ? {
      helpTitle: 'كيف تريد أن أساعدك؟',
      next: 'التالي ❯',
      close: '✕',
      end: 'إنهاء الشرح ✕',
      selectHint: 'اختر الوحدة التي تريد أن أشرحها لك:',
      missing: 'لم أتمكن من العثور على هذا العنصر في الصفحة الحالية.',
      endingDelay: 260,
      yuki: 'يوكي', kira: 'كيرا'
    } : {
      helpTitle: 'How would you like me to help you?',
      next: 'Next ❯',
      close: '✕',
      end: 'End guide ✕',
      selectHint: 'Choose the module you would like me to explain:',
      missing: 'I could not find this element on the current page.',
      endingDelay: 260,
      yuki: 'Yuki', kira: 'Kira'
    };

    const endings = ar ? [
      { y:'وهنا نكون قد انتهينا من شرح هذه الوحدة. إذا احتجت إلى أي مساعدة أو واجهت أي مشكلة، فنحن هنا لمساعدتك. 😊', k:'لا تتردد في طلب المساعدة، وسنكون سعداء بالوقوف إلى جانبك! 🌷' },
      { y:'بهذا نكون قد أكملنا شرح هذه الوحدة. وإذا احتجت إلى مساعدة في أي وقت، فنحن هنا من أجلك.', k:'فقط أخبرنا بما تحتاج إليه، وسنحاول مساعدتك بأفضل طريقة ممكنة! 😊' },
      { y:'وهكذا أصبحت لديك فكرة واضحة عن هذه الوحدة. وإذا واجهت أي صعوبة أثناء استخدامها، يمكنك دائمًا الاعتماد علينا.', k:'نحن هنا عندما تحتاج إلينا، فلا تتردد في طلب المساعدة! ✨' },
      { y:'انتهى شرح هذه الوحدة، وأصبح بإمكانك استخدامها بكل سهولة. وإذا احتجت إلى أي توضيح أو مساعدة، فنحن هنا.', k:'لا تقلق إذا واجهتك مشكلة، فقط أخبرنا وسنساعدك في حلها. 😊' },
      { y:'وبذلك نكون قد انتهينا من هذه الوحدة. تذكّر أن فريقنا موجود دائمًا لمساعدتك إذا احتجت إلى أي شيء.', k:'سواء كان لديك سؤال أو واجهت مشكلة، نحن هنا لمساعدتك! 🌷' },
      { y:'وصلنا إلى نهاية شرح هذه الوحدة. إذا احتجت إلى مساعدة أثناء استخدام الأداة، فلا تتردد في التواصل معنا.', k:'سنكون هنا عندما تحتاج إلينا، ونتمنى لك تجربة موفقة! ✨' }
    ] : [
      { y:'And that brings us to the end of this module. If you need any help or run into a problem, we are here to help. 😊', k:'Do not hesitate to ask for help. We will be happy to be by your side! 🌷' },
      { y:'That completes the explanation of this module. If you need help at any time, we are here for you.', k:'Just tell us what you need, and we will do our best to help! 😊' },
      { y:'And now you have a clear idea of this module. If you have any difficulty using it, you can always rely on us.', k:'We are here whenever you need us, so do not hesitate to ask for help! ✨' },
      { y:'That is the end of this module, and you can now use it with ease. If you need any clarification or help, we are here.', k:'Do not worry if you run into a problem. Just tell us and we will help you solve it. 😊' },
      { y:'And with that, we have finished this module. Remember that our team is always here to help if you need anything.', k:'Whether you have a question or face a problem, we are here to help! 🌷' },
      { y:'We have reached the end of this module. If you need help while using the tool, do not hesitate to reach out.', k:'We will be here whenever you need us, and we wish you a successful experience! ✨' }
    ];

    // Each step is deliberately independent. A step can point to an exact ID,
    // a list of IDs, or simply to the module cartridge. The first successful
    // target is highlighted.
    const modules = ar ? [
      {
        id:'projects', name:'📂 إدارة المشاريع', section:0,
        steps:[
          ['Y','مرحبًا! 👋 في هذا القسم لدينا شيء بسيط لكنه مهم جدًا: إدارة المشاريع.'],
          ['K','نعم! هذا المكان مخصص لحفظ مشروعك والعودة إليه لاحقًا، بدل أن تضطر إلى إعادة كل شيء من البداية. 😄'],
          ['Y','انظر هنا، ستجد زرًا باسم 💾 حفظ المشروع.',['saveProjectBtn']],
          ['K','هذا الزر هو الذي تحتاجه عندما تريد الاحتفاظ بعملك. اضغط عليه، وستقوم الأداة بحفظ مشروعك في ملف واحد بصيغة ".kdp".',['saveProjectBtn']],
          ['Y','وبذلك يصبح لديك ملف خاص بالمشروع يمكنك الاحتفاظ به على جهازك، واستخدامه لاحقًا عندما تريد متابعة العمل.'],
          ['K','والآن لدينا الزر الثاني: 📂 فتح مشروع.',['openProjectBtn']],
          ['Y','إذا كان لديك مشروع محفوظ مسبقًا، اضغط فتح مشروع، وستظهر لك نافذة اختيار الملفات.',['openProjectBtn']],
          ['K','اختر ملف المشروع الذي تريد فتحه، بشرط أن يكون ملف المشروع المحفوظ بصيغة ".kdp".',['openProjectInput']],
          ['Y','وبهذه الطريقة تستطيع استعادة مشروعك المحفوظ ومتابعته بدل البدء من الصفر.'],
          ['K','إذن الأمر بسيط جدًا:<br>💾 حفظ المشروع — لحفظ مشروعك في ملف ".kdp".<br>📂 فتح مشروع — لفتح ملف ".kdp" محفوظ والعودة إلى مشروعك.',['saveProjectBtn','openProjectBtn']],
          ['Y','احفظ مشروعك عندما تريد الاحتفاظ بعملك، وعندما تحتاج إليه مرة أخرى، افتح ملف ".kdp" الخاص به.',['saveProjectBtn','openProjectBtn']],
          ['K','وهكذا يبقى مشروعك محفوظًا ويمكنك العودة إليه ومتابعة عملك عندما تريد. 📂✨']
        ]
      },
      {
        id:'images', name:'🖼️ رفع ومعالجة الصور', section:1,
        steps:[
          ['Y','حسنًا، أمامك الآن قسم «رفع ومعالجة الصور». 🖼️ هذا هو المكان الذي تختار فيه صورك وتحدد الطريقة التي تريد أن تتم بها معالجتها.'],
          ['K','وأول شيء ستراه هنا هو «وضع اللون». لديك خياران، لذلك اختر ما يناسب الصور التي تعمل عليها.',['colorModeHybrid','colorModeBW']],
          ['Y','الخيار الأول هو «أبيض وأسود». عند اختياره، تعمل الأداة على الصور بنمط الأبيض والأسود.',['colorModeBW']],
          ['K','أما الخيار الثاني فهو «مختلط»، وهنا تكون طريقة الرفع مختلفة قليلًا، لأنك تستخدم صورة ملوّنة ونسخة خطوط بالأبيض والأسود.',['colorModeHybrid']],
          ['Y','وبعد اختيار وضع اللون، لديك إعداد «حدة الخطوط». يمكنك تحريك هذا الشريط لتغيير مستوى حدة الخطوط.',['thresholdSlider']],
          ['K','ثم لدينا «دقة المنحنى»، وهو الإعداد الذي يمكنك من ضبط دقة المنحنيات أثناء معالجة الصور.',['smoothSlider']],
          ['Y','والآن ارفع صورك من منطقة الرفع. 📤 يمكنك الضغط على المنطقة لاختيار الصور من جهازك، أو سحبها وإفلاتها فيها.',['fileInput','dropzone']],
          ['K','وهنا نصيحة مهمة جدًا إذا كان لديك عدد كبير من الصور: لا تحاول رفعها كلها دفعة واحدة. قسّم الصور إلى مجموعات وارفعها على دفعات.'],
          ['Y','بهذه الطريقة يكون التعامل مع الصور أسهل، خصوصًا عندما يكون عدد الصور كبيرًا.'],
          ['K','أما إذا اخترت وضع «مختلط»، فستظهر منطقتان للرفع.',['colorModeHybrid']],
          ['Y','الأولى «1) الصورة الملوّنة»، وهنا تختار الصورة الملوّنة.',['hybridColorInput','colorInput']],
          ['K','والثانية «2) نسخة الخطوط (أبيض وأسود)»، وهنا تختار نسخة الخطوط المقابلة لها.',['hybridLinesInput','linesInput']],
          ['Y','بعد تجهيز الدفعة، ستجد زر «1. حوّل الدفعة الحالية إلى فيكتور». اضغط عليه لبدء معالجة الصور الموجودة في الدفعة الحالية.',['processBtn']],
          ['K','وإذا أردت إزالة الصور الموجودة في الدفعة الحالية، استخدم «مسح الدفعة الحالية».',['clearBtn']],
          ['Y','أما «تفريغ الشبكة بالكامل» فيستخدم عندما تريد إزالة جميع الصور الموجودة في الشبكة.',['clearAllBtn']],
          ['K','وإذا ظهرت لديك صور فشلت معالجتها، فقد يظهر زر «🔄 استرداد الصور الفاشلة».',['retryAllFailedBtn']],
          ['Y','إذا ظهر هذا الزر، فهو مخصص لاسترداد الصور التي لم تنجح معالجتها، بدل التعامل معها كصور ناجحة.',['retryAllFailedBtn']],
          ['K','وتذكر: عندما يكون لديك عدد كبير من الصور، الأفضل أن تقسمها إلى مجموعات صغيرة وترفعها على دفعات بدل محاولة إرسالها كلها مرة واحدة.'],
          ['Y','وبذلك يمكنك التحكم في عملية الرفع والمعالجة بشكل أسهل، ومتابعة الصور الموجودة في الشبكة بوضوح. 🖼️✨']
        ]
      },
      {
        id:'print', name:'🖨️ إعدادات الطباعة KDP', section:2,
        steps:[
          ['Y','وصلنا الآن إلى قسم «إعدادات الطباعة KDP». هنا نضبط شكل الكتاب من ناحية المقاس، الهوامش، نوع الورق، والإطارات الداخلية.'],
          ['K','وأهم شيء أن نضبط هذه الإعدادات قبل أن نعتمد الصفحات، لأن كل واحدة منها تؤثر على طريقة تجهيز الكتاب للطباعة.'],
          ['Y','نبدأ من «مقاس الكتاب». الأداة توفر لنا عدة مقاسات جاهزة: 8.5×8.5، 8.5×11، 6×9، 7×10، و5×8.',['trimSizeGrid']],
          ['K','وإذا لم يكن المقاس الذي نريده موجودًا ضمن هذه الخيارات، يوجد خيار «مخصص»، ومنه نستطيع إدخال المقاس بأنفسنا.',['trimSizeGrid','customTrimW','customTrimH']],
          ['Y','عند اختيار المقاس، يظهر لنا أيضًا حقلا العرض (Trim) والطول (Trim). وهنا نحدد أبعاد الصفحة النهائية للكتاب.',['trimW','trimH']],
          ['K','وبعد ذلك نضبط المساحات الآمنة. لدينا «هامش علوي/سفلي» و«هامش أمان جانبي». هذه القيم تساعدنا على إبقاء العناصر المهمة بعيدًا عن الحواف ومناطق القص.',['marginTB','marginLR']],
          ['Y','ثم نجد خيار «حواف نازفة (Bleed) للمحتوى الداخلي». يمكن تفعيله أو إلغاؤه حسب إعدادات الكتاب والمحتوى الذي نجهزه.',['bleedToggle']],
          ['K','والجميل أن كل هذه الإعدادات موجودة في مكان واحد، بدل أن نبحث عن كل قيمة في مكان مختلف.'],
          ['Y','بعدها نصل إلى «نوع الورق (الداخلي)». من القائمة يمكن اختيار أبيض، كريمي، أو ملوّن.',['paperType']],
          ['K','وهذا الاختيار لا يبقى مجرد معلومة مكتوبة؛ الأداة تستخدمه ضمن الحسابات التي تعرضها لنا في الأسفل.',['mathPages','mathSpine','mathCoverDims','mathCost']],
          ['Y','في صندوق الحسابات ستظهر لنا أربع معلومات رئيسية: إجمالي الصفحات، سمك الكعب، أبعاد الغلاف الإلزامية، وتكلفة الطباعة التقديرية.',['mathPages','mathSpine','mathCoverDims','mathCost']],
          ['K','يعني بدل أن نترك الأرقام مبهمة، نستطيع رؤية نتيجة إعدادات الكتاب مباشرة في نفس القسم.'],
          ['Y','بالضبط. وكلما تغيرت الإعدادات أو بيانات الكتاب، نراجع القيم الظاهرة للتأكد من أنها مناسبة.'],
          ['K','ونصل الآن إلى «الإطارات الداخلية». هنا تظهر خيارات الإطارات التي يمكن استخدامها داخل صفحات الكتاب.',['frameGridContainer']],
          ['Y','الفكرة أن الإطار يُرسم آليًا على حدود الأمان، بحيث يكون بعيدًا عن منطقة القص قدر الإمكان.'],
          ['K','لذلك لا نحتاج إلى رسم إطار يدويًا لكل صفحة. نختار النمط المناسب من خيارات الإطارات، والأداة تتولى تطبيقه وفق حدود الأمان.',['frameGridContainer']],
          ['Y','وفي النهاية، قبل اعتماد إعدادات الطباعة، نراجع المقاس، الهوامش، إعداد الـBleed، نوع الورق، ونمط الإطار، ثم نلقي نظرة على صندوق الحسابات للتأكد من النتائج.'],
          ['K','بهذه الطريقة تكون إعدادات الكتاب واضحة ومضبوطة من البداية، والأرقام المهمة أمامنا بدل أن نخمنها.']
        ]
      },
      {
        id:'backcover', name:'🎨 الشعار وعناصر الغلاف الخلفي', section:3,
        steps:[
          ['Y','ننتقل الآن إلى قسم «الشعار وعناصر الغلاف الخلفي». هذا القسم مخصص لإضافة عناصر نريد ظهورها على الغلاف الخلفي، مثل الشعار أو نص ترويجي.'],
          ['K','والأجمل أن الأداة لا تجبرنا على استخدام الشعار بطريقة واحدة؛ لدينا وضع مختلط يجمع بين الخطوط واللون، أو وضع أبيض وأسود فقط.',['logoModeHybrid','logoModeBW']],
          ['Y','عند اختيار الوضع المختلط، نستخدم منطقتي الرفع الموجودتين أمامنا: «خطوط» و«ملوّنة». نضع نسخة الخطوط في الأولى، والصورة الملوّنة في الثانية.',['logoLinesInput','logoColorInput']],
          ['K','أما إذا كان العنصر الذي نريده أبيض وأسود فقط، فنختار وضع «أبيض وأسود فقط» ونعتمد على صورة الخطوط.',['logoModeBW','logoLinesInput']],
          ['Y','بعد تجهيز الصورة، يظهر لنا زر «إضافة كشعار (فيكتور)». عند استخدامه، تتم إضافة الشعار بصيغة فيكتور إلى عناصر الغلاف.',['addAsLogoBtn']],
          ['K','ويوجد أيضًا زر «إضافة كغلاف مصغر (فيكتور)»، وهو خيار مختلف لإضافة العنصر كغلاف مصغر.',['addAsMiniCoverBtn']],
          ['Y','وبجانب الأزرار توجد منطقة الحالة، والتي تساعدنا على معرفة حالة العنصر الذي نعمل عليه.',['logoStatus']],
          ['K','ثم نصل إلى جزء «نص ترويجي». هنا يمكننا كتابة عبارة نريد وضعها على الغلاف الخلفي، مثل عبارة قصيرة للترويج للسلسلة أو للكتاب.',['promoTextInput']],
          ['Y','بعد كتابة النص، نستطيع التحكم في عدة خصائص: نوع الخط، وزن الخط، حجم النص، ولون النص.',['promoFont','promoWeight','promoSize','promoColor']],
          ['K','ولدينا أيضًا خيار «حواف النص». يمكن ترك النص بدون حواف، أو اختيار حواف بيضاء أو سوداء حسب الشكل الذي نريده.',['promoOutline']],
          ['Y','والأهم أننا لا نحتاج إلى التخمين أثناء التعديل؛ توجد منطقة معاينة للنص تعرض لنا شكله قبل إضافته.',['promoPreviewBox','promoPreviewText']],
          ['K','فإذا عدّلنا الخط أو الحجم أو اللون، يمكننا رؤية النتيجة في المعاينة قبل اعتماد النص.'],
          ['Y','وعندما يصبح الشكل مناسبًا، نضغط «إضافة النص» لإضافته إلى عناصر الغلاف الخلفي.',['addPromoTextBtn']],
          ['K','وفي الأسفل توجد قائمة «عناصر الغلاف الخلفي المضافة»، حيث تظهر العناصر التي أضفناها إلى الغلاف.',['backCoverElementsList']],
          ['Y','وهكذا يمكن تجهيز الشعار والنص الترويجي بطريقة منظمة، مع معاينة إعدادات النص قبل إضافته، ثم متابعة العناصر التي تمت إضافتها من القائمة الموجودة أسفل القسم.']
        ]
      },
      {
        id:'spine', name:'📚 تخصيص الكعب (Spine)', section:4,
        steps:[
          ['Y','نصل الآن إلى قسم «تخصيص الكعب (Spine)». هنا نستطيع التحكم في شكل الكعب والعناصر التي تظهر عليه.'],
          ['K','والكعب هو الجزء الضيق الموجود بين الغلاف الأمامي والخلفي، لذلك المساحة فيه محدودة وتحتاج إلى ترتيب دقيق.'],
          ['Y','أول خيار هو «نمط خلفية الكعب». يمكننا اختيار «لون صلب» أو «صورة مخصصة (فيكتور)».',['spineBgMode']],
          ['K','عند اختيار اللون الصلب، تظهر مجموعة من الألوان الجاهزة، ويمكن أيضًا اختيار لون مخصص إذا أردنا لونًا مختلفًا.',['spineCustomColor']],
          ['Y','أما عند اختيار «صورة مخصصة (فيكتور)»، فتظهر إعدادات الصورة. يمكن استخدام الوضع المختلط الذي يجمع الخطوط واللون، أو اختيار «أبيض وأسود فقط».',['spineImgHybrid','spineImgBW']],
          ['K','وفي الوضع المختلط نستخدم منطقتي الرفع: واحدة لـ الخطوط وأخرى للصورة الملوّنة، تمامًا كما توضح الأداة أمامنا.',['spineLinesInput','spineColorInput']],
          ['Y','بعد تجهيز الصورة، نستخدم زر «المعالجة كفيكتور واستخدامها خلفية». الأداة تحول الصورة إلى SVG وتقوم باقتصاصها تلقائيًا وفق أبعاد الكعب الفعلية.',['setSpineImageBtn']],
          ['K','وهذه نقطة مهمة، لأن الكعب ليس له نفس مساحة الغلاف الأمامي أو الخلفي، والأداة تتعامل مع أبعاده الخاصة.'],
          ['Y','بعد ذلك نستطيع إضافة نص الكعب، مثل اسم الناشر. نكتب النص في خانة «نص الكعب (اسم الناشر)».',['spineTextInput']],
          ['K','ولدينا أيضًا خيارات الخط والوزن والحجم، حتى نضبط شكل اسم الناشر بما يناسب تصميم الكعب.',['spineTextFont','spineTextWeight','spineTextSize']],
          ['Y','قبل الإضافة يمكن الضغط على «معاينة» لرؤية شكل النص داخل الكعب.',['previewSpineTextBtn']],
          ['K','والمعاينة مفيدة خصوصًا لأن النص يظهر بشكل عمودي داخل مساحة ضيقة، لذلك من الأفضل التأكد من شكله قبل اعتماده.'],
          ['Y','عندما يصبح النص مناسبًا، نضغط «إضافة» ليتم وضعه ضمن عناصر الكعب.',['addSpineTextBtn']],
          ['K','وإذا أضفنا أكثر من عنصر، ستظهر العناصر الموجودة في القائمة أسفل إعدادات النص، مما يجعل إدارة عناصر الكعب أسهل.',['spineElementsList']],
          ['Y','والأداة تراعي أيضًا هامش الأمان المحسوب حسب سمك الكعب الفعلي، بحيث تُقيّد عناصر الكعب داخل المنطقة الآمنة.',['spineAdvisorBubble']],
          ['K','إذن لدينا هنا ثلاث نقاط أساسية: اختيار خلفية الكعب، إضافة صورة فيكتور عند الحاجة، ثم إضافة نص الكعب مع معاينته وضبطه.'],
          ['Y','وبعد ضبط هذه العناصر، يصبح الكعب جاهزًا ليظهر ضمن تصميم الغلاف وفق أبعاده الفعلية.']
        ]
      },
      {
        id:'cover', name:'🎬 محرك الغلاف الشامل', section:5,
        steps:[
          ['Y','نصل الآن إلى محرك الغلاف الشامل. ستجد هذا القسم بعنوان «محرك الغلاف الشامل (معاينة 2D)»، وهو يوفر مساحة عمل تفاعلية تجمع الغلاف الأمامي والكعب والغلاف الخلفي في معاينة واحدة.'],
          ['K','ولفتح المحرر، اضغط على زر «👁️ فتح محرر الغلاف الشامل». ستظهر أمامك مساحة العمل الخاصة بالغلاف.',['openCoverEngineBtn']],
          ['Y','داخل مساحة العمل ستجد الغلاف على لوحة تفاعلية. اضغط على أي عنصر تريد تعديله لتحديده.'],
          ['K','بعد تحديد العنصر، يمكنك التحكم فيه من الأزرار الموجودة أسفل مساحة العمل، وهذا مفيد خصوصًا عند استخدام الأداة من الهاتف لأنك تستطيع تحريك العنصر بخطوات واضحة بدل الاعتماد على السحب الدقيق.'],
          ['Y','إذا أردت تغيير حجم العنصر، استخدم زر «+» لتكبيره، أو زر «−» لتصغيره.',['coverEditor']],
          ['K','أما لتحريك العنصر، فاستخدم الأسهم الأربعة: ↑ للأعلى، ← لليسار، → لليمين، ↓ للأسفل.',['coverEditor']],
          ['Y','حرّك العنصر تدريجيًا حتى تصل إلى الموضع المناسب داخل تصميم الغلاف، ويمكنك الجمع بين التحريك وتغيير الحجم للوصول إلى النتيجة التي تريدها.'],
          ['K','وإذا حددت عنصرًا وأردت حذفه، سيظهر لك زر «🗑️ حذف العنصر المحدد». اضغط عليه لإزالة العنصر الذي قمت بتحديده.',['deleteSelectedCoverElement','deleteSelectedElement']],
          ['Y','وعندما تنتهي من ضبط الغلاف، اضغط على «✕ إغلاق وحفظ» الموجودة أعلى المحرر.',['closeCoverEngineBtn','closeCoverBtn']],
          ['K','وبذلك تُحفظ التعديلات التي أجريتها على تركيب الغلاف، ويمكنك إغلاق مساحة العمل بعد الانتهاء من ضبط العناصر.']
        ]
      },
      {
        id:'video', name:'🎬 الفيديو الترويجي', section:6,
        steps:[
          ['Y','الآن ننتقل إلى قسم «🎬 فيديو ترويجي (تقليب ثلاثي الأبعاد)». هذا القسم مخصص لإنشاء فيديو ترويجي للصفحات، وتتم المعالجة بالكامل على جهازك دون رفع الملفات إلى أي سيرفر.'],
          ['K','أول إعداد أمامنا هو «وضع الفيديو»، ومنه نختار الشكل الذي نريد أن يعمل به الفيديو.',['videoMode']],
          ['Y','لدينا ثلاثة أوضاع: عادي لعرض الصفحات بطريقة تقليب ثلاثي الأبعاد، مارفل لعرض كشف تلوين تدريجي للصفحات، وصحيفة هاري بوتر لعرض الفيديو داخل الصفحة بأسلوب خاص.',['videoMode']],
          ['K','وعند اختيار بعض الأوضاع، ستظهر إعدادات إضافية خاصة بها. لذلك لا تقلق إذا ظهرت لك خيارات جديدة بعد تغيير وضع الفيديو؛ هذه الخيارات مرتبطة بالوضع الذي اخترته.'],
          ['Y','في وضع مارفل يمكن ضبط نوع المؤقت بين مدة ثابتة لكل الصفحات أو التسارع التدريجي، كما يمكن تحديد مدة تأثير الكشف بالثواني.'],
          ['K','أما في وضع صحيفة هاري بوتر، فتظهر إعدادات خاصة بحركة دخول الفيديو، مثل مدة تلاشي الدخول ومدة بطء البداية بعد كل فيديو.'],
          ['Y','بعد ذلك نحدد عدد الصفحات المعروضة. يمكن اختيار عدد من صفحتين إلى 60 صفحة.',['videoPages']],
          ['K','ثم نحدد سرعة كل قلبة. توجد سرعات جاهزة: 0.5 ثانية، 0.9 ثانية، أو 1.4 ثانية، ويمكن أيضًا اختيار «مخصّصة» وإدخال المدة التي تريدها بين 0.2 و5 ثوانٍ.',['flipSpeed']],
          ['Y','وبالنسبة إلى شكل المشهد، يمكنك اختيار خلفية المشهد من ثلاثة خيارات: استوديو فاتح، استوديو داكن، أو تدرج دافئ.',['sceneBackground']],
          ['K','هناك أيضًا قسم «معاينة الجسيم (Particle)». تستطيع رؤية الجسيم المستخدم في التأثير، وتغيير حجمه من خلال شريط «تكبير الجسيم».',['particlePreview','particleScale']],
          ['Y','وإذا أردت استخدام جسيم خاص بك، اضغط على «📂 رفع جسيم مخصص» ثم اختر صورة الجسيم من جهازك.',['customParticleInput','uploadParticleBtn']],
          ['K','وفي وضع صحيفة هاري بوتر، إذا كان الفيديو الذي تم اختياره أطول من 11 ثانية، تظهر نافذة «قصّ الفيديو» لتحديد الجزء المطلوب، مع إمكانية معاينة المقطع المقصوص ثم تأكيد القص أو إلغائه.'],
          ['Y','بعد ضبط الإعدادات، استخدم زر «🎥 إنشاء فيديو ترويجي (MP4)» لبدء عملية التوليد.',['generateVideoBtn']],
          ['K','أثناء التوليد سيظهر شريط التقدم، وستتمكن من متابعة حالة العملية ونسبة الإنجاز.',['videoProgress','progress']],
          ['Y','وعند اكتمال إنشاء الفيديو، ستظهر معاينة الفيديو داخل المشغل الموجود في القسم.',['videoPreview','videoPlayer']],
          ['K','وإذا كانت النتيجة مناسبة، اضغط على «⬇️ تحميل الفيديو MP4» لحفظ الفيديو على جهازك.',['downloadVideoBtn','downloadVideoBtn']],
          ['Y','وهكذا تستطيع ضبط نمط الفيديو، وعدد الصفحات، والسرعة، والخلفية والتأثيرات المرئية، ثم إنشاء نسخة MP4 ومعاينتها وحفظها من داخل الأداة.']
        ]
      },
      {
        id:'export', name:'📦 التصدير النهائي', section:7,
        steps:[
          ['Y','نصل إلى قسم «التصدير النهائي»، وهو المكان الذي تختار منه الملفات التي تريد إخراجها وحفظها من الأداة.'],
          ['K','قبل التصدير، يوجد خيار مهم اسمه «إدراج صفحة بيضاء بعد كل صفحة تلوين»، وهو مفعّل افتراضيًا.',['blankPageAfterColoring','addBlankPage']],
          ['Y','وظيفة هذا الخيار هي إضافة صفحة بيضاء بعد كل صفحة تلوين، والهدف منه المساعدة على منع تلطّخ الألوان بين الصفحات.'],
          ['K','إذا كان هذا الخيار مناسبًا لطريقة إعداد كتابك، اترك علامة الاختيار كما هي. ويمكنك إلغاء تحديده إذا كنت لا تريد إدراج الصفحات البيضاء.'],
          ['Y','بعد ذلك ستجد مجموعة من أزرار التصدير والمعاينة.',['exportInteriorBtn','exportCoverBtn','exportZipBtn']],
          ['Y','أولًا، زر «👁️ معاينة المحتوى الداخلي» يفتح نافذة لمراجعة المحتوى الداخلي قبل إخراجه.',['previewInteriorBtn','previewBtn']],
          ['K','داخل المعاينة يظهر الغلاف الأمامي، ثم تظهر الصفحات الداخلية بترتيبها الحالي، مع الإطارات إن كانت موجودة.'],
          ['Y','بعد التأكد من شكل المحتوى، يمكنك استخدام زر «2. تحميل الداخلي (PDF)» لإخراج المحتوى الداخلي بصيغة PDF.',['exportInteriorBtn']],
          ['K','وهناك أيضًا زر «3. تحميل الغلاف (PDF)» لإخراج الغلاف بصيغة PDF.',['exportCoverBtn']],
          ['Y','أما إذا أردت الحصول على الملفات مجمعة في حزمة واحدة، فاستخدم زر «4. تحميل الكل (ZIP جاهز للرفع)».',['exportZipBtn']],
          ['K','وهذا يوفر عليك التعامل مع الملفات واحدًا واحدًا عندما تريد الاحتفاظ بالمخرجات مجمعة في ملف ZIP واحد.'],
          ['Y','ستجد أسفل أزرار التصدير أيضًا منطقة حالة التصدير، حيث يمكن أن تظهر رسائل مرتبطة بعملية الإخراج.',['exportStatus','exportStatusBox']],
          ['K','وإذا احتجت إلى مراجعة الصفحات مرة أخرى، يمكنك فتح المعاينة، التأكد من الترتيب والشكل، ثم إغلاق نافذة المعاينة والعودة إلى خيارات التصدير.',['previewInteriorBtn','previewBtn']],
          ['Y','بهذه الطريقة يمكنك معاينة المحتوى، ثم إخراج الملف الداخلي PDF، والغلاف PDF، أو الحزمة الكاملة ZIP حسب ما تحتاجه.']
        ]
      }
    ] : [
      {id:'projects',name:'📂 Manage Projects',section:0,steps:[
        ['Y','Hello! 👋 This section is simple but very important: Manage Projects.'],
        ['K','This is where you save your project and return to it later instead of starting everything from the beginning. 😄'],
        ['Y','Here you will find the 💾 Save project button.',['saveProjectBtn']],
        ['K','Use this button when you want to keep your work. The tool saves your project as one file in the ".kdp" format.',['saveProjectBtn']],
        ['Y','You can keep this project file on your device and use it later when you want to continue working.'],
        ['K','Now we have the second button: 📂 Open project.',['openProjectBtn']],
        ['Y','If you already have a saved project, press Open project and a file picker will appear.',['openProjectBtn']],
        ['K','Choose the project file you want to open, as long as it is the saved ".kdp" project file.',['openProjectInput']],
        ['Y','This lets you restore your saved project and continue instead of starting from zero.'],
        ['K','So it is very simple:<br>💾 Save project — saves your project as a ".kdp" file.<br>📂 Open project — opens a saved ".kdp" file and returns you to your project.',['saveProjectBtn','openProjectBtn']],
        ['Y','Save your project when you want to keep your work, and when you need it again, open its ".kdp" file.',['saveProjectBtn','openProjectBtn']],
        ['K','That way your project stays saved and you can return to it whenever you want. 📂✨']
      ]},
      {id:'images',name:'🖼️ Upload & Process Images',section:1,steps:[
        ['Y','We have now reached Upload & Process Images. 🖼️ This is where you choose your images and decide how they should be processed.'],
        ['K','The first thing you will see is Color mode. There are two choices, so pick the one that fits your images.',['colorModeHybrid','colorModeBW']],
        ['Y','The first option is Black & white. When selected, the tool processes images in black and white.',['colorModeBW']],
        ['K','The second option is Mixed. Here the upload is different because you use a colored image and a black-and-white line version.',['colorModeHybrid']],
        ['Y','After choosing the color mode, you have Line sharpness. Move this slider to change line sharpness.',['thresholdSlider']],
        ['K','Then there is Curve resolution, which lets you adjust curve precision during processing.',['smoothSlider']],
        ['Y','Now upload your images from the upload area. 📤 You can tap it to choose files or drag and drop them.',['fileInput','dropzone']],
        ['K','If you have many images, do not try to upload them all at once. Split them into groups and upload them in batches.'],
        ['Y','This makes handling the images easier, especially when the number of images is large.'],
        ['K','When you choose Mixed mode, two upload areas appear.',['colorModeHybrid']],
        ['Y','The first is 1) Colored image, where you choose the colored image.',['hybridColorInput','colorInput']],
        ['K','The second is 2) Lines version (Black & white), where you choose its matching line version.',['hybridLinesInput','linesInput']],
        ['Y','After preparing the batch, use 1. Convert current batch to vector to start processing the current batch.',['processBtn']],
        ['K','To remove the images in the current batch, use Clear current batch.',['clearBtn']],
        ['Y','Clear entire grid removes all images from the grid.',['clearAllBtn']],
        ['K','If some images fail, you may see 🔄 Recover failed images.',['retryAllFailedBtn']],
        ['Y','That button is for recovering images that did not process successfully.',['retryAllFailedBtn']],
        ['K','Remember: with many images, smaller batches are easier than trying to send everything at once.'],
        ['Y','This gives you better control over uploading and processing while keeping the grid easy to follow. 🖼️✨']
      ]},
      {id:'print',name:'🖨️ KDP Print Settings',section:2,steps:[
        ['Y','We now reach KDP Print Settings. Here we configure the book size, margins, paper type, and interior frames.'],
        ['K','It is important to set these before finalizing pages because each setting affects how the book is prepared for printing.'],
        ['Y','We start with Book size. The tool offers ready-made sizes: 8.5×8.5, 8.5×11, 6×9, 7×10, and 5×8.',['trimSizeGrid']],
        ['K','If our desired size is not listed, choose Custom and enter the size ourselves.',['trimSizeGrid','customTrimW','customTrimH']],
        ['Y','When a size is selected, Trim width and Trim height define the final page dimensions.',['trimW','trimH']],
        ['K','Then we set the safe areas: top/bottom margin and side safety margin. These keep important elements away from edges and trim zones.',['marginTB','marginLR']],
        ['Y','Next is Interior content Bleed, which can be enabled or disabled depending on the book and content.',['bleedToggle']],
        ['K','All these settings are together in one place, so we do not have to search for each value separately.'],
        ['Y','Then we reach Interior paper type. Choose white, cream, or colored.',['paperType']],
        ['K','This choice is used in the calculations shown below.',['mathPages','mathSpine','mathCoverDims','mathCost']],
        ['Y','The calculation box shows four main values: total pages, spine thickness, mandatory cover dimensions, and estimated print cost.',['mathPages','mathSpine','mathCoverDims','mathCost']],
        ['K','Instead of guessing, we can see the result of the book settings directly in this section.'],
        ['Y','Exactly. Whenever the settings or book data change, review the displayed values to make sure they are suitable.'],
        ['K','Now we reach Interior frames, where you can choose frame options for the book pages.',['frameGridContainer']],
        ['Y','The frame is drawn automatically at the safety boundary so it stays as far from the trim area as possible.'],
        ['K','You do not need to draw a frame manually on every page. Choose the style and the tool applies it according to the safety boundaries.',['frameGridContainer']],
        ['Y','Before finalizing print settings, review size, margins, Bleed, paper type, and frame style, then check the calculation box.'],
        ['K','This keeps the book settings clear and controlled from the beginning, with the important numbers visible instead of guessed.']
      ]},
      {id:'backcover',name:'🎨 Logo & Back Cover Elements',section:3,steps:[
        ['Y','Now we move to Logo and Back Cover Elements. This section is for adding items that should appear on the back cover, such as a logo or promotional text.'],
        ['K','The tool gives us more than one logo mode: Mixed, combining lines and color, or Black & white only.',['logoModeHybrid','logoModeBW']],
        ['Y','In Mixed mode, use the two upload areas: Lines and Colored. Put the line version in the first and the colored image in the second.',['logoLinesInput','logoColorInput']],
        ['K','If the element is black and white only, choose Black & white only and use the line image.',['logoModeBW','logoLinesInput']],
        ['Y','After preparing the image, use Add as logo (vector) to add the logo as a vector element.',['addAsLogoBtn']],
        ['K','There is also Add as thumbnail cover (vector), which adds it as a thumbnail cover.',['addAsMiniCoverBtn']],
        ['Y','The status area beside the buttons helps show the current state of the element.',['logoStatus']],
        ['K','Then we reach Promotional text, where you can type a short phrase for the back cover.',['promoTextInput']],
        ['Y','You can control font, weight, size, and text color.',['promoFont','promoWeight','promoSize','promoColor']],
        ['K','There is also Text edges: none, white, or black.',['promoOutline']],
        ['Y','A preview area shows how the text looks before you add it.',['promoPreviewBox','promoPreviewText']],
        ['K','So when you change the font, size, or color, you can see the result in the preview before confirming it.'],
        ['Y','When the result looks right, press Add text to place it in the back cover elements.',['addPromoTextBtn']],
        ['K','The Added back cover elements list below shows what has been added.',['backCoverElementsList']],
        ['Y','This lets you prepare the logo and promotional text in an organized way, previewing the text before adding it and then reviewing the elements list.']
      ]},
      {id:'spine',name:'📚 Customize Spine',section:4,steps:[
        ['Y','We now reach Customize Spine. Here we control the spine appearance and the elements placed on it.'],
        ['K','The spine is the narrow part between the front and back covers, so its limited space needs careful arrangement.'],
        ['Y','The first option is Spine background style: Solid color or Custom image (vector).',['spineBgMode']],
        ['K','With a solid color, choose from preset colors or select a custom color.',['spineCustomColor']],
        ['Y','With Custom image (vector), you can use Mixed mode or Black & white only.',['spineImgHybrid','spineImgBW']],
        ['K','In Mixed mode, use the Lines and Colored upload areas.',['spineLinesInput','spineColorInput']],
        ['Y','After preparing the image, use Process as vector and use as background. The tool converts it to SVG and crops it to the actual spine dimensions.',['setSpineImageBtn']],
        ['K','This matters because the spine does not have the same area as the front or back cover; the tool uses its own dimensions.'],
        ['Y','Next you can add spine text, such as the publisher name, in Spine text.',['spineTextInput']],
        ['K','Font, weight, and size options let you tune the publisher name for the spine design.',['spineTextFont','spineTextWeight','spineTextSize']],
        ['Y','Before adding it, press Preview to see the text inside the spine.',['previewSpineTextBtn']],
        ['K','Preview is especially useful because the text is vertical in a narrow area, so it is best to check it before confirming.'],
        ['Y','When the text looks right, press Add to place it among the spine elements.',['addSpineTextBtn']],
        ['K','If you add more than one element, they appear in the list below the text settings.',['spineElementsList']],
        ['Y','The tool also respects the calculated safety margin based on the actual spine thickness, keeping spine elements inside the safe area.',['spineAdvisorBubble']],
        ['K','So there are three main points: choose the spine background, add a vector image when needed, then add and preview the spine text.'],
        ['Y','After these elements are set, the spine is ready to appear in the cover design using its actual dimensions.']
      ]},
      {id:'cover',name:'🎬 Full Cover Engine',section:5,steps:[
        ['Y','Now we reach the Full Cover Engine. The Full Cover Engine (2D Preview) gives you an interactive workspace combining the front cover, spine, and back cover in one preview.'],
        ['K','To open the editor, press 👁️ Open Full Cover Editor. The cover workspace will appear.',['openCoverEngineBtn']],
        ['Y','Inside the workspace, the cover is displayed on an interactive canvas. Click an element to select it.'],
        ['K','After selecting an element, use the controls below the workspace. This is especially useful on phones because you can move the element in clear steps instead of relying on precise dragging.'],
        ['Y','To resize an element, use + to enlarge it or − to shrink it.',['coverEditor']],
        ['K','To move an element, use the four arrows: ↑ up, ← left, → right, ↓ down.',['coverEditor']],
        ['Y','Move the element gradually until it is in the right position, combining movement and resizing as needed.'],
        ['K','If you select an element and want to delete it, use 🗑️ Delete selected element.',['deleteSelectedCoverElement','deleteSelectedElement']],
        ['Y','When you finish, press ✕ Close & Save at the top of the editor.',['closeCoverEngineBtn','closeCoverBtn']],
        ['K','Your cover composition changes are then saved and the workspace can be closed.']
      ]},
      {id:'video',name:'🎬 Promo Video',section:6,steps:[
        ['Y','Now we move to 🎬 Promo Video (3D Flip). This section creates a promotional video for the pages, with processing done on your device without uploading the files to a server.'],
        ['K','The first setting is Video mode, where you choose how the video should work.',['videoMode']],
        ['Y','There are three modes: Normal for 3D page flipping, Marvel for a gradual coloring reveal, and Harry Potter Newspaper for a special in-page video style.',['videoMode']],
        ['K','Some modes show additional settings. Do not worry if new options appear after changing the mode; they belong to that mode.'],
        ['Y','In Marvel mode, choose a fixed duration per page or gradual acceleration, and set the reveal effect duration in seconds.'],
        ['K','In Harry Potter Newspaper mode, you can set video entry movement such as fade-in duration and the slow-start duration after each video.'],
        ['Y','Next choose the number of displayed pages, from 2 to 60.',['videoPages']],
        ['K','Then choose the flip speed: 0.5, 0.9, or 1.4 seconds, or Custom between 0.2 and 5 seconds.',['flipSpeed']],
        ['Y','For the scene, choose a light studio, dark studio, or warm gradient background.',['sceneBackground']],
        ['K','There is also a Particle preview. You can see the particle and change its size with the particle scale slider.',['particlePreview','particleScale']],
        ['Y','To use your own particle, press 📂 Upload custom particle and choose its image.',['customParticleInput','uploadParticleBtn']],
        ['K','In Harry Potter Newspaper mode, if the selected video is longer than 11 seconds, the Trim video window appears so you can choose the desired portion, preview it, and confirm or cancel.'],
        ['Y','After setting everything, use 🎥 Create promo video (MP4) to start generation.',['generateVideoBtn']],
        ['K','During generation, a progress bar shows the current state and percentage.',['videoProgress','progress']],
        ['Y','When generation is complete, the video preview appears in the player.',['videoPreview','videoPlayer']],
        ['K','If the result is suitable, press ⬇️ Download video MP4 to save it to your device.',['downloadVideoBtn']],
        ['Y','You can now set the video style, page count, speed, background, and visual effects, then generate, preview, and save an MP4 from the tool.']
      ]},
      {id:'export',name:'📦 Final Export',section:7,steps:[
        ['Y','We reach Final Export, where you choose the files you want to output and save from the tool.'],
        ['K','Before exporting, there is an important option called Insert a blank page after every coloring page, enabled by default.',['blankPageAfterColoring','addBlankPage']],
        ['Y','It adds a blank page after every coloring page to help prevent colors from bleeding between pages.'],
        ['K','If this fits your book, leave it checked. You can uncheck it if you do not want blank pages.'],
        ['Y','Next you will find export and preview buttons.',['exportInteriorBtn','exportCoverBtn','exportZipBtn']],
        ['Y','First, 👁️ Preview interior content opens a window to review the interior before output.',['previewInteriorBtn','previewBtn']],
        ['K','Inside the preview you see the front cover, then the interior pages in their current order, with frames when present.'],
        ['Y','After checking the content, use 2. Download interior (PDF) to export the interior as PDF.',['exportInteriorBtn']],
        ['K','There is also 3. Download cover (PDF) to export the cover as PDF.',['exportCoverBtn']],
        ['Y','If you want all files together, use 4. Download all (ZIP ready to upload).',['exportZipBtn']],
        ['K','This saves you from handling the output files one by one when you want them together in a single ZIP.'],
        ['Y','Below the export buttons is the export status area, where messages about the output process may appear.',['exportStatus','exportStatusBox']],
        ['K','If you need to review the pages again, open the preview, check the order and appearance, then close it and return to the export options.',['previewInteriorBtn','previewBtn']],
        ['Y','This lets you preview the content, then output the interior PDF, cover PDF, or the complete ZIP package as needed.']
      ]}
    ];

    function getSections(){
      return Array.from(document.querySelectorAll('.wrap > .cartridge'));
    }

    function findElement(ids){
      for (const id of (ids || [])) {
        const el = document.getElementById(id);
        if (el) return el;
      }
      return null;
    }

    function findSectionByText(module){
      const sections = getSections();
      if (sections[module.section]) return sections[module.section];
      const wanted = module.name.replace(/^\S+\s*/, '').toLowerCase();
      return sections.find(s => s.textContent.toLowerCase().includes(wanted)) || null;
    }

    function clearHighlights(){
      document.querySelectorAll('.kdp-help-focus').forEach(el => el.classList.remove('kdp-help-focus'));
      document.querySelectorAll('.kdp-help-section').forEach(el => el.classList.remove('kdp-help-section'));
    }

    function focusTarget(module, ids){
      clearHighlights();
      let target = findElement(ids);
      if (!target) target = findSectionByText(module);
      if (!target) return null;

      if (ids && ids.length && target !== findSectionByText(module)) {
        target.classList.add('kdp-help-focus');
      } else {
        target.classList.add('kdp-help-section');
      }

      const rect = target.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const top = Math.max(0, absoluteTop - Math.min(110, Math.max(55, window.innerHeight * 0.18)));
      window.scrollTo({top, behavior:'smooth'});
      return target;
    }

    function setSpeaker(s){
      yuki.classList.remove('kdp-char-active');
      kira.classList.remove('kdp-char-active');
      if (s === 'Y') {
        speaker.textContent = UI.yuki;
        speaker.style.background = 'var(--info)';
        yuki.classList.add('kdp-char-active');
      } else {
        speaker.textContent = UI.kira;
        speaker.style.background = 'var(--danger)';
        kira.classList.add('kdp-char-active');
      }
    }

    function render(s, html, buttons){
      setSpeaker(s);
      bubble.style.display = 'block';
      text.innerHTML = html;
      controls.innerHTML = buttons || '';
      positionBubbleNearSpeaker();
    }

    function positionBubbleNearSpeaker(){
      const active = document.querySelector('.kdp-char-active') || yuki;
      const r = active.getBoundingClientRect();
      const bw = bubble.offsetWidth || 300;
      const pad = 12;
      let x = r.left + r.width/2;
      x = Math.max(bw/2 + pad, Math.min(window.innerWidth - bw/2 - pad, x));
      bubble.style.left = `${x}px`;
      bubble.style.top = `${Math.max(12, r.top - 18)}px`;
      const shift = x - (r.left + r.width/2);
      bubble.style.setProperty('--tail-pos', `calc(50% - ${shift}px)`);
    }

    // Keep the help bubble attached while the mascots pace at the bottom.
    let raf = 0;
    function follow(){
      if (bubble.style.display !== 'none' && window.KDP_helpActive) positionBubbleNearSpeaker();
      raf = requestAnimationFrame(follow);
    }
    follow();

    let activeModule = null;
    let stepIndex = -1;
    let endingTimer = null;
    let guideMoveTimer = null;
    const guideMoveTimeouts = new Set();

    function guideCharSize(el){
      const r = el.getBoundingClientRect();
      return { w: r.width || 48, h: r.height || 48 };
    }

    function clampX(x, w){
      const pad = 8;
      return Math.max(pad, Math.min(window.innerWidth - w - pad, x));
    }

    function placeCharsInGuideBand(){
      const ySize = guideCharSize(yuki);
      const kSize = guideCharSize(kira);
      const bandY = Math.max(8, window.innerHeight - Math.max(ySize.h, kSize.h) - 18);
      const center = window.innerWidth / 2;
      const gap = 58;
      yuki.style.transition = 'none';
      kira.style.transition = 'none';
      yuki.style.top = `${bandY}px`;
      kira.style.top = `${bandY}px`;
      yuki.style.left = `${clampX(center - gap, ySize.w)}px`;
      kira.style.left = `${clampX(center + 6, kSize.w)}px`;
    }

    function stopGuidePacing(){
      clearInterval(guideMoveTimer);
      guideMoveTimer = null;
      guideCharTimeoutsClear();
    }

    function guideCharTimeoutsClear(){
      guideMoveTimeouts.forEach(t => clearTimeout(t));
      guideMoveTimeouts.clear();
    }

    function startGuidePacing(){
      stopGuidePacing();
      placeCharsInGuideBand();
      const move = (el, delay=0) => {
        const tid = setTimeout(() => {
          guideMoveTimeouts.delete(tid);
          if (!window.KDP_helpActive) return;
          const {w} = guideCharSize(el);
          const current = el.getBoundingClientRect();
          const minX = 8;
          const maxX = Math.max(minX, window.innerWidth - w - 8);
          const targetX = minX + Math.random() * Math.max(0, maxX - minX);
          const distance = Math.abs(targetX - current.left);
          const duration = Math.max(0.8, Math.min(2.2, distance / 90));
          el.style.transition = `left ${duration}s linear, top 0.18s ease-out`;
          el.classList.toggle('kdp-flip', targetX < current.left);
          el.classList.add('kdp-walking');
          el.style.top = `${Math.max(8, window.innerHeight - guideCharSize(el).h - 18)}px`;
          el.style.left = `${clampX(targetX, w)}px`;
          const stopId = setTimeout(() => {
            guideMoveTimeouts.delete(stopId);
            if (window.KDP_helpActive) el.classList.remove('kdp-walking');
          }, duration * 1000);
          guideMoveTimeouts.add(stopId);
        }, delay);
        guideMoveTimeouts.add(tid);
      };
      move(yuki, 50);
      move(kira, 420);
      guideMoveTimer = setInterval(() => {
        if (!window.KDP_helpActive) return;
        move(Math.random() < 0.5 ? yuki : kira);
      }, 1150);
    }

    function finishHelp(){
      clearTimeout(endingTimer);
      stopGuidePacing();
      activeModule = null;
      stepIndex = -1;
      window.KDP_helpActive = false;
      dimmer.style.display = 'none';
      clearHighlights();
      bubble.style.display = 'none';
      controls.innerHTML = '';
      yuki.classList.remove('kdp-char-active', 'kdp-walking');
      kira.classList.remove('kdp-char-active', 'kdp-walking');
      if (typeof window.KDP_resumeMascotRoaming === 'function') {
        try { window.KDP_resumeMascotRoaming(); } catch(e) {}
      } else if (typeof window.KDP_helpFinished === 'function') {
        try { window.KDP_helpFinished(); } catch(e) {}
      }
    }

    function showEnding(){
      clearHighlights();
      stopGuidePacing();
      const e = endings[Math.floor(Math.random() * endings.length)];
      render('Y', e.y, `<button id="kdp-help-ending-close" class="primary">${UI.close}</button>`);
      // Show the second half of the selected closing exchange automatically,
      // then close the complete ending after five seconds.
      clearTimeout(endingTimer);
      endingTimer = setTimeout(() => {
        if (!window.KDP_helpActive) return;
        render('K', e.k, `<button id="kdp-help-ending-close-2" class="primary">${UI.close}</button>`);
        const close2 = document.getElementById('kdp-help-ending-close-2');
        if (close2) close2.onclick = finishHelp;
        clearTimeout(endingTimer);
        endingTimer = setTimeout(finishHelp, 5000);
      }, 1500);
      const close = document.getElementById('kdp-help-ending-close');
      if (close) close.onclick = finishHelp;
    }

    function showStep(){
      if (!activeModule) return;
      if (stepIndex >= activeModule.steps.length) {
        showEnding();
        return;
      }
      const step = activeModule.steps[stepIndex];
      const ids = Array.isArray(step[2]) ? step[2] : [];
      focusTarget(activeModule, ids);
      const isLast = stepIndex === activeModule.steps.length - 1;
      const buttons = isLast
        ? `<button id="kdp-help-end" class="danger">${UI.end}</button><button id="kdp-help-next" class="primary">${UI.next}</button>`
        : `<button id="kdp-help-end" class="danger">${UI.end}</button><button id="kdp-help-next" class="primary">${UI.next}</button>`;
      render(step[0], step[1], buttons);
      document.getElementById('kdp-help-next').onclick = () => { stepIndex++; showStep(); };
      document.getElementById('kdp-help-end').onclick = finishHelp;
    }

    function startModule(module){
      if (!module) return;
      window.KDP_helpActive = true;
      dimmer.style.display = 'block';
      activeModule = module;
      stepIndex = 0;
      clearHighlights();
      startGuidePacing();
      showStep();
    }

    function showMenu(){
      if (window.KDP_isTourActive) return;
      window.KDP_helpActive = true;
      clearHighlights();
      setSpeaker('Y');
      const buttons = modules.map((m,i) => `<button class="kdp-help-module" data-index="${i}">${m.name}</button>`).join('');
      render('Y', `<strong>${UI.helpTitle}</strong><br><br>${UI.selectHint}`, buttons + `<button id="kdp-help-menu-close">${UI.close}</button>`);
      document.querySelectorAll('.kdp-help-module').forEach(btn => {
        btn.onclick = () => startModule(modules[Number(btn.dataset.index)]);
      });
      document.getElementById('kdp-help-menu-close').onclick = finishHelp;
    }

    const dimmer = document.createElement('div');
    dimmer.id = 'kdp-mascot-help-dimmer';
    dimmer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dimmer);

    const style = document.createElement('style');
    style.id = 'kdp-mascot-help-style';
    style.textContent = `
      #kdp-mascot-help-dimmer {
        position: fixed; inset: 0; z-index: 9996; display: none;
        background: rgba(0,0,0,.72);
        pointer-events: none;
      }
      .kdp-help-focus {
        position: relative !important;
        z-index: 9999 !important;
        outline: 4px solid var(--accent) !important;
        outline-offset: 5px !important;
        box-shadow: 0 0 0 8px var(--bg-deep), 0 0 28px rgba(94,201,143,.65) !important;
        filter: none !important;
      }
      .kdp-help-section {
        position: relative !important;
        z-index: 9999 !important;
        box-shadow: 0 0 0 4px var(--bg-deep), 0 0 0 8px var(--accent), 0 0 28px rgba(94,201,143,.55) !important;
      }
      #kdp-tour-controls .kdp-help-module { flex:1 1 180px; min-width:145px; text-align:center; }
      #kdp-tour-controls .kdp-help-module:hover { filter:brightness(1.05); }
    `;
    document.head.appendChild(style);

    // The click target is the character itself. The help extension owns the
    // click only when a guide is not already running.
    yuki.addEventListener('click', function(e){
      if (window.KDP_helpSuppressClick) return;
      if (window.KDP_isTourActive) return;
      e.stopImmediatePropagation();
      showMenu();
    }, true);
    kira.addEventListener('click', function(e){
      if (window.KDP_helpSuppressClick) return;
      if (window.KDP_isTourActive) return;
      e.stopImmediatePropagation();
      showMenu();
    }, true);

    // Expose a small public API for future modules/custom integrations.
    window.KDP_MascotHelp = {
      open: showMenu,
      start: startModule,
      finish: finishHelp,
      modules,
      endings
    };

    // Reposition after resize/scroll so the help bubble remains visible.
    window.addEventListener('resize', () => {
      if (window.KDP_helpActive) positionBubbleNearSpeaker();
    }, {passive:true});
    window.addEventListener('scroll', () => {
      if (window.KDP_helpActive) positionBubbleNearSpeaker();
    }, {passive:true});
  }

  boot();
})();
