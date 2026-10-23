export const PROFILE = {
  name: "عبد الرحمن إبراهيم الشرقاوي",
  short: "عبد الرحمن",
  age: 22,
  sex: "ذكر",
  heightCm: 178,
  doctor: "د. أحمد عبد العزيز",
  clinic: "Nutri-clinic",
  credential:
    "أخصائي التغذية العلاجية واضطرابات النمو – الزمالة المصرية للتغذية العلاجية بالمعهد القومي للتغذية",
  rxDate: "2026-09-01",
  planDate: "2026-06-13",
  inbodyDate: "2026-07-29",
  inbodyTime: "17:05",
  inbodyId: "01012603641",
  inbodyScore: 83,
  device: "InBody120",
} as const;

export const TARGETS = {
  kcal: 1595,
  protein: 66,
  waterMl: 2000,
  screenMinutes: 120,
  walksPerWeek: 5,
  liftsPerCycle: 4,
  sleepBefore: "23:00",
  weightGoal: 75.7,
  fatControlKg: -1.4,
  muscleControlKg: 0,
} as const;

export const EXCHANGES = {
  meat: 4,
  starch: 6,
  veg: 2,
  fruit: 1,
  legume: 0,
  dairy: 2,
  fat: 9,
} as const;

export type ExchangeKey = "meat" | "starch" | "veg" | "fruit" | "dairy" | "fat";

export const EXCHANGE_LABEL: Record<ExchangeKey | "legume", string> = {
  meat: "لحوم",
  starch: "نشويات",
  veg: "خضروات",
  fruit: "فاكهة",
  legume: "بقوليات",
  dairy: "ألبان",
  fat: "دهون",
};

/** Rough exchange factors. Displayed day is scaled to the prescribed 1,595 kcal and 66 g protein. */
export const FACTORS: Record<ExchangeKey, { kcal: number; p: number; c: number; f: number }> = {
  meat: { kcal: 75, p: 7, c: 0, f: 3 },
  starch: { kcal: 80, p: 2, c: 15, f: 0 },
  veg: { kcal: 25, p: 2, c: 5, f: 0 },
  fruit: { kcal: 60, p: 0, c: 15, f: 0 },
  dairy: { kcal: 90, p: 8, c: 12, f: 3 },
  fat: { kcal: 45, p: 0, c: 0, f: 5 },
};

export interface MealDef {
  id: string;
  title: string;
  time: string;
  window: string;
}

export const MEALS: MealDef[] = [
  { id: "breakfast", title: "الفطار", time: "08:00", window: "8 صباحًا" },
  { id: "lunch", title: "الغداء", time: "13:30", window: "1 – 2 مساءً" },
  { id: "dinner", title: "العشاء", time: "21:00", window: "9 مساءً" },
  { id: "snack", title: "بين الوجبات", time: "16:00", window: "موزعة على اليوم" },
];

export interface FoodGroup {
  id: string;
  mealId: string;
  title: string;
  amount: number;
  exchange: ExchangeKey;
  hint: string;
  choices: string[];
}

const VEG = [
  "خيار",
  "قثة",
  "فلفل أخضر",
  "باذنجان",
  "بنجر",
  "طماطم بكمية قليلة",
  "جزر بكمية قليلة",
];

const FATS = [
  "3 ملاعق صغيرة زيت زيتون",
  "3 ملاعق صغيرة زيت ذرة",
  "3 ملاعق صغيرة زيت دوار الشمس",
  "3 ملاعق صغيرة زيت جوز الهند",
  "3 ملاعق صغيرة زبدة",
  "3 ملاعق صغيرة سمنة بلدي",
  "3 ملاعق صغيرة مايونيز",
  "ملعقة كبيرة قشطة",
  "ملعقة كبيرة سمسم",
  "ملعقة كبيرة طحينة",
  "ملعقة كبيرة بذور شيا",
  "ملعقة كبيرة بذور كتان",
  "ملعقة كبيرة جوز هند مبشور",
  "30 جم زيتون أسمر قليل الملح",
  "18 زيتونة كبيرة قليلة الملح",
  "75 جم أفوكادو",
];

const BREAKFAST_STARCH = [
  "0.3 رغيف خبز تموين بلدي",
  "0.5 رغيف خبز أسمر أو سن كبير",
  "رغيف خبز أسمر صغير",
  "توست بني أو شوفان",
  "مخبوزات حبة كاملة",
  "3 ملاعق كبيرة شوفان مطهي أو كينوا أو بليلة (30 جم)",
  "0.5 كوب بطاطا أو بطاطس أو قرع عسلي",
];

const LUNCH_STARCH = [
  "3 ملاعق كبيرة أرز أبيض",
  "3 ملاعق كبيرة أرز بني أو بسمتي",
  "كشري أصفر",
  "مكرونة عادية أو شوفان",
  "شعرية أو لسان عصفور",
  "0.3 رغيف تموين بلدي",
  "0.5 رغيف أسمر أو سن كبير",
  "رغيف أسمر صغير",
  "توست بني أو شوفان 30 جم",
  "0.5 كوب بطاطس أو قلقاس أو بسلة",
];

const DINNER_STARCH = [
  "0.3 رغيف خبز تموين بلدي",
  "0.5 رغيف خبز أسمر أو سن كبير",
  "رغيف خبز أسمر صغير",
  "توست بني أو شوفان",
  "مخبوزات حبة كاملة",
  "3 ملاعق كبيرة شوفان مطهي أو كينوا أو بليلة (30 جم)",
  "1 كوب بطاطا أو بطاطس أو قرع عسلي (100 جم)",
];

const FRUIT = [
  "ثمرة صغيرة موز",
  "تفاح أخضر",
  "كمثرى",
  "جوافة خضراء",
  "كيوي",
  "برتقال",
  "خوخ",
  "1 كوب شمام أو توت أو فراولة أو بطيخ",
  "0.5 كوب كريز أو رمان أو مانجو",
  "2 برقوق",
  "3 مشمش",
  "2 تين شوكي",
  "1 تين برشومي",
  "3 بلح",
  "10 حبات عنب",
  "0.25 كوب فواكه مجففة",
  "3 ملاعق صغيرة سكر أو عسل أو مربى أو دبس — تعادل حصة الفاكهة",
];

export const FOOD_GROUPS: FoodGroup[] = [
  {
    id: "breakfast-meat",
    mealId: "breakfast",
    title: "بروتين",
    amount: 1.2,
    exchange: "meat",
    hint: "3 بياض بيض، أو 45 جم لحم بحجم علبتي كبريت صغيرتين. بدون قلي.",
    choices: [
      "3 بياض بيض",
      "45 جم لحوم مشوية",
      "برجر مشوي",
      "كبدة أو أعضاء داخلية",
      "سجق",
      "بط أو رومي أو فراخ",
      "بانيه مشوي",
      "شاورما فراخ",
      "حمام",
      "معلبات أسماك مصفاة جيدًا",
    ],
  },
  {
    id: "breakfast-fat",
    mealId: "breakfast",
    title: "دهون",
    amount: 3,
    exchange: "fat",
    hint: "تُضاف للجبن أو البيض أو الفول أو الألبان. 3 ملاعق صغيرة زيت = هذه الكتلة.",
    choices: FATS,
  },
  {
    id: "breakfast-veg",
    mealId: "breakfast",
    title: "خضار",
    amount: 0.5,
    exchange: "veg",
    hint: "0.5 كوب (100 جم) بدون قشور أو بذور.",
    choices: VEG,
  },
  {
    id: "breakfast-dairy",
    mealId: "breakfast",
    title: "ألبان",
    amount: 1,
    exchange: "dairy",
    hint: "1 كوب (250 جم) خالي الدسم.",
    choices: ["لبن خالي الدسم", "زبادي خالي الدسم", "رايب خالي الدسم"],
  },
  {
    id: "breakfast-starch",
    mealId: "breakfast",
    title: "نشويات",
    amount: 2,
    exchange: "starch",
    hint: "بديل واحد من قائمة الطبيب يمثّل نصيب الفطار من النشويات.",
    choices: BREAKFAST_STARCH,
  },
  {
    id: "lunch-meat",
    mealId: "lunch",
    title: "بروتين",
    amount: 1.6,
    exchange: "meat",
    hint: "60 جم لحم بحجم علبتي كبريت، أو فول مدشوش / شوربة عدس كبديل بروتين لا كحصة بقول إضافية.",
    choices: [
      "60 جم لحوم مشوية",
      "برجر مشوي",
      "كبدة أو أعضاء",
      "بط أو رومي",
      "سجق",
      "شاورما فراخ",
      "حمام",
      "أرانب",
      "جمبري مخلي مسلوق أو مشوي",
      "8 ملاعق فول مدشوش (200 جم)",
      "شوربة عدس",
    ],
  },
  {
    id: "lunch-fat",
    mealId: "lunch",
    title: "دهون",
    amount: 3,
    exchange: "fat",
    hint: "نفس بدائل الفطار.",
    choices: FATS,
  },
  {
    id: "lunch-veg-raw",
    mealId: "lunch",
    title: "خضار نيء",
    amount: 0.5,
    exchange: "veg",
    hint: "0.5 كوب (100 جم) بدون قشور أو بذور.",
    choices: VEG,
  },
  {
    id: "lunch-veg-cooked",
    mealId: "lunch",
    title: "خضار مطهي",
    amount: 0.5,
    exchange: "veg",
    hint: "حوالي 0.3 كوب (50 جم). ممنوع البطاطس والقلقاس والبسلة هنا لأنها نشويات.",
    choices: ["خضار مطهي غير نشوي", "كوسة", "فاصوليا خضراء", "سبانخ", "ملوخية", "بامية", "قرنبيط", "بروكلي"],
  },
  {
    id: "lunch-starch",
    mealId: "lunch",
    title: "نشويات",
    amount: 2,
    exchange: "starch",
    hint: "3 ملاعق كبيرة ممسوحة، أو بديل الخبز المكافئ.",
    choices: LUNCH_STARCH,
  },
  {
    id: "dinner-meat",
    mealId: "dinner",
    title: "بروتين",
    amount: 1.2,
    exchange: "meat",
    hint: "3 بياض، أو 45 جم لحم، أو جبن طبيعي، أو زبدة فول، أو فول مدشوش.",
    choices: [
      "3 بياض بيض",
      "45 جم لحوم مشوية",
      "كبدة أو أعضاء",
      "سجق أو بط أو رومي أو فراخ",
      "بانيه مشوي أو شاورما أو حمام",
      "45 جم جبنة طبيعية (دومتي / شيدر / قتيلو / مزارع دينا / لبنة / موتزاريلا)",
      "1.5 ملعقة كبيرة زبدة فول سوداني أو مكسرات بدون سكر (30 جم)",
      "0.8 كوب فول مدشوش أو شوربة عدس",
    ],
  },
  {
    id: "dinner-fat",
    mealId: "dinner",
    title: "دهون",
    amount: 3,
    exchange: "fat",
    hint: "3 ملاعق صغيرة زيت أو ما يعادلها من القائمة.",
    choices: FATS,
  },
  {
    id: "dinner-veg",
    mealId: "dinner",
    title: "خضار",
    amount: 0.5,
    exchange: "veg",
    hint: "0.5 كوب (100 جم) بدون قشور أو بذور.",
    choices: VEG,
  },
  {
    id: "dinner-starch",
    mealId: "dinner",
    title: "نشويات",
    amount: 2,
    exchange: "starch",
    hint: "بديل واحد يمثّل نصيب العشاء. البطاطا هنا حتى 1 كوب كما في الملف.",
    choices: DINNER_STARCH,
  },
  {
    id: "snack-dairy",
    mealId: "snack",
    title: "ألبان",
    amount: 1,
    exchange: "dairy",
    hint: "1 كوب (250 جم) لبن كامل الدسم خالي اللاكتوز.",
    choices: ["لبن كامل الدسم خالي اللاكتوز"],
  },
  {
    id: "snack-fruit",
    mealId: "snack",
    title: "فاكهة",
    amount: 1,
    exchange: "fruit",
    hint: "حصة واحدة يوميًا بدون قشور أو بذور. السكر والعسل والمربى والدبس تستهلك هذه الحصة.",
    choices: FRUIT,
  },
];

export const ALLOWED = [
  "حصة فاكهة واحدة يوميًا. 3 ملاعق صغيرة سكر أو عسل أو مربى أو تمر أو دبس تمر أو دبس رمان = نفس الحصة.",
  "النوم بعد الأكل بساعتين، وقبل الساعة 11 مساءً. العشاء 9 مساءً فيقع النوم حول 11.",
  "2 لتر ماء على 8 مرات خلال اليوم.",
  "الشاشات 120 دقيقة على الأكثر.",
];

export const FORBIDDEN = [
  "المشروبات الغازية والمصنعة",
  "العصائر، وخصوصًا عصير القصب",
  "الشوكولاتة",
  "الشيبسي والكاراتيه",
  "الإندومي",
  "المحفوظ والمصنع والألوان الصناعية",
  "الحلويات",
  "المقليات",
];

export type DoseKind = "med" | "supp";

export interface DoseDef {
  id: string;
  name: string;
  detail: string;
  when: string;
  time: string;
  kind: DoseKind;
}

export const DOSES: DoseDef[] = [
  { id: "nexum", name: "Nexum 40", detail: "قبل الفطار بساعة", when: "7:00 ص", time: "07:00", kind: "med" },
  { id: "digestozyme-bf", name: "Digestozyme", detail: "حبتان قبل الفطار", when: "7:40 ص", time: "07:40", kind: "med" },
  { id: "coloverin-bf", name: "Coloverin D", detail: "قبل الفطار", when: "7:40 ص", time: "07:40", kind: "med" },
  { id: "semaneuro", name: "Semaneuro", detail: "قرص مص بعد الفطار", when: "8:20 ص", time: "08:20", kind: "med" },
  { id: "zandros", name: "Zandros", detail: "بعد الفطار", when: "8:20 ص", time: "08:20", kind: "med" },
  { id: "peptamin-am", name: "Peptamin Adult", detail: "5 مكاييل على 200 مل ماء", when: "8:40 ص", time: "08:40", kind: "supp" },
  { id: "whey", name: "Isolated Whey", detail: "مكيال واحد على 300 مل ماء", when: "9:00 ص", time: "09:00", kind: "supp" },
  { id: "creatine", name: "Creatine", detail: "مكيال واحد على 300 مل ماء", when: "9:00 ص", time: "09:00", kind: "supp" },
  { id: "digestozyme-lunch", name: "Digestozyme", detail: "حبتان قبل الغداء", when: "12:40 م", time: "12:40", kind: "med" },
  { id: "coloverin-lunch", name: "Coloverin D", detail: "قبل الغداء", when: "12:40 م", time: "12:40", kind: "med" },
  { id: "cretard", name: "C. Retard 500", detail: "بعد الغداء", when: "2:00 م", time: "14:00", kind: "med" },
  { id: "peptamin-pm", name: "Peptamin Adult", detail: "5 مكاييل على 200 مل ماء", when: "6:00 م", time: "18:00", kind: "supp" },
  { id: "digestozyme-dinner", name: "Digestozyme", detail: "حبتان قبل العشاء", when: "8:40 م", time: "20:40", kind: "med" },
  { id: "coloverin-dinner", name: "Coloverin D", detail: "قبل العشاء", when: "8:40 م", time: "20:40", kind: "med" },
  { id: "zinctron", name: "Zinctron Cap", detail: "قبل النوم", when: "10:30 م", time: "22:30", kind: "med" },
];

export const WHEY_ESTIMATE = { protein: 24, kcal: 120 };

export interface InBodySnap {
  id: string;
  label: string;
  date: string;
  weight: number;
  smm: number;
  pbf: number;
}

export const INBODY_HISTORY: InBodySnap[] = [
  { id: "inbody-1", label: "القراءة 1", date: "", weight: 76.6, smm: 33.8, pbf: 21.6 },
  { id: "inbody-2", label: "القراءة 2", date: "", weight: 78.2, smm: 36.4, pbf: 17.3 },
  { id: "inbody-3", label: "InBody", date: "2026-07-29", weight: 77.1, smm: 36.2, pbf: 16.6 },
];

export const INBODY = {
  score: 83,
  tbw: { value: 47.4, unit: "لتر", low: 39.2, high: 47.9 },
  protein: { value: 12.7, unit: "كجم", low: 10.5, high: 12.8 },
  minerals: { value: 4.26, unit: "كجم", low: 3.63, high: 4.43 },
  fatMass: { value: 12.8, unit: "كجم", low: 8.4, high: 16.7 },
  weight: { value: 77.1, unit: "كجم", low: 59.2, high: 80.2 },
  smm: 36.2,
  ffm: { value: 64.3, unit: "كجم", low: 53.3, high: 65.2 },
  bmc: { value: 3.48, unit: "كجم", low: 2.98, high: 3.64 },
  bmi: 24.3,
  pbf: 16.6,
  bmr: 1759,
  bmrLow: 1644,
  bmrHigh: 1927,
  whr: 0.89,
  whrLow: 0.8,
  whrHigh: 0.9,
  visceral: 6,
  obesityDegree: 111,
  targetWeight: 75.7,
  weightControl: -1.4,
  fatControl: -1.4,
  muscleControl: 0,
};

export interface Segment {
  region: string;
  mass: string;
  percent: string;
  status: "Over" | "Normal";
}

export const SEGMENT_LEAN: Segment[] = [
  { region: "الذراع الأيسر", mass: "3.91 كجم", percent: "121.5%", status: "Over" },
  { region: "الذراع الأيمن", mass: "3.91 كجم", percent: "120.3%", status: "Over" },
  { region: "الجذع", mass: "29.1 كجم", percent: "108.3%", status: "Normal" },
  { region: "الساق اليسرى", mass: "9.61 كجم", percent: "97.5%", status: "Normal" },
  { region: "الساق اليمنى", mass: "9.81 كجم", percent: "99.3%", status: "Normal" },
];

export const SEGMENT_FAT: Segment[] = [
  { region: "الذراع الأيسر", mass: "0.5 كجم", percent: "83.2%", status: "Normal" },
  { region: "الذراع الأيمن", mass: "0.5 كجم", percent: "84.3%", status: "Normal" },
  { region: "الجذع", mass: "6.9 كجم", percent: "—", status: "Normal" },
  { region: "الساق اليسرى", mass: "1.8 كجم", percent: "101.1%", status: "Normal" },
  { region: "الساق اليمنى", mass: "1.8 كجم", percent: "102.7%", status: "Normal" },
];

export type SessionKind = "anterior-a" | "posterior-a" | "anterior-b" | "posterior-b" | "walk" | "rest";

export const CYCLE: SessionKind[] = [
  "anterior-a",
  "posterior-a",
  "rest",
  "anterior-b",
  "posterior-b",
  "rest",
  "rest",
];

export const SESSION_LABEL: Record<SessionKind, string> = {
  "anterior-a": "Anterior A",
  "posterior-a": "Posterior A",
  "anterior-b": "Anterior B",
  "posterior-b": "Posterior B",
  walk: "مشي",
  rest: "راحة",
};

export const SESSION_AR: Record<SessionKind, string> = {
  "anterior-a": "جزء أمامي أ",
  "posterior-a": "جزء خلفي أ",
  "anterior-b": "جزء أمامي ب",
  "posterior-b": "جزء خلفي ب",
  walk: "مشي للحرق",
  rest: "يوم راحة",
};

export type MuscleKey =
  | "shoulders"
  | "chest"
  | "quads"
  | "side"
  | "triceps"
  | "abs"
  | "back"
  | "lats"
  | "hinge"
  | "rear"
  | "hamstrings"
  | "biceps"
  | "calves"
  | "forearms"
  | "adductors"
  | "traps";

export const MUSCLE_LABEL: Record<MuscleKey, string> = {
  shoulders: "أكتاف",
  chest: "صدر",
  quads: "أمام الفخذ",
  side: "كتف جانبي",
  triceps: "ترايسبس",
  abs: "بطن",
  back: "ظهر",
  lats: "لاتس",
  hinge: "خلفية وألية",
  rear: "كتف خلفي",
  hamstrings: "خلفية الفخذ",
  biceps: "بايسبس",
  calves: "سمانة",
  forearms: "ساعد",
  adductors: "ضامة",
  traps: "ترابيس",
};

export interface ExerciseDef {
  id: string;
  session: Exclude<SessionKind, "walk" | "rest">;
  name: string;
  muscle: MuscleKey;
  warmup: string;
  sets: number;
  reps: string;
  rest: string;
  alt1: string;
  alt2: string;
  note: string;
}

function ex(
  session: ExerciseDef["session"],
  slug: string,
  name: string,
  muscle: MuscleKey,
  warmup: string,
  sets: number,
  reps: string,
  rest: string,
  alt1: string,
  alt2: string,
  note: string,
): ExerciseDef {
  return { id: `${session}-${slug}`, session, name, muscle, warmup, sets, reps, rest, alt1, alt2, note };
}

export const EXERCISES: ExerciseDef[] = [
  ex("anterior-a", "shoulder-press", "Machine Shoulder Press", "shoulders", "1–2", 1, "6–8", "3–5 د", "DB Shoulder Press", "Smith Shoulder Press", "بدون تقوّس زائد حتى لا يتحول التمرين لصدر."),
  ex("anterior-a", "chest-press", "Chest Press Machine", "chest", "1–2", 3, "6–10", "3–5 د", "DB Flat Press", "Smith Flat Press", ""),
  ex("anterior-a", "hack-squat", "Hack Squat", "quads", "1–3", 2, "5–8", "3–5 د", "Smith Squat", "Leg Press", "120 درجة ثني تكفي للكوادز، مع محاولة النزول للآخر."),
  ex("anterior-a", "lateral", "Machine Lateral Raises", "side", "1–2", 3, "6–8", "3–5 د", "Cable Lateral Raises", "DB Lateral Raises", "الحركة من الكتف وحده، لا من الجسم كله."),
  ex("anterior-a", "oh-ext", "Overhead Extension", "triceps", "0", 2, "6–10", "3–5 د", "DB Skull Crusher", "—", "لو الكوع يؤلم: بوش داون عادي."),
  ex("anterior-a", "butterfly", "Butterfly", "chest", "1–2", 1, "6–10", "—", "—", "—", ""),
  ex("anterior-a", "crunch", "Lat Pulldown Crunches", "abs", "0", 2, "6–10", "3–5 د", "Cable Crunch", "—", "الثني من العمود الفقري، لا من تحريك الظهر كله."),
  ex("anterior-a", "leg-ext", "Leg Extension", "quads", "1–2", 1, "8–12", "3–5 د", "Banded Leg Extension", "—", "لو الجهاز غير موجود: بانديز."),
  ex("posterior-a", "tbar", "T Bar Row", "back", "1–2", 2, "5–7", "3–5 د", "Incline DB Row", "Cable Row", "الكوع للخارج قريبًا من 90 درجة حسب راحة الكتف."),
  ex("posterior-a", "pulldown", "Machine Wide Grip Lat Pulldown", "lats", "1–3", 3, "6–8", "3–5 د", "Cable Wide Grip Lat Pulldown", "—", "مسار الكوع وضم الكتفين، لا سحب أعلى الظهر فقط."),
  ex("posterior-a", "rdl", "RDL", "hinge", "1–3", 1, "5–8", "3–5 د", "Hip Extension", "Hip Thrust", ""),
  ex("posterior-a", "rear-delt", "SA Rear Delt Flies", "rear", "0", 1, "6–10", "3–5 د", "Reverse Pec Dec", "—", "افصل لوحي الكتف قبل الحركة وركّز على الكتف الخلفي."),
  ex("posterior-a", "leg-curl", "Seated Leg Curl", "hamstrings", "1–2", 2, "8–12", "3–5 د", "Lying Leg Curl", "SLDL", "لو الجهازان غير موجودين: SLDL."),
  ex("posterior-a", "preacher", "Preacher Curl Machine", "biceps", "0", 2, "6–10", "3–5 د", "Face In Curls", "—", "المدى من الكوع فقط. بلا تأرجح ولا كتف زائد."),
  ex("posterior-a", "calf", "Leg Press Calf Raises", "calves", "1–2", 2, "5–7", "3–5 د", "Smith Calf Raises", "DB Step Calf", "الركبة مفرودة. يمكن دامبل على ستيب."),
  ex("posterior-a", "wrist", "Wrist Curls", "forearms", "0", 2, "6–10", "3–5 د", "—", "—", "افرد الأصابع في الاستطالة واختر وزنًا لانقباض كامل."),
  ex("anterior-b", "incline", "Incline Chest Press Machine", "chest", "1–2", 2, "6–10", "3–5 د", "DB Incline Press", "Smith Incline Press", "لو الجهاز ضعيف والكيبل متاح، العب كيبل."),
  ex("anterior-b", "shoulder-press", "Machine Shoulder Press", "shoulders", "1–2", 2, "6–8", "3–5 د", "DB Shoulder Press", "Smith Shoulder Press", "بدون تقوّس يحوّله إلى صدر."),
  ex("anterior-b", "leg-ext", "Leg Extension", "quads", "1–2", 3, "8–12", "3–5 د", "Banded Leg Extension", "—", "لو الجهاز غير موجود: بانديز."),
  ex("anterior-b", "lateral", "Cable Lateral Raises", "side", "1–2", 2, "6–8", "3–5 د", "DB Lateral Raises", "—", "يفضَّل الكيبل. لا تبدّله إلا للضرورة."),
  ex("anterior-b", "pushdown", "SA Tricep Pushdown", "triceps", "0", 3, "6–10", "3–5 د", "Double Rope Pushdown", "—", "فرد الكوع فقط. بلا تأرجح أو كتف."),
  ex("anterior-b", "butterfly", "Butterfly", "chest", "1–2", 1, "6–10", "—", "Cable Fly", "—", "تقريب الوزن نحو الكوع أفضل، وليس شرطًا."),
  ex("anterior-b", "adduction", "Hip Adduction", "adductors", "1–2", 1, "6–8", "3–5 د", "Cable Hip Adduction", "—", "ثبّت نفسك بالمقبض. لا تزحزح الجسم."),
  ex("anterior-b", "reverse-curl", "Reverse Grip Curls", "biceps", "0", 2, "6–10", "3–5 د", "DB Reverse Curl", "Barbell Reverse Curl", "بدّل القبضة براحتك مع بقاء نفس الأداء."),
  ex("posterior-b", "tbar", "T Bar Row", "back", "1–2", 2, "5–7", "3–5 د", "Incline DB Row", "Cable Row", "الكوع للخارج قريبًا من 90 درجة حسب راحة الكتف."),
  ex("posterior-b", "sa-row", "SA Lat Row", "lats", "1–3", 2, "6–8", "3–5 د", "Cable SA Lat Row", "DB SA Lat Row", "بلا لف حول الجسم. الثبات طول الحركة."),
  ex("posterior-b", "face-curl", "Face Away Curl", "biceps", "0", 2, "6–10", "3–5 د", "DB Curls", "—", "المدى من الكوع. بلا تأرجح."),
  ex("posterior-b", "rdl", "RDL", "hinge", "1–3", 1, "5–8", "3–5 د", "Hip Extension", "Hip Thrust", ""),
  ex("posterior-b", "rear-delt", "SA Rear Delt Flies", "rear", "0", 1, "6–10", "3–5 د", "Reverse Pec Dec", "—", "افصل اللوحين قبل الحركة."),
  ex("posterior-b", "shrug", "Cable Shrugs", "traps", "1", 1, "6–10", "—", "DB Shrug", "Smith Shrug", "البديل دامبل أو سميث مقبول."),
  ex("posterior-b", "leg-curl", "Seated Leg Curl", "hamstrings", "1–2", 2, "8–12", "3–5 د", "Lying Leg Curl", "SLDL", "لو الجهازان غير موجودين: SLDL."),
  ex("posterior-b", "calf", "Leg Press Calf Raises", "calves", "1–2", 2, "5–7", "3–5 د", "Smith Calf Raises", "DB Step Calf", "الركبة مفرودة."),
];

export const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function exercisesFor(session: ExerciseDef["session"]) {
  return EXERCISES.filter((e) => e.session === session);
}

export const WARMUP_PROTOCOL = [
  { reps: "10 لكل جانب", name: "Pallof Press" },
  { reps: "10 لكل جانب", name: "Pallof Rotation" },
  { reps: "10", name: "External Rotation" },
  { reps: "10", name: "Scapula Push Plus" },
];

export const WARMUP_RULES = [
  { kind: "تمرين غير ثقيل", detail: "مجموعة واحدة: حوالي 60% من وزن العمل، 3 إلى 6 عدات." },
  { kind: "شدة متوسطة", detail: "مجموعتان: 50% لـ 3–6 عدات، ثم 75–80% لـ 3 عدات." },
  { kind: "تمرين ثقيل", detail: "2 إلى 4 مجاميع: 50%، ثم 75–80% لـ 3، ثم 85–90% لـ 1–3 عدات." },
];

export const TRAINING_RULES = [
  "افهم التسخين قبل المجموعة الأولى. البروتوكول أقل من 10 دقائق.",
  "الفشل العضلي: العجز عن عدة كاملة بنفس جودة أول عدة. لا تبدأ عدة تعرف أنها لن تكتمل، ولا عدات جزئية ما لم يُطلب ذلك.",
  "لا تزِد مجموعات أو تمارين ولا تغيّر الترتيب قبل 12 أسبوع. المسموح فقط تقدّم تدريجي في العدات أو الوزن.",
  "كل تمرين في ملف المدرب مربوط بفيديو. شاهده بين مجموعات الراحة.",
  "لو التمرين أكثر من 4 أيام في الأسبوع، أعد الدورة بعد يوم راحة واحد فقط.",
  "المصدر: Belghamdi Splits – Anterior × Posterior. حقوق النشر 2024 لـ Bassam El Ghamdi.",
];

export const MEASURE_RANGES = {
  weight: [40, 220],
  waist: [50, 160],
  chest: [60, 170],
  arm: [18, 60],
  thigh: [30, 95],
  pbf: [3, 55],
  smm: [15, 70],
} as const;
