import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reveal } from "@/components/Reveal";
import { IconArrowRight, IconPlay } from "@/components/Icon";
import { CloseButton } from "@/components/CloseButton";
import { constructionApi, type ConstructionEntry } from "@/lib/cms";

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const PAGE_PAD = "px-20";

export function ConstructionGalleryScreen() {
  const nav = useNavigate();
  const [items, setItems] = useState<ConstructionEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    constructionApi
      .list()
      .then(setItems)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-base-0 text-base-800">
      <CloseButton
        onClick={() => nav(-1)}
        className="absolute right-9 top-9 z-50"
      />

      <div
        className="h-full w-full overflow-y-auto"
        style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
      >
        <header className={`${PAGE_PAD} pb-12 pt-16`}>
          <Reveal mode="up">
            <p className="flex items-center gap-3 font-display text-upper font-extrabold uppercase tracking-[-0.02em] text-base-800">
              <span className="inline-block h-2.5 w-2.5 bg-base-800" />
              Общий статус
            </p>
            <h1 className="mt-6 font-display text-[64px] font-semibold uppercase leading-[1.1] tracking-[-0.02em] text-base-800">
              Динамика
              <br />
              строительства
            </h1>
            <p className="mt-6 max-w-[720px] font-sans text-body leading-relaxed text-base-700">
              Архив прогресса строительства по месяцам — фото, описание этапов
              и видеозаписи с площадки.
            </p>
          </Reveal>
        </header>

        <div className={`${PAGE_PAD} pb-24`}>
          {error && (
            <div className="border border-red-200 bg-red-50 px-5 py-3 font-sans text-small text-red-700">
              Не удалось загрузить галерею: {error}
            </div>
          )}

          {items == null && !error && (
            <p className="font-sans text-body text-base-600">Загрузка…</p>
          )}

          {items && items.length === 0 && (
            <p className="font-sans text-body text-base-600">
              Пока нет архивных записей. Они появятся здесь после ежемесячных
              обновлений.
            </p>
          )}

          {items && items.length > 0 && (
            <div className="flex flex-col gap-16">
              {items.map((it, idx) => (
                <Reveal key={it.id} mode="up" delay={Math.min(idx * 60, 240)}>
                  <EntryCard entry={it} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryCard({ entry }: { entry: ConstructionEntry }) {
  const period = `${MONTHS[entry.month - 1]} ${entry.year}`;
  return (
    <article className="grid grid-cols-[1fr_1.4fr] gap-12 border-t border-base-200 pt-12">
      {/* Left — period + text */}
      <div className="flex flex-col">
        <p className="font-display text-upper font-extrabold uppercase tracking-[-0.02em] text-base-600">
          {period}
        </p>
        {entry.title && (
          <h2 className="mt-4 font-display text-[36px] font-bold uppercase leading-[1.1] tracking-[-0.02em] text-base-800">
            {entry.title}
          </h2>
        )}
        {entry.body && (
          <p className="mt-6 font-sans text-body leading-relaxed text-base-700">
            {entry.body}
          </p>
        )}
        {entry.bullets.length > 0 && (
          <ul className="mt-6 space-y-3 font-sans text-body leading-relaxed text-base-700">
            {entry.bullets.map((b, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-[9px] inline-block h-[5px] w-[5px] flex-shrink-0 rounded-full bg-base-800" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        {entry.videoUrl && (
          <a
            href={entry.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex h-12 w-fit items-center gap-3 bg-night-500 px-5 font-sans text-body font-medium text-base-0 transition-colors hover:bg-night-400"
          >
            <IconPlay size={16} />
            Смотреть видео
            <IconArrowRight size={16} />
          </a>
        )}
      </div>

      {/* Right — photos grid */}
      <div className="grid grid-cols-2 gap-3">
        {entry.photos.length === 0 ? (
          <div className="col-span-2 grid aspect-[3/2] place-items-center bg-base-100 font-sans text-small text-base-500">
            Фото не загружены
          </div>
        ) : (
          entry.photos.map((url, i) => (
            <div
              key={i}
              className={`relative overflow-hidden bg-base-100 ${
                entry.photos.length === 1
                  ? "col-span-2 aspect-[3/2]"
                  : i === 0 && entry.photos.length === 3
                    ? "col-span-2 aspect-[3/2]"
                    : "aspect-[4/3]"
              }`}
            >
              <img
                src={url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ))
        )}
      </div>
    </article>
  );
}
