import { createFileRoute } from "@tanstack/react-router";
import { ALLOWED, EXCHANGE_LABEL, EXCHANGES, FOOD_GROUPS, FORBIDDEN, MEALS, TARGETS, type ExchangeKey } from "@/lib/clinical";
import { dayNutrition } from "@/lib/analytics";
import { formatShort, lastNDates, num } from "@/lib/format";
import { useProtocol } from "@/lib/store";
import { Shell } from "@/components/shell";
import { Columns } from "@/components/charts";
import { Card, DateBar, Meter, PageIntro } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/nutrition")({
  component: NutritionPage,
});

const KEYS: ExchangeKey[] = ["meat", "starch", "veg", "fruit", "dairy", "fat"];

function NutritionPage() {
  const state = useProtocol();
  const focus = state.focusDate;
  const food = dayNutrition(state.groups, focus);
  const week = lastNDates(focus, 7).map((date) => {
    const row = dayNutrition(state.groups, date);
    return { label: formatShort(date), value: Math.round(row.kcal), ratio: row.ratio };
  });

  return (
    <Shell>
      <PageIntro
        kicker="النظام · 13 يونيو 2026"
        title="الغذاء اليوم"
        body="كل كتلة بدائلها من ملف الطبيب. إتمامها يملأ نصيبها من جدول الحصص حتى يكتمل اليوم على 1,595 سعر و66 جم بروتين."
      />
      <DateBar />

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Card>
          <p className="text-xs text-muted">سعرات الطعام</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{num(food.kcal, 0)}</p>
          <p className="text-xs text-muted">من {num(TARGETS.kcal)}</p>
          <div className="mt-3">
            <Meter value={food.kcal} max={TARGETS.kcal} />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted">بروتين الطعام</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{num(food.protein, 0)}</p>
          <p className="text-xs text-muted">من {TARGETS.protein} جم · الواي يُعرض منفصلًا</p>
          <div className="mt-3">
            <Meter value={food.protein} max={TARGETS.protein} />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted">اكتمال الكتل</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{Math.round(food.ratio * 100)}%</p>
          <p className="text-xs text-muted">
            {food.doneCount} / {food.totalCount} · كرب {num(food.carbs, 0)} جم · دهون {num(food.fat, 0)} جم تقديريًا
          </p>
          <div className="mt-3">
            <Meter value={food.doneCount} max={food.totalCount} />
          </div>
        </Card>
      </div>

      <Card className="mt-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {KEYS.map((key) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{EXCHANGE_LABEL[key]}</span>
                <span className="tabular-nums text-muted">
                  {num(food.exchanges[key], 1)} / {EXCHANGES[key]}
                </span>
              </div>
              <Meter value={food.exchanges[key]} max={EXCHANGES[key] || 1} />
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 space-y-4">
        {MEALS.map((meal) => {
          const groups = FOOD_GROUPS.filter((g) => g.mealId === meal.id);
          const done = groups.filter((g) => state.groups.some((x) => x.date === focus && x.groupId === g.id && x.done)).length;
          return (
            <Card key={meal.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{meal.title}</h2>
                  <p className="text-xs text-muted">
                    {meal.window} · {done}/{groups.length}
                  </p>
                </div>
                <button
                  className="h-11 rounded-xl bg-accent-soft px-3 text-sm font-medium text-accent"
                  onClick={() => {
                    const allDone = done === groups.length;
                    for (const group of groups) {
                      const cur = state.groups.find((g) => g.date === focus && g.groupId === group.id);
                      state.setGroup(focus, group.id, {
                        done: !allDone,
                        choice: cur?.choice || group.choices[0] || "",
                      });
                    }
                  }}
                >
                  {done === groups.length ? "إلغاء الوجبة" : "تسجيل الوجبة"}
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {groups.map((group) => {
                  const log = state.groups.find((g) => g.date === focus && g.groupId === group.id);
                  return (
                    <div key={group.id} className="rounded-xl border border-line p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{group.title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted">{group.hint}</p>
                        </div>
                        <button
                          className={cn(
                            "h-11 shrink-0 rounded-xl px-3 text-sm font-medium",
                            log?.done ? "bg-accent text-accent-fg" : "border border-line",
                          )}
                          onClick={() =>
                            state.setGroup(focus, group.id, {
                              done: !log?.done,
                              choice: log?.choice || group.choices[0] || "",
                            })
                          }
                        >
                          {log?.done ? "تم" : "تحديد"}
                        </button>
                      </div>
                      <label className="mt-3 block text-xs text-muted" htmlFor={group.id}>
                        ماذا أكلت
                      </label>
                      <select
                        id={group.id}
                        className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm"
                        value={log?.choice ?? ""}
                        onChange={(e) => state.setGroup(focus, group.id, { choice: e.target.value, done: true })}
                      >
                        <option value="">اختر البديل</option>
                        {group.choices.map((choice) => (
                          <option key={choice} value={choice}>
                            {choice}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold">سعرات 7 أيام</p>
          <Columns data={week} unit="سعر" />
          <p className="text-xs text-muted">
            متوسط الاكتمال{" "}
            {Math.round((week.reduce((a, d) => a + d.ratio, 0) / week.length) * 100)}% يشمل الأيام الفارغة.
          </p>
        </Card>
        <Card>
          <p className="text-sm font-semibold">المسموح</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
            {ALLOWED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-semibold text-fg">الممنوع</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {FORBIDDEN.map((item) => (
              <li key={item} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Shell>
  );
}
