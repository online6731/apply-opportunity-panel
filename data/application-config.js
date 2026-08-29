(function () {
  "use strict";

  const both = ["mohammad", "arzoo"];

  window.APPLICATION_CONFIG = {
    schemaVersion: "1.0.0",
    updatedAt: "2026-08-30",
    locale: "fa-IR",
    direction: "rtl",
    storageKey: "apply-compass-readiness-v1",
    readinessModel: {
      stateSchema: {
        completed: "Record<stableItemId, true>",
        filters: {
          person: "all | mohammad | arzoo",
          path: "all | common | job | phd | masters | residency | modeling | business",
          criticalOnly: "boolean"
        }
      },
      trackableSources: [
        "checklistGroups[].items",
        "gaps",
        "portfolioProjects",
        "templates",
        "questionBank"
      ],
      excludedSources: ["redFlags", "deadlinePreparation"],
      completionRule: "An item is complete only when state.completed[item.id] === true.",
      denominatorRule: "Unique trackable item IDs matching the selected person, path and criticalOnly filter. Search text never changes the denominator.",
      personRule: "person=all includes any person; a named person includes shared and person-specific items whose persons array contains that key.",
      pathRule: "path=all includes every path; a named path includes items whose paths array contains that key."
    },
    people: {
      all: {
        label: "هر دو نفر",
        shortLabel: "همه",
        accent: "#315c4b"
      },
      mohammad: {
        label: "محمد پارسیان",
        shortLabel: "محمد",
        accent: "#315c4b",
        summary: "Applied AI، NeuroAI، مهندسی پژوهش و دکتری محاسباتی",
        links: [
          { label: "پروفایل GitHub", href: "https://github.com/online6731" },
          { label: "داشبورد فرصت‌ها", href: "../" }
        ]
      },
      arzoo: {
        label: "آرزو براهویی",
        shortLabel: "آرزو",
        accent: "#b85c4a",
        summary: "هنر نساجی، مد پایدار، میراث بلوچ، مدلینگ و کارآفرینی فرهنگی",
        links: [
          { label: "پروفایل آری‌دوچ", href: "../arzoo/" },
          { label: "داشبورد فرصت‌ها", href: "../" }
        ]
      }
    },
    paths: {
      all: { label: "همه مسیرها", icon: "◈" },
      common: { label: "پایه مشترک", icon: "✓" },
      job: { label: "کار", icon: "▣" },
      phd: { label: "دکتری", icon: "◎" },
      masters: { label: "ارشد و بورسیه", icon: "◇" },
      residency: { label: "رزیدنسی و جایزه", icon: "✦" },
      modeling: { label: "مدلینگ", icon: "◉" },
      business: { label: "کسب‌وکار و فروش", icon: "↗" }
    },
    priorityLabels: {
      critical: "بحرانی",
      high: "مهم",
      medium: "تکمیلی",
      optional: "اختیاری"
    },

    checklistGroups: [
      {
        id: "common-identity",
        title: "هویت، تحصیل و اسناد پایه",
        description: "یک نسخه مرجع و سازگار از اطلاعات رسمی؛ بدون ذخیره‌کردن داده حساس در این پنل.",
        paths: ["common"],
        items: [
          {
            id: "common-passport-validity",
            persons: both,
            paths: ["common", "job", "phd", "masters", "residency", "modeling", "business"],
            priority: "critical",
            title: "اعتبار پاسپورت و املای لاتین نام کنترل شده",
            detail: "نام انگلیسی در همه فایل‌ها دقیقاً با پاسپورت یکسان باشد و اعتبار پاسپورت برای دوره سفر/تحصیل کافی باشد. شماره یا تصویر پاسپورت در localStorage ذخیره نشود.",
            evidence: "یادداشت داخلیِ تأییدشده؛ بدون درج شماره مدرک"
          },
          {
            id: "common-canonical-name",
            persons: both,
            paths: ["common", "job", "phd", "masters", "residency", "modeling", "business"],
            priority: "critical",
            title: "یک املای لاتین مرجع برای نام انتخاب شده",
            detail: "رزومه، پورتفولیو، پروفایل، توصیه‌نامه و فرم‌ها از یک نام استفاده کنند؛ نام‌های قدیمی فقط در بخش previous names فرم رسمی بیایند.",
            personNotes: {
              mohammad: "نام GitHub، CV و مدارک دانشگاهی مقایسه شود.",
              arzoo: "میان Arezou / Arzoo و Barahoie / Baravi یک نسخه پاسپورتی تثبیت شود."
            }
          },
          {
            id: "common-degree-proof",
            persons: both,
            paths: ["common", "job", "phd", "masters", "residency"],
            priority: "critical",
            title: "مدرک، ریزنمرات و تاریخ دقیق فراغت از تحصیل آماده است",
            detail: "نسخه فارسی خوانا، ترجمه رسمی و عنوان انگلیسی دقیق رشته در پوشه امن نگه‌داری شود؛ این سایت فقط وضعیت آمادگی را ثبت می‌کند.",
            personNotes: {
              mohammad: "تعارض «ارشد در حال تحصیل» و «تمام‌شده» در همه نسخه‌های CV رفع شود.",
              arzoo: "عنوان رسمی انگلیسی رشته علوم تربیتی/آموزش کودکان استثنایی از ترجمه مدرک گرفته شود."
            }
          },
          {
            id: "common-cv-master",
            persons: both,
            paths: ["common", "job", "phd", "masters", "residency", "modeling", "business"],
            priority: "critical",
            title: "رزومه مرجع انگلیسی با تاریخ‌های دقیق ساخته شده",
            detail: "نسخه مادر شامل همه سوابق، دستاوردهای عددی و لینک شواهد باشد؛ برای هر اپلای از آن نسخه کوتاه و هدفمند ساخته شود.",
            outputName: "Firstname_Lastname_Master_CV_2026.docx"
          },
          {
            id: "common-one-page-cv",
            persons: both,
            paths: ["common", "job", "modeling", "business"],
            priority: "high",
            title: "نسخه یک‌صفحه‌ای رزومه آماده است",
            detail: "برای تماس اولیه، شبکه‌سازی و موقعیت‌های غیرآکادمیک؛ حداکثر ۵ تا ۷ دستاورد مرتبط.",
            outputName: "Firstname_Lastname_OnePage_CV.pdf"
          },
          {
            id: "common-public-links",
            persons: both,
            paths: ["common", "job", "phd", "masters", "residency", "modeling", "business"],
            priority: "high",
            title: "لینک‌های عمومی حرفه‌ای تمیز و هماهنگ هستند",
            detail: "عنوان، تصویر، bio، موقعیت جغرافیایی و لینک نمونه‌کار در همه پروفایل‌ها هم‌راستا باشند؛ اطلاعات تماس غیرضروری عمومی نشود.",
            personNotes: {
              mohammad: "GitHub، LinkedIn و صفحه نمونه‌کار با یک headline و وضعیت جابه‌جایی هماهنگ شوند.",
              arzoo: "آری‌دوچ، اینستاگرام و پورتفولیوی شخصی از نام لاتین و bio واحد استفاده کنند."
            }
          },
          {
            id: "common-reference-bank",
            persons: both,
            paths: ["common", "job", "phd", "masters", "residency"],
            priority: "high",
            title: "بانک معرف‌ها و توصیه‌کنندگان با رضایت قبلی ساخته شده",
            detail: "نام، سمت، رابطه حرفه‌ای، موضوعی که می‌توانند تأیید کنند و زمان پاسخ‌گویی ثبت شود؛ اطلاعات تماس آنان فقط در فایل خصوصی نگه‌داری شود.",
            personNotes: {
              mohammad: "حداقل دو استاد/پژوهشگر و یک مدیر فنی یا همکار محصول.",
              arzoo: "حداقل یک استاد دانشگاه، یک همکار/برند و یک فرد معتبر در هنر یا فروش."
            }
          },
          {
            id: "common-language-proof",
            persons: both,
            paths: ["common", "job", "phd", "masters", "residency"],
            priority: "critical",
            title: "وضعیت مدرک زبان و تاریخ اعتبار روشن است",
            detail: "IELTS/TOEFL و حداقل نمره هر برنامه در ماتریس ثبت شود؛ اگر آزمون ندارید، اولین تاریخ ممکن رزرو و زمان اعلام نتیجه محاسبه شود."
          },
          {
            id: "common-file-naming",
            persons: both,
            paths: ["common", "job", "phd", "masters", "residency", "modeling", "business"],
            priority: "medium",
            title: "نام‌گذاری و نسخه‌بندی فایل‌ها استاندارد شده",
            detail: "الگو: Firstname_Lastname_Document_Organization_YYYY-MM-DD.pdf؛ فایل نهایی با FINAL یا v12 نام‌گذاری نشود.",
            outputName: "Firstname_Lastname_Document_Organization_2026-08-30.pdf"
          },
          {
            id: "common-secure-folder",
            persons: both,
            paths: ["common", "job", "phd", "masters", "residency", "modeling", "business"],
            priority: "high",
            title: "پوشه خصوصی و رمزگذاری‌شده برای مدارک حساس ساخته شده",
            detail: "پاسپورت، ترجمه‌ها، شماره تماس، آدرس، اطلاعات بانکی و فرم‌های امضاشده در وب‌سایت عمومی یا مخزن Git قرار نگیرند."
          }
        ]
      },
      {
        id: "job-application",
        title: "پکیج موقعیت شغلی",
        description: "برای هر شغل، شواهد باید به نیازهای همان آگهی نگاشت شوند.",
        paths: ["job"],
        items: [
          {
            id: "job-target-resume",
            persons: both,
            paths: ["job"],
            priority: "critical",
            title: "رزومه برای عنوان شغلی هدف بازنویسی شده",
            detail: "سه خط اول، ترتیب پروژه‌ها و کلیدواژه‌ها با شرح شغل تطبیق یابد؛ ادعاهای بدون شاهد حذف شوند.",
            personNotes: {
              mohammad: "نسخه‌های جدا برای Applied AI/LLM، NeuroAI Research Engineer و Technical Product Engineer.",
              arzoo: "نسخه‌های جدا برای craft/program coordination، social content و junior accessories."
            }
          },
          {
            id: "job-cover-letter",
            persons: both,
            paths: ["job"],
            priority: "high",
            title: "نامه انگیزه شغلی ۳۰۰ تا ۴۰۰ کلمه‌ای آماده است",
            detail: "یک مسئله سازمان، دو شاهد از توانایی و دلیل واقع‌بینانه جابه‌جایی/مجوز کار را توضیح دهد؛ متن عمومی و تکراری نباشد.",
            outputName: "Firstname_Lastname_CoverLetter_Company.pdf"
          },
          {
            id: "job-skills-evidence-map",
            persons: both,
            paths: ["job"],
            priority: "critical",
            title: "جدول نیاز آگهی ← شاهد رزومه تکمیل شده",
            detail: "برای هر شرط essential یک لینک، عدد، پروژه یا تجربه مشخص بنویسید. موارد فاقد شاهد باید به gap تبدیل شوند."
          },
          {
            id: "job-work-authorization",
            persons: both,
            paths: ["job"],
            priority: "critical",
            title: "شرط محل کار و مجوز کار قبل از ارسال بررسی شده",
            detail: "Remote Europe به معنی امکان استخدام از ایران نیست. نوع قرارداد، payroll country، اسپانسر ویزا و محدودیت تحریم را کتبی بررسی کنید."
          },
          {
            id: "job-interview-stories",
            persons: both,
            paths: ["job"],
            priority: "high",
            title: "شش داستان مصاحبه به روش STAR آماده است",
            detail: "حل مسئله، شکست، تعارض، تصمیم دشوار، کار تیمی و اثر قابل‌اندازه‌گیری؛ هر داستان زیر دو دقیقه.",
            personNotes: {
              mohammad: "حداقل دو داستان فنی و یک داستان محصول/بنیان‌گذاری.",
              arzoo: "حداقل دو داستان ساخت/فروش و یک داستان همکاری یا حل محدودیت."
            }
          },
          {
            id: "job-salary-relocation",
            persons: both,
            paths: ["job"],
            priority: "medium",
            title: "حداقل حقوق، هزینه جابه‌جایی و پاسخ relocation آماده است",
            detail: "محدوده حقوق بازار، هزینه زندگی، دوره notice و نیاز به حمایت مهاجرتی بدون افشای جزئیات شخصی در رزومه مشخص باشد."
          }
        ]
      },
      {
        id: "phd-application",
        title: "پکیج دکتری و پژوهش",
        description: "تمرکز اصلی محمد؛ برای آرزو فقط در صورت تعریف مسیر پژوهشی جدید فعال می‌شود.",
        paths: ["phd"],
        items: [
          {
            id: "phd-academic-cv",
            persons: ["mohammad"],
            paths: ["phd"],
            priority: "critical",
            title: "CV آکادمیک ۲ تا ۳ صفحه‌ای نهایی است",
            detail: "تحصیلات، پایان‌نامه، روش‌ها، تجربه پژوهش، تدریس، جوایز، ارائه‌ها، نرم‌افزار و لینک کد؛ وضعیت هر ادعا روشن باشد.",
            outputName: "Mohammad_Parsian_Academic_CV.pdf"
          },
          {
            id: "phd-thesis-summary",
            persons: ["mohammad"],
            paths: ["phd"],
            priority: "critical",
            title: "خلاصه پایان‌نامه یک‌صفحه‌ای با روش و نتیجه آماده است",
            detail: "عنوان، استاد، سؤال، داده، روش، نتیجه اصلی، محدودیت و نقش شخصی؛ تناقض تاریخ دفاع رفع شود.",
            outputName: "Mohammad_Parsian_Thesis_Summary.pdf"
          },
          {
            id: "phd-research-proposal",
            persons: ["mohammad"],
            paths: ["phd"],
            priority: "critical",
            title: "پیشنهاد پژوهشی قابل تنظیم نوشته شده",
            detail: "سؤال مشخص، شکاف ادبیات، فرضیه، داده، روش، ارزیابی، ریسک و برنامه ۳ ساله؛ برای هر استاد فقط بخش مرتبط بازنویسی شود.",
            outputName: "Mohammad_Parsian_Research_Proposal.pdf"
          },
          {
            id: "phd-supervisor-email",
            persons: ["mohammad"],
            paths: ["phd"],
            priority: "high",
            title: "ایمیل کوتاه و شخصی‌سازی‌شده به استاد آماده است",
            detail: "حداکثر ۱۸۰ کلمه: ارتباط دقیق با یک کار استاد، یک شاهد توانایی، سؤال مشخص و دو پیوست سبک.",
            outputName: "Supervisor_Outreach_Template.md"
          },
          {
            id: "phd-publication-status",
            persons: ["mohammad"],
            paths: ["phd"],
            priority: "critical",
            title: "وضعیت مقاله‌ها و خروجی‌ها بدون ابهام مستند شده",
            detail: "Published، accepted، under review، preprint و in preparation دقیقاً جدا شوند؛ هرگز work in progress به‌عنوان مقاله پذیرفته‌شده معرفی نشود."
          },
          {
            id: "phd-methods-inventory",
            persons: ["mohammad"],
            paths: ["phd"],
            priority: "high",
            title: "فهرست روش‌های پژوهشی با سطح تسلط و شاهد تهیه شده",
            detail: "EEG/fNIRS/fMRI، signal processing، statistics، PyTorch، experimental design و reproducibility؛ برای هرکدام شاهد یا وضعیت «در حال یادگیری» ثبت شود."
          },
          {
            id: "phd-recommendations",
            persons: ["mohammad"],
            paths: ["phd"],
            priority: "critical",
            title: "سه توصیه‌کننده آکادمیک تأیید و brief شده‌اند",
            detail: "CV، مهلت‌ها، برنامه‌ها و ۳ نکته‌ای که هر فرد باید با مثال تأیید کند، حداقل سه هفته زودتر ارسال شود."
          },
          {
            id: "phd-writing-sample",
            persons: ["mohammad"],
            paths: ["phd"],
            priority: "medium",
            title: "نمونه نوشتار پژوهشی انگلیسی ویرایش شده",
            detail: "بخش پایان‌نامه، گزارش یا preprint با ارجاع درست، شکل خوانا و توضیح نقش شخصی."
          },
          {
            id: "phd-funding-contract",
            persons: ["mohammad"],
            paths: ["phd"],
            priority: "critical",
            title: "نوع فاند، قرارداد، شهریه و بیمه روشن است",
            detail: "Gross/net salary، tuition، social insurance، مدت قرارداد، teaching load و هزینه ویزا قبل از پذیرش بررسی شود."
          }
        ]
      },
      {
        id: "masters-scholarship",
        title: "پکیج کارشناسی ارشد و بورسیه",
        description: "برای برنامه‌های course-based و Erasmus Mundus؛ معیارهای هر کنسرسیوم جداگانه کنترل شود.",
        paths: ["masters"],
        items: [
          {
            id: "masters-program-matrix",
            persons: both,
            paths: ["masters"],
            priority: "critical",
            title: "ماتریس برنامه‌ها، شرایط و مهلت‌ها تکمیل شده",
            detail: "رشته مجاز، حداقل نمره، آزمون زبان، مدارک، هزینه، فاند، mobility، تعداد توصیه‌نامه و deadline با منبع رسمی."
          },
          {
            id: "masters-motivation-letter",
            persons: both,
            paths: ["masters"],
            priority: "critical",
            title: "Motivation Letter اصلی نوشته و برای هر برنامه شخصی‌سازی شده",
            detail: "گذشته مرتبط، شکاف فعلی، دلیل همان curriculum و برنامه اثرگذاری پس از تحصیل؛ نام دانشگاه قابل‌تعویض نباشد.",
            personNotes: {
              mohammad: "پیوند Computer Engineering، Cognitive Science و مسیر NeuroAI/AI systems.",
              arzoo: "پیوند علوم تربیتی، آری‌دوچ، میراث فرهنگی و مدیریت/آموزش هنر."
            },
            outputName: "Firstname_Lastname_Motivation_Programme.pdf"
          },
          {
            id: "masters-scholarship-essay",
            persons: both,
            paths: ["masters"],
            priority: "critical",
            title: "Essay بورسیه با اثر اجتماعی و شواهد عددی آماده است",
            detail: "Leadership، community impact، چالش، نقش شخصی و برنامه بازگشت/انتقال دانش با مثال واقعی؛ از شعار پرهیز شود."
          },
          {
            id: "masters-course-prerequisites",
            persons: both,
            paths: ["masters"],
            priority: "critical",
            title: "پیش‌نیاز رشته و پذیرش مدرک غیرمرتبط کتبی تأیید شده",
            detail: "اگر مدرک کارشناسی دقیقاً در فهرست نیست، قبل از هزینه درخواست از admissions پاسخ مکتوب بگیرید.",
            personNotes: {
              arzoo: "برای برنامه‌های art/design صرفاً پورتفولیو ممکن است جای مدرک هنری را نگیرد؛ MAGMa و MARIHE انعطاف بیشتری دارند."
            }
          },
          {
            id: "masters-certified-translations",
            persons: both,
            paths: ["masters"],
            priority: "critical",
            title: "ترجمه رسمی، مهرها و فرمت آپلود با دستورالعمل برنامه سازگار است",
            detail: "PDF تک‌فایل، حجم، ترجمه ریزنمرات، grading scale و legalization احتمالی بررسی شود."
          },
          {
            id: "masters-mobility-budget",
            persons: both,
            paths: ["masters"],
            priority: "high",
            title: "بودجه mobility، پیش‌پرداخت و فاصله زمانی تا اولین قسط محاسبه شده",
            detail: "حتی بورسیه کامل ممکن است هزینه آزمون، ویزا، ترجمه، سفر سفارت و چند هفته زندگی اولیه را دیرتر بازپرداخت کند."
          },
          {
            id: "masters-application-video",
            persons: both,
            paths: ["masters"],
            priority: "medium",
            title: "نسخه آزمایشی ویدئوی معرفی ۹۰ ثانیه‌ای ضبط شده",
            detail: "نور و صدای ساده، معرفی روشن، هدف برنامه و یک شاهد؛ متن حفظ‌شده و مصنوعی نباشد."
          }
        ]
      },
      {
        id: "residency-competition",
        title: "پکیج رزیدنسی، گرنت و مسابقه",
        description: "پروژه و کیفیت مستندات مهم‌تر از تعداد درخواست‌هاست.",
        paths: ["residency"],
        items: [
          {
            id: "residency-artist-cv",
            persons: ["arzoo"],
            paths: ["residency"],
            priority: "critical",
            title: "Artist CV یک تا دو صفحه‌ای آماده است",
            detail: "آثار منتخب، همکاری‌ها، نمایش/فروش، آموزش، رسانه و تحصیلات؛ تجربه‌های غیرمرتبط فقط در صورت تقویت روایت هنری.",
            outputName: "Arzoo_Barahoie_Artist_CV.pdf"
          },
          {
            id: "residency-artist-statement",
            persons: ["arzoo"],
            paths: ["residency"],
            priority: "critical",
            title: "Artist Statement در نسخه ۱۵۰ و ۳۰۰ کلمه‌ای نوشته شده",
            detail: "Material memory، بازیافت، میراث بلوچ، اخلاق منشأ و بدن/زیور؛ از متن تبلیغاتی فروشگاهی فاصله بگیرد.",
            outputName: "Arzoo_Barahoie_Artist_Statement.pdf"
          },
          {
            id: "residency-project-proposal",
            persons: ["arzoo"],
            paths: ["residency"],
            priority: "critical",
            title: "پروپوزال پروژه با خروجی و زمان‌بندی مشخص آماده است",
            detail: "سؤال، ضرورت محل، تحقیق، مواد، روش، خروجی، تعامل عمومی، ایمنی، بودجه و برنامه پس از رزیدنسی.",
            outputName: "Arzoo_Barahoie_Project_Proposal.pdf"
          },
          {
            id: "residency-work-samples",
            persons: ["arzoo"],
            paths: ["residency"],
            priority: "critical",
            title: "۱۰ نمونه اثر حرفه‌ای با caption کامل انتخاب شده",
            detail: "نام، سال، مواد، ابعاد، وضعیت تک‌نسخه/سری، عکاس و یک جمله مفهوم؛ عکس‌های فروشگاهی تکراری حذف شوند."
          },
          {
            id: "residency-image-rights",
            persons: ["arzoo"],
            paths: ["residency"],
            priority: "high",
            title: "حق استفاده از تصاویر و credit عکاس/مدل روشن است",
            detail: "فقط تصاویری ارسال شوند که اجازه نمایش عمومی، کاتالوگ و رسانه را دارند."
          },
          {
            id: "residency-provenance",
            persons: ["arzoo"],
            paths: ["residency", "business"],
            priority: "critical",
            title: "منشأ، قدمت تقریبی و اخلاق استفاده از هر پارچه ثبت شده",
            detail: "سازنده در صورت شناخت، رضایت/جبران خدمت، معنی نقش و موارد نامعلوم شفاف نوشته شود؛ ادعای میراث بدون provenance ضعیف است."
          },
          {
            id: "residency-budget-shipping",
            persons: ["arzoo"],
            paths: ["residency", "business"],
            priority: "critical",
            title: "بودجه مواد، سفر، ویزا، حمل و بازگشت اثر محاسبه شده",
            detail: "Application fee، بیمه، customs، commission، بسته‌بندی، return shipping و امکان پرداخت از ایران قبل از ارسال بررسی شود."
          },
          {
            id: "residency-public-program",
            persons: ["arzoo"],
            paths: ["residency"],
            priority: "high",
            title: "طرح ورکشاپ یا گفت‌وگوی عمومی آماده است",
            detail: "پیشینه علوم تربیتی را به یک کارگاه دسترس‌پذیر درباره بازیافت نساجی، روایت نقش و میراث زنده تبدیل کند."
          }
        ]
      },
      {
        id: "modeling-package",
        title: "پکیج مدلینگ ایمن و حرفه‌ای",
        description: "فقط فرم رسمی آژانس؛ بدون هزینه نمایندگی و بدون ارسال داده حساس به scout ناشناس.",
        paths: ["modeling"],
        items: [
          {
            id: "modeling-measurements",
            persons: ["arzoo"],
            paths: ["modeling"],
            priority: "critical",
            title: "اندازه‌های استاندارد و به‌روز ثبت شده",
            detail: "قد، bust، waist، hips، سایز لباس و کفش، رنگ مو و چشم؛ داده کامل فقط در فرم رسمی آژانس وارد شود."
          },
          {
            id: "modeling-digitals",
            persons: ["arzoo"],
            paths: ["modeling"],
            priority: "critical",
            title: "چهار digital بدون روتوش در نور روز آماده است",
            detail: "Front، profile چپ/راست و full body؛ بدون فیلتر، آرایش سنگین، ژست پیچیده یا لباس گشاد.",
            outputName: "Arzoo_Barahoie_Digitals_2026.zip"
          },
          {
            id: "modeling-walk-video",
            persons: ["arzoo"],
            paths: ["modeling"],
            priority: "high",
            title: "ویدئوی معرفی و walk ساده آماده است",
            detail: "۳۰ تا ۶۰ ثانیه، قاب تمام‌قد و close-up، نور طبیعی، بدون موسیقی/تدوین سنگین."
          },
          {
            id: "modeling-tearsheets",
            persons: ["arzoo"],
            paths: ["modeling"],
            priority: "high",
            title: "کمپین‌ها و tearsheetهای قابل‌اثبات گردآوری شده",
            detail: "نام برند، تاریخ، عکاس، stylist، لینک انتشار و اجازه استفاده؛ همکاری بدون شاهد در رزومه با برچسب self-reported بماند."
          },
          {
            id: "modeling-agency-verification",
            persons: ["arzoo"],
            paths: ["modeling"],
            priority: "critical",
            title: "دامنه، دفتر و هویت scout مستقل تأیید شده",
            detail: "اگر پیام از شبکه اجتماعی آمد، با شماره یا ایمیل درج‌شده در سایت رسمی آژانس صحت آن را مستقلاً بررسی کنید.",
            safetySource: "https://consumer.ftc.gov/articles/modeling-scams"
          },
          {
            id: "modeling-no-upfront-fee",
            persons: ["arzoo"],
            paths: ["modeling"],
            priority: "critical",
            title: "هیچ هزینه اولیه برای نمایندگی یا تضمین کار پرداخت نشده",
            detail: "طبق FTC، آژانسی که برای نمایندگی پول پیش می‌خواهد یا booking را تضمین می‌کند نشانه کلاهبرداری است.",
            safetySource: "https://consumer.ftc.gov/articles/modeling-scams"
          },
          {
            id: "modeling-contract-review",
            persons: ["arzoo"],
            paths: ["modeling"],
            priority: "critical",
            title: "قرارداد، کمیسیون، انحصار و هزینه‌ها قبل از امضا بررسی شده",
            detail: "مدت، territory، حق فسخ، usage، debt/advance و مالکیت تصاویر باید روشن باشد؛ قرارداد نمایندگی ویزا ایجاد نمی‌کند."
          },
          {
            id: "modeling-casting-safety",
            persons: ["arzoo"],
            paths: ["modeling"],
            priority: "critical",
            title: "پروتکل امنیت casting و سفر نوشته شده",
            detail: "brief مکتوب، مکان حرفه‌ای، فرد تماس، اطلاع‌دادن به شخص مورد اعتماد، عدم ارسال عکس خصوصی و بررسی مجوز کار."
          }
        ]
      },
      {
        id: "business-export",
        title: "پکیج کسب‌وکار، همکاری و صادرات آری‌دوچ",
        description: "برای concept store، گالری، wholesale، سفارش همکاری و برنامه شتاب‌دهی.",
        paths: ["business"],
        items: [
          {
            id: "business-brand-deck",
            persons: ["arzoo"],
            paths: ["business"],
            priority: "critical",
            title: "Brand Deck کوتاه انگلیسی آماده است",
            detail: "مسئله، داستان، محصولات، فرایند، اثر، مشتری، بازار، همکاری مطلوب و اطلاعات عمومی تماس در ۸ تا ۱۰ اسلاید.",
            outputName: "Ariidoch_Brand_Deck_2026.pdf"
          },
          {
            id: "business-line-sheet",
            persons: ["arzoo"],
            paths: ["business"],
            priority: "critical",
            title: "Line Sheet صادراتی با قیمت و ظرفیت آماده است",
            detail: "SKU، تصویر، مواد، ابعاد، wholesale/retail، lead time، MOQ، ظرفیت ماهانه، بسته‌بندی و شرایط پرداخت.",
            outputName: "Ariidoch_Line_Sheet_2026.pdf"
          },
          {
            id: "business-impact-metrics",
            persons: ["arzoo"],
            paths: ["business", "residency"],
            priority: "critical",
            title: "شاخص‌های محیط‌زیستی و اجتماعی اندازه‌گیری شده",
            detail: "تعداد/وزن قطعات بازیافتی، درصد مواد reclaimed، زنان همکار، شیوه پرداخت، کشورها و مشتری تکراری؛ ادعای بدون عدد استفاده نشود."
          },
          {
            id: "business-costing",
            persons: ["arzoo"],
            paths: ["business"],
            priority: "critical",
            title: "بهای تمام‌شده و حاشیه سود واقعی محاسبه شده",
            detail: "زمان کار، ماده، دستمزد همکار، بسته‌بندی، کارمزد پرداخت، حمل، مرجوعی، مالیات/گمرک و commission فروشگاه."
          },
          {
            id: "business-export-feasibility",
            persons: ["arzoo"],
            paths: ["business"],
            priority: "critical",
            title: "امکان دریافت پول و ارسال قانونی برای کشور مقصد بررسی شده",
            detail: "تحریم، payment processor، ارز، HS code، محدودیت مواد، گمرک، بیمه و return policy با متخصص یا شرکت حمل معتبر بررسی شود."
          },
          {
            id: "business-wholesale-terms",
            persons: ["arzoo"],
            paths: ["business"],
            priority: "high",
            title: "شرایط wholesale، consignment و licensing نوشته شده",
            detail: "مالکیت طرح، تعداد، territory، انحصار، پرداخت، خسارت، تخفیف، زمان تحویل و حق استفاده از داستان/تصویر."
          },
          {
            id: "business-outreach-list",
            persons: ["arzoo"],
            paths: ["business"],
            priority: "medium",
            title: "فهرست ۳۰ خریدار/گالری/رسانه هدف با دلیل تناسب ساخته شده",
            detail: "هر تماس باید به مجموعه یا ارزش مشخص آن مقصد اشاره کند؛ ارسال انبوه یک متن عمومی ممنوع."
          }
        ]
      }
    ],

    gaps: [
      {
        id: "gap-m-thesis",
        persons: ["mohammad"],
        paths: ["phd", "job"],
        priority: "critical",
        title: "پایان‌نامه و خروجی پژوهشی عمومی و قابل ارزیابی نیست",
        impact: "بزرگ‌ترین مانع برای دکتری و Research Engineer.",
        action: "یک مخزن پژوهشی با abstract، داده/اخلاق، pipeline بازتولیدپذیر، شکل‌ها، نتیجه، محدودیت و citation منتشر شود."
      },
      {
        id: "gap-m-rag-proof",
        persons: ["mohammad"],
        paths: ["job"],
        priority: "critical",
        title: "ادعای LLM/RAG/agent شاهد عمومی متمرکز ندارد",
        impact: "برای نقش‌های Applied AI نرخ تبدیل رزومه را پایین می‌آورد.",
        action: "پروژه production-style با eval، tracing، test، Docker، معماری، latency/cost و demo ساخته شود."
      },
      {
        id: "gap-m-recent-ml",
        persons: ["mohammad"],
        paths: ["job", "phd"],
        priority: "critical",
        title: "بخش عمده کد ML عمومی قدیمی و notebookمحور است",
        impact: "پروفایل ممکن است گسترده اما به‌روزنبودن تلقی شود.",
        action: "دو مخزن curated: NeuroAI time-series و deployed LLM؛ فقط شش پروژه قوی pin شوند."
      },
      {
        id: "gap-m-cv-conflict",
        persons: ["mohammad"],
        paths: ["common", "job", "phd", "masters"],
        priority: "critical",
        title: "وضعیت ارشد و مجموعه جوایز میان CVها ناسازگار است",
        impact: "ابهام اعتماد و eligibility.",
        action: "یک CV تاریخ‌دار مرجع ساخته و همه پروفایل‌ها از آن همگام شوند."
      },
      {
        id: "gap-m-external-proof",
        persons: ["mohammad"],
        paths: ["common", "job", "phd", "masters"],
        priority: "high",
        title: "جوایز، تدریس، زبان و مقاله لینک مستقل کافی ندارند",
        impact: "قوی‌ترین ادعاها در اپلای بین‌المللی امتیاز کامل نمی‌گیرند.",
        action: "گواهی/نتیجه، صفحه رویداد، اسلاید، مدرک زبان و ORCID/Scholar اضافه شود."
      },
      {
        id: "gap-a-cv",
        persons: ["arzoo"],
        paths: ["common", "job", "masters", "residency", "modeling", "business"],
        priority: "critical",
        title: "CV انگلیسی با تاریخ و دستاورد قابل‌سنجش وجود ندارد",
        impact: "همه مسیرها از آژانس تا بورسیه را ضعیف می‌کند.",
        action: "مدرک، تاریخ، برند/کارفرما، عنوان و ۲ تا ۳ دستاورد هر تجربه جمع‌آوری شود."
      },
      {
        id: "gap-a-portfolio",
        persons: ["arzoo"],
        paths: ["residency", "masters", "business", "modeling"],
        priority: "critical",
        title: "پورتفولیوی انگلیسی case-study محور کامل نیست",
        impact: "کاتالوگ شبکه اجتماعی جای پورتفولیوی داوری را نمی‌گیرد.",
        action: "۳ تا ۵ پروژه با منشأ، قبل/بعد، فرایند، مواد، ابعاد، سال، مفهوم و شاهد فروش/ارسال ساخته شود."
      },
      {
        id: "gap-a-model-pack",
        persons: ["arzoo"],
        paths: ["modeling"],
        priority: "critical",
        title: "اندازه‌ها، digitals و tearsheet استاندارد مدلینگ ناقص است",
        impact: "آژانس معتبر نمی‌تواند fit بازار را ارزیابی کند.",
        action: "پکیج بدون روتوش، اندازه‌ها، walk video و credit کمپین تکمیل شود."
      },
      {
        id: "gap-a-impact",
        persons: ["arzoo"],
        paths: ["residency", "masters", "business"],
        priority: "high",
        title: "اثر پایداری و توانمندسازی عددی نشده",
        impact: "ادعاها جذاب‌اند اما برای گرنت و خریدار حرفه‌ای قابل سنجش نیستند.",
        action: "قطعات/وزن بازیافتی، ماده reclaimed، زنان همکار، پرداخت، مقصدها و مشتری تکراری ثبت شود."
      },
      {
        id: "gap-a-provenance",
        persons: ["arzoo"],
        paths: ["residency", "business"],
        priority: "high",
        title: "اخلاق میراث و provenance نظام‌مند نیست",
        impact: "ریسک appropriation، ادعای مبهم و ضعف موزه‌ای.",
        action: "منشأ، قدمت، سازنده، رضایت/پرداخت، معنی نقش و موارد نامعلوم ثبت شود."
      },
      {
        id: "gap-a-international",
        persons: ["arzoo"],
        paths: ["common", "masters", "residency", "modeling", "business"],
        priority: "high",
        title: "زبان، پرداخت ارزی، ویزا و بودجه سفر قطعی نیست",
        impact: "ممکن است فرصت رسمی با وجود eligibility عملی نباشد.",
        action: "اعتبار پاسپورت، آزمون زبان، بودجه، روش پرداخت و مسیر سفارت/کشور ثالث برای هر مقصد بررسی شود."
      }
    ],

    portfolioProjects: [
      {
        id: "project-m-rag-evals",
        persons: ["mohammad"],
        paths: ["job"],
        priority: "critical",
        title: "RAG/Agent با ارزیابی واقعی",
        outcome: "یک سرویس کوچک با retrieval benchmark، groundedness، tracing، latency/cost، تست، Docker و demo.",
        proof: "README دو دقیقه‌ای + معماری + جدول نتایج + لینک زنده",
        targetRoles: ["Applied AI Engineer", "LLM Engineer", "AI Solutions Engineer"]
      },
      {
        id: "project-m-neuro-pipeline",
        persons: ["mohammad"],
        paths: ["phd", "job"],
        priority: "critical",
        title: "NeuroAI time-series pipeline بازتولیدپذیر",
        outcome: "Pipeline EEG یا fNIRS از preprocessing تا baseline، model، cross-validation، error analysis و ethics.",
        proof: "کد packageشده + environment + notebook نتیجه + model card",
        targetRoles: ["PhD NeuroAI", "Research Engineer", "Biomedical Data Scientist"]
      },
      {
        id: "project-m-serviceos-technical-brief",
        persons: ["mohammad"],
        paths: ["job"],
        priority: "high",
        title: "ServiceOS Technical Brief",
        outcome: "تبدیل پروژه بزرگ به case study فنی کوتاه با محدوده prototype و سهم شخصی.",
        proof: "معماری، component ownership، test count، performance، تصمیم‌ها و محدودیت بالینی",
        targetRoles: ["Technical Product Engineer", "AI Product Engineer"]
      },
      {
        id: "project-a-wearable-archives",
        persons: ["arzoo"],
        paths: ["residency", "masters", "business"],
        priority: "critical",
        title: "Wearable Archives / آرشیوهای پوشیدنی",
        outcome: "یک سری ۵ تا ۸ اثر که هرکدام تاریخچه یک قطعه سوزن‌دوزی فرسوده را به فرم معاصر تبدیل می‌کنند.",
        proof: "provenance card، قبل/بعد، فرایند، اثر نهایی، مواد و متن مفهومی",
        targetRoles: ["LOEWE Craft Prize", "Residencies", "Gallery portfolio"]
      },
      {
        id: "project-a-toranj-case-study",
        persons: ["arzoo"],
        paths: ["residency", "business", "masters"],
        priority: "high",
        title: "Toranj: From 15-year-old garment to transnational object",
        outcome: "Case study کامل درباره قدمت، دو نسخه، تبدیل، ارسال به هلند و معنای جابه‌جایی فرهنگی.",
        proof: "تصاویر باکیفیت، شناسنامه، روایت انگلیسی و مدرک عمومی ارسال بدون افشای خریدار",
        targetRoles: ["MAGMa", "CraftForms", "Press outreach"]
      },
      {
        id: "project-a-material-memory-frames",
        persons: ["arzoo"],
        paths: ["residency", "masters"],
        priority: "high",
        title: "Material Memory: framed textile works",
        outcome: "سه قاب تک‌نسخه با سؤال پژوهشی مشترک درباره فرسودگی، رنگ، حافظه و حفظ میراث.",
        proof: "عکس نصب‌شده، detail، ابعاد، statement و برنامه نمایش",
        targetRoles: ["MacDowell", "Art Omi", "Jan van Eyck"]
      },
      {
        id: "project-a-editorial-capsule",
        persons: ["arzoo"],
        paths: ["modeling", "business"],
        priority: "medium",
        title: "Editorial capsule: maker in front of the lens",
        outcome: "داستان تصویری ۶ تا ۱۰ فریم با نقش هم‌زمان طراح و مدل و تمرکز بر jewelry/beauty/commercial.",
        proof: "credits کامل، usage rights، digitals جدا و تصاویر editorial",
        targetRoles: ["Model agencies", "Ethical fashion media", "Brand collaborations"]
      }
    ],

    templates: [
      {
        id: "tpl-master-cv",
        persons: both,
        paths: ["common", "job", "phd", "masters", "residency", "modeling", "business"],
        priority: "critical",
        title: "رزومه مرجع",
        format: "DOCX + PDF",
        suggestedFile: "Firstname_Lastname_Master_CV_2026",
        inputs: ["تاریخ دقیق", "عنوان نقش", "دستاورد عددی", "لینک شاهد"],
        note: "منبع واحد برای ساخت نسخه‌های هدفمند؛ اطلاعات حساس در نسخه عمومی حذف شود."
      },
      {
        id: "tpl-job-cover",
        persons: both,
        paths: ["job"],
        priority: "high",
        title: "Cover Letter شغلی",
        format: "DOCX + PDF",
        suggestedFile: "Firstname_Lastname_CoverLetter_Company",
        inputs: ["مسئله شرکت", "دو شاهد مرتبط", "مجوز کار/relocation", "دعوت به مصاحبه"],
        note: "حداکثر یک صفحه و بدون تکرار رزومه."
      },
      {
        id: "tpl-academic-cv",
        persons: ["mohammad"],
        paths: ["phd"],
        priority: "critical",
        title: "Academic CV",
        format: "DOCX/LaTeX + PDF",
        suggestedFile: "Mohammad_Parsian_Academic_CV",
        inputs: ["پایان‌نامه", "روش‌ها", "انتشارات", "جوایز", "تدریس", "کد"],
        note: "هر وضعیت انتشار دقیق برچسب بخورد."
      },
      {
        id: "tpl-research-proposal",
        persons: ["mohammad"],
        paths: ["phd"],
        priority: "critical",
        title: "Research Proposal",
        format: "DOCX/LaTeX + PDF",
        suggestedFile: "Mohammad_Parsian_Research_Proposal_Programme",
        inputs: ["شکاف", "سؤال", "روش", "داده", "ارزیابی", "ریسک", "برنامه زمانی"],
        note: "نسخه پایه داشته باشد، اما fit با استاد در هر ارسال بازنویسی شود."
      },
      {
        id: "tpl-motivation",
        persons: both,
        paths: ["masters"],
        priority: "critical",
        title: "Motivation Letter / Scholarship Essay",
        format: "DOCX + PDF",
        suggestedFile: "Firstname_Lastname_Motivation_Programme",
        inputs: ["روایت تحصیلی", "fit با curriculum", "اثر", "برنامه آینده"],
        note: "محدودیت کلمه هر برنامه رعایت شود."
      },
      {
        id: "tpl-artist-portfolio",
        persons: ["arzoo"],
        paths: ["residency", "masters", "business"],
        priority: "critical",
        title: "Artist Portfolio",
        format: "PDF 12–20 pages",
        suggestedFile: "Arzoo_Barahoie_Portfolio_2026",
        inputs: ["۳–۵ case study", "شناسنامه آثار", "statement", "CV کوتاه", "impact"],
        note: "نسخه رزیدنسی با نسخه wholesale یکسان نباشد."
      },
      {
        id: "tpl-artist-proposal",
        persons: ["arzoo"],
        paths: ["residency"],
        priority: "critical",
        title: "Artist Statement + Residency Proposal",
        format: "DOCX + PDF",
        suggestedFile: "Arzoo_Barahoie_Proposal_Programme",
        inputs: ["سؤال", "چرا این محل", "روش", "خروجی", "تعامل عمومی", "بودجه"],
        note: "تولید محصول را به تحقیق/هنر تبدیل کند."
      },
      {
        id: "tpl-model-card",
        persons: ["arzoo"],
        paths: ["modeling"],
        priority: "high",
        title: "Model Card / Submission Pack",
        format: "PDF + JPG set",
        suggestedFile: "Arzoo_Barahoie_Model_Submission_2026",
        inputs: ["digitals", "اندازه‌ها", "credits", "location/work status"],
        note: "اطلاعات حساس فقط در فرم رسمی آژانس؛ نسخه عمومی حداقلی باشد."
      },
      {
        id: "tpl-brand-deck",
        persons: ["arzoo"],
        paths: ["business"],
        priority: "critical",
        title: "Ariidoch Brand Deck + Line Sheet",
        format: "PDF + XLSX",
        suggestedFile: "Ariidoch_Brand_Deck_and_Line_Sheet_2026",
        inputs: ["داستان", "محصول", "impact", "قیمت", "MOQ", "ظرفیت", "lead time"],
        note: "قیمت خرده و عمده و شرایط consignment جدا شود."
      }
    ],

    deadlinePreparation: [
      {
        id: "deadline-60",
        label: "۶۰ تا ۹۰ روز مانده",
        tone: "calm",
        actions: [
          "eligibility و رشته/مجوز کار از منبع رسمی تأیید شود.",
          "آزمون زبان، ترجمه و توصیه‌کننده رزرو شود.",
          "پروژه یا پورتفولیوی اصلی انتخاب و gapها بسته شوند."
        ]
      },
      {
        id: "deadline-30",
        label: "۳۰ روز مانده",
        tone: "active",
        actions: [
          "پیش‌نویس همه متن‌ها و فرم آفلاین تکمیل شود.",
          "حجم/فرمت فایل، بودجه، پرداخت و مسیر ویزا کنترل شود.",
          "توصیه‌کنندگان brief و مهلت داخلی دریافت نامه تعیین شود."
        ]
      },
      {
        id: "deadline-14",
        label: "۱۴ روز مانده",
        tone: "urgent",
        actions: [
          "نسخه نهایی با rubric یا شرح فرصت cross-check شود.",
          "لینک‌ها، permission تصاویر، نام‌ها و تاریخ‌ها تست شوند.",
          "پرداخت آزمایشی یا درخواست fee waiver انجام شود."
        ]
      },
      {
        id: "deadline-3",
        label: "۳ روز مانده — مهلت داخلی ارسال",
        tone: "danger",
        actions: [
          "Submit انجام و رسید/نسخه PDF فرم در پوشه خصوصی ذخیره شود.",
          "فرم در روز آخر شروع نشود؛ اختلاف timezone لحاظ شود.",
          "پس از ارسال فقط confirmation و follow-up date ثبت شود."
        ]
      }
    ],

    questionBank: [
      {
        id: "q-eligibility-iran",
        persons: both,
        paths: ["job", "phd", "masters", "residency", "modeling", "business"],
        category: "eligibility",
        priority: "critical",
        question: "آیا متقاضی ساکن ایران و دارای تابعیت ایرانی در این دوره رسماً پذیرفته می‌شود؟",
        askWho: "Admissions / HR / programme coordinator",
        why: "واجد شرایط بودن عمومی ممکن است محدودیت تحریم، قرارداد یا منطقه را پوشش ندهد."
      },
      {
        id: "q-payment-iran",
        persons: both,
        paths: ["masters", "residency", "modeling", "business"],
        category: "payment",
        priority: "critical",
        question: "اگر پرداخت مستقیم از ایران ممکن نباشد، روش قانونی جایگزین یا fee waiver چیست؟",
        askWho: "Finance / programme coordinator",
        why: "از پرداخت با واسطه ناشناس یا روشی که شرایط برگزارکننده را نقض کند اجتناب شود."
      },
      {
        id: "q-funds-transfer",
        persons: both,
        paths: ["phd", "masters", "residency", "business"],
        category: "payment",
        priority: "critical",
        question: "آیا سازمان می‌تواند stipend، جایزه یا حقوق را به متقاضی ایرانی پرداخت کند و چه حسابی لازم است؟",
        askWho: "HR / finance",
        why: "انتخاب‌شدن لزوماً به معنی امکان انتقال وجه نیست."
      },
      {
        id: "q-visa-letter",
        persons: both,
        paths: ["phd", "masters", "residency", "modeling"],
        category: "visa",
        priority: "critical",
        question: "در صورت پذیرش، چه نامه و پشتیبانی برای ویزا صادر می‌شود و زمان صدور چقدر است؟",
        askWho: "International office / coordinator",
        why: "وقت سفارت و سفر به کشور ثالث ممکن است طولانی باشد."
      },
      {
        id: "q-third-country-visa",
        persons: both,
        paths: ["phd", "masters", "residency", "modeling"],
        category: "visa",
        priority: "high",
        question: "آیا مصاحبه یا biometrics باید در کشور ثالث انجام شود و هزینه/زمان آن در بودجه دیده شده؟",
        askWho: "Official embassy/immigration source",
        why: "این هزینه معمولاً در فاند پوشش داده نمی‌شود."
      },
      {
        id: "q-work-permit",
        persons: both,
        paths: ["job", "modeling"],
        category: "visa",
        priority: "critical",
        question: "آیا کارفرما sponsor مجوز کار است یا existing right to work شرط قطعی است؟",
        askWho: "HR / agency",
        why: "Remote، representation یا internship به‌تنهایی مجوز کار ایجاد نمی‌کند."
      },
      {
        id: "q-export-control",
        persons: ["mohammad"],
        paths: ["job", "phd"],
        category: "eligibility",
        priority: "high",
        question: "آیا نقش یا داده‌ها تحت export control / security clearance هستند؟",
        askWho: "HR / principal investigator",
        why: "برخی نقش‌های AI، سلامت، دفاع یا داده حساس محدودیت تابعیت دارند."
      },
      {
        id: "q-shipping-customs",
        persons: ["arzoo"],
        paths: ["residency", "business"],
        category: "shipping",
        priority: "critical",
        question: "چه کسی هزینه، بیمه، customs و return shipping اثر را می‌پردازد؟",
        askWho: "Gallery / residency / buyer",
        why: "هزینه حمل می‌تواند از ارزش جایزه یا فروش بیشتر شود."
      },
      {
        id: "q-material-import",
        persons: ["arzoo"],
        paths: ["residency", "business"],
        category: "shipping",
        priority: "high",
        question: "آیا پارچه قدیمی، فلز، چسب یا بسته‌بندی محدودیت ورود یا declaration خاص دارد؟",
        askWho: "Carrier / customs authority",
        why: "کالاهای دست‌ساز و مواد آلی ممکن است طبقه‌بندی خاص داشته باشند."
      },
      {
        id: "q-model-commission",
        persons: ["arzoo"],
        paths: ["modeling"],
        category: "contract",
        priority: "critical",
        question: "کمیسیون، هزینه‌های قابل کسر، انحصار، usage و شرایط فسخ دقیقاً چیست؟",
        askWho: "Verified agency + independent contract reviewer",
        why: "هزینه پنهان و بدهی advance باید قبل از امضا روشن شود."
      },
      {
        id: "q-degree-equivalency",
        persons: both,
        paths: ["phd", "masters"],
        category: "eligibility",
        priority: "critical",
        question: "مدرک و رشته فعلی دقیقاً با شرط admission برابر شناخته می‌شود؟",
        askWho: "Admissions in writing",
        why: "تجربه حرفه‌ای همیشه جای مدرک مرتبط را نمی‌گیرد."
      },
      {
        id: "q-scholarship-first-payment",
        persons: both,
        paths: ["masters", "phd"],
        category: "payment",
        priority: "high",
        question: "اولین پرداخت چه تاریخی است و هزینه‌های پیش از ورود کدام‌اند؟",
        askWho: "Scholarship office",
        why: "ممکن است چند هزار یورو سرمایه اولیه لازم باشد."
      }
    ],

    redFlags: [
      {
        id: "red-model-upfront",
        persons: ["arzoo"],
        paths: ["modeling"],
        severity: "stop",
        title: "پول پیش برای نمایندگی یا تضمین booking",
        detail: "طبق FTC، آژانسی که برای نمایندگی پول پیش می‌خواهد یا شغل تضمین می‌کند نشانه کلاهبرداری است.",
        sourceLabel: "FTC — Modeling Scams",
        sourceUrl: "https://consumer.ftc.gov/articles/modeling-scams"
      },
      {
        id: "red-model-private-images",
        persons: ["arzoo"],
        paths: ["modeling"],
        severity: "stop",
        title: "درخواست عکس خصوصی، مالی یا پاسپورت توسط scout تأییدنشده",
        detail: "ارسال نشود؛ هویت فرد با دفتر رسمی آژانس مستقلاً بررسی شود.",
        sourceLabel: "FTC — Modeling Scams",
        sourceUrl: "https://consumer.ftc.gov/articles/modeling-scams"
      },
      {
        id: "red-visa-assumption",
        persons: both,
        paths: ["job", "phd", "masters", "residency", "modeling"],
        severity: "stop",
        title: "فرض اینکه پذیرش یا representation مساوی ویزا است",
        detail: "نوع ویزا، sponsor، محل biometrics و زمان‌بندی باید از منبع رسمی جداگانه تأیید شود."
      },
      {
        id: "red-unverified-fee",
        persons: both,
        paths: ["masters", "residency", "modeling", "business"],
        severity: "warning",
        title: "پرداخت به لینک، شخص یا حساب خارج از دامنه رسمی",
        detail: "هیچ پرداختی بدون صفحه رسمی، invoice و تطبیق شرایط انجام نشود."
      },
      {
        id: "red-guaranteed-admission",
        persons: both,
        paths: ["phd", "masters", "job"],
        severity: "stop",
        title: "تضمین پذیرش، ویزا یا استخدام در برابر پول",
        detail: "واسطه معتبر هم نمی‌تواند نتیجه کمیته پذیرش یا سفارت را تضمین کند."
      },
      {
        id: "red-cv-inconsistency",
        persons: both,
        paths: ["common", "job", "phd", "masters", "residency"],
        severity: "warning",
        title: "تاریخ، مدرک یا عنوان متفاوت میان فرم و CV",
        detail: "حتی خطای بی‌قصد می‌تواند به رد یا بررسی integrity منجر شود؛ از CV مرجع کپی شود."
      },
      {
        id: "red-public-sensitive-data",
        persons: both,
        paths: ["common", "job", "phd", "masters", "residency", "modeling", "business"],
        severity: "stop",
        title: "بارگذاری مدرک حساس در سایت عمومی یا مخزن Git",
        detail: "پاسپورت، آدرس، امضا، شماره تلفن، اطلاعات بانکی و ریزنمرات عمومی نشوند."
      },
      {
        id: "red-art-rights",
        persons: ["arzoo"],
        paths: ["residency", "business", "modeling"],
        severity: "warning",
        title: "ارسال اثر یا تصویر بدون حق استفاده و provenance",
        detail: "حق عکاس، مدل، سازنده سوزن‌دوزی و شروط کاتالوگ/تبلیغ قبل از submit روشن شود."
      },
      {
        id: "red-research-claim",
        persons: ["mohammad"],
        paths: ["phd", "job"],
        severity: "warning",
        title: "معرفی prototype یا work in progress به‌عنوان محصول/مقاله اعتبارسنجی‌شده",
        detail: "محدوده، داده واقعی، نقش شخصی و وضعیت انتشار دقیق و صادقانه نوشته شود."
      }
    ]
  };

  window.APPLICATION_READINESS = {
    storageKey: window.APPLICATION_CONFIG.storageKey,

    readState: function () {
      const fallback = {
        completed: {},
        filters: { person: "all", path: "all", criticalOnly: false }
      };
      try {
        const parsed = JSON.parse(localStorage.getItem(this.storageKey));
        if (!parsed || typeof parsed !== "object") return fallback;
        return {
          completed: parsed.completed && typeof parsed.completed === "object" ? parsed.completed : {},
          filters: {
            person: window.APPLICATION_CONFIG.people[parsed.filters?.person] ? parsed.filters.person : "all",
            path: window.APPLICATION_CONFIG.paths[parsed.filters?.path] ? parsed.filters.path : "all",
            criticalOnly: Boolean(parsed.filters?.criticalOnly)
          }
        };
      } catch (_) {
        return fallback;
      }
    },

    calculate: function (options, suppliedState) {
      const cfg = window.APPLICATION_CONFIG;
      const state = suppliedState || this.readState();
      const selected = {
        person: cfg.people[options?.person] ? options.person : "all",
        path: cfg.paths[options?.path] ? options.path : "all",
        criticalOnly: Boolean(options?.criticalOnly)
      };
      const sources = [
        ...cfg.checklistGroups.flatMap((group) => group.items),
        ...cfg.gaps,
        ...cfg.portfolioProjects,
        ...cfg.templates,
        ...cfg.questionBank
      ];
      const seen = new Set();
      const relevant = sources.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        const personMatch = selected.person === "all" || (item.persons || []).includes(selected.person);
        const pathMatch = selected.path === "all" || (item.paths || []).includes(selected.path);
        const priorityMatch = !selected.criticalOnly || item.priority === "critical" || item.priority === "high";
        return personMatch && pathMatch && priorityMatch;
      });
      const completed = relevant.filter((item) => state.completed?.[item.id] === true).length;
      const criticalOpen = relevant.filter((item) => item.priority === "critical" && state.completed?.[item.id] !== true).length;
      return {
        person: selected.person,
        path: selected.path,
        criticalOnly: selected.criticalOnly,
        total: relevant.length,
        completed: completed,
        remaining: Math.max(0, relevant.length - completed),
        criticalOpen: criticalOpen,
        percent: relevant.length ? Math.round((completed / relevant.length) * 100) : 0,
        itemIds: relevant.map((item) => item.id)
      };
    },

    calculatePeople: function (path) {
      return {
        all: this.calculate({ person: "all", path: path || "all" }),
        mohammad: this.calculate({ person: "mohammad", path: path || "all" }),
        arzoo: this.calculate({ person: "arzoo", path: path || "all" })
      };
    }
  };
})();
