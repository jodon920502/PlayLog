import { Heart } from "lucide-react";
import Navbar from "../components/layout/Navbar";

const authorLinks = [
  {
    label: "GitHub",
    href: "https://github.com/jodon920502",
    icon: "./images/GitHub_Invertocat_White.png",
  },
  {
    label: "Twitch",
    href: "https://twitch.tv/yosora_rin",
    icon: "./images/glitch_flat_purple.png",
  },
];

const techStack = [
  {
    category: "Frontend",
    technologies: ["React", "TypeScript", "Vite", "Tailwind CSS"],
  },
  { category: "Backend", technologies: ["Node.js", "Express", "TypeScript"] },
  { category: "Database", technologies: ["PostgreSQL"] },
  { category: "Infrastructure", technologies: ["Docker"] },
];

export default function AboutPage() {
  return (
    <div className="app-shell min-h-screen">
      <Navbar />
      <main className="page-width py-10 sm:py-14">
        <header className="mb-10 max-w-2xl">
          <p className="section-label mb-3">About PlayLog</p>
          <h1 className="display-font text-4xl font-bold text-[#f5f3ed] sm:text-5xl">
            關於 PlayLog
          </h1>
          <p className="mt-4 text-base leading-7 text-[#a5a7af]">
            一個以玩家為核心的遊戲評測與社群平台。
          </p>
        </header>

        <section className="glass rounded-2xl p-6 sm:p-8">
          <div className="max-w-3xl">
            <p className="section-label mb-3">The idea</p>
            <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">
              關於 PlayLog
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#b9bbc2]">
              PlayLog 是一個以玩家與遊戲體驗為核心的遊戲社群平台。
              目標是讓玩家可以探索遊戲、分享評分與評測、記錄玩過的遊戲，
              建立自己的遊戲收藏，整理個人的遊戲歷程，並探索其他玩家的遊戲體驗。
            </p>
            <p className="mt-4 text-sm leading-7 text-[#b9bbc2]">
              PlayLog
              不只是遊戲資訊查詢網站，而是更加著重玩家產生的內容與個人遊戲體驗。
              目前專案仍在持續開發中。
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <p className="section-label mb-3">The creator</p>
            <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">
              關於作者
            </h2>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f2c544] text-sm font-bold text-[#10120f]">
                YR
              </div>
              <div>
                <h3 className="font-semibold text-[#eeece5]">
                  Yosora Rin / 夜空りん
                </h3>
                <p className="mt-1 text-xs text-[#777b86]">
                  PlayLog 的設計與開發者。
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm leading-7 text-[#b9bbc2]">
              喜歡遊戲、程式開發與各種科技相關內容。PlayLog
              起源於希望建立一個以玩家實際體驗為核心，
              能夠記錄與分享遊戲歷程的平台。
            </p>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8">
            <p className="section-label mb-3">Built with</p>
            <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">
              Tech Stack
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {techStack.map((stack) => (
                <div
                  key={stack.category}
                  className="rounded-xl border border-white/[.07] bg-[#151821] p-4"
                >
                  <h3 className="text-sm font-semibold text-[#f2c544]">
                    {stack.category}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stack.technologies.map((technology) => (
                      <span
                        key={technology}
                        className="rounded-md bg-[#202430] px-2.5 py-1 text-[11px] text-[#c5c6ca]"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Heart size={17} className="text-[#f2c544]" />
            <h2 className="display-font text-2xl font-bold text-[#f5f3ed]">
              作者連結
            </h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {authorLinks.map(({ label, href, icon }) =>
              href ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-[#151821] p-4 text-sm text-[#deddd7] transition hover:border-[#f2c544]/40 hover:text-[#f2c544]"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[#242b39] text-[9px] font-bold text-[#f2c544]">
                    <img src={icon} alt={label} />
                  </span>
                  <span>{label}</span>
                </a>
              ) : (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-[#151821] p-4 text-sm text-[#777b86]"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-[#202430] text-[9px] font-bold text-[#777b86]">
                    <img src={icon} alt={label} />
                  </span>
                  <span>{label}</span>
                  <span className="ml-auto text-[11px]">連結尚未設定</span>
                </div>
              ),
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
