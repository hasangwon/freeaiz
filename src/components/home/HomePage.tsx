import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import TextareaAutosize from "react-textarea-autosize";
import HordeStatusBar from "./HordeStatusBar";
import RecentCreations from "./RecentCreations";
import Button from "@/components/ui/Button";
import { EXAMPLE_PROMPTS } from "@/components/create/PromptComposer";

const STEPS = [
  {
    emoji: "✍️",
    title: "프롬프트를 적는다",
    body: "그리고 싶은 장면을 문장으로 설명하면 됩니다.",
  },
  {
    emoji: "⏳",
    title: "대기열에 올라간다",
    body: "전 세계 사용자가 내어 준 GPU가 순서대로 요청을 처리합니다.",
  },
  {
    emoji: "🖼️",
    title: "이미지를 받는다",
    body: "완성된 이미지는 이 브라우저에 자동으로 보관됩니다.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const start = () => {
    const trimmed = prompt.trim();
    router.push(
      trimmed ? `/create?prompt=${encodeURIComponent(trimmed)}` : "/create"
    );
  };

  return (
    <main className="flex-1">
      {/* 히어로 */}
      <section className="space-y-5 bg-gradient-to-b from-secondary/40 to-white px-4 pb-8 pt-8">
        <div className="space-y-2 text-center">
          <h1 className="text-[26px] font-extrabold leading-tight text-gray-900">
            상상한 그림을,
            <br />
            <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
              무료로 지금 바로
            </span>
          </h1>
          <p className="text-sm leading-relaxed text-gray-600">
            로그인도, 결제도, GPU도 필요 없습니다.
            <br />
            문장 하나면 충분합니다.
          </p>
        </div>

        <HordeStatusBar />

        {/* 빠른 시작 입력 */}
        <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <TextareaAutosize
            minRows={2}
            maxRows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              // 데스크톱에서는 Enter로 바로 시작, 줄바꿈은 Shift+Enter
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                start();
              }
            }}
            placeholder="예: 비 내리는 밤의 도쿄 거리, 네온 반사"
            aria-label="프롬프트"
            className="w-full resize-none bg-transparent px-1 py-1 text-sm leading-relaxed outline-none placeholder:text-gray-400"
          />
          <Button size="lg" fullWidth onClick={start}>
            무료로 만들기 →
          </Button>
        </div>

        {/* 예시 프롬프트 */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXAMPLE_PROMPTS.slice(0, 5).map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              className="shrink-0 cursor-pointer rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] text-gray-600 transition hover:border-primary hover:text-primary"
            >
              {example.length > 22 ? `${example.slice(0, 22)}…` : example}
            </button>
          ))}
        </div>
      </section>

      {/* 최근 작업 */}
      <RecentCreations />

      {/* 동작 방식 */}
      <section className="space-y-4 px-4 py-8">
        <h2 className="text-center text-base font-extrabold text-gray-900">
          어떻게 무료인가요?
        </h2>
        <p className="text-center text-xs leading-relaxed text-gray-600">
          FREE AIz는{" "}
          <a
            href="https://aihorde.net"
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-primary underline underline-offset-2"
          >
            AI Horde
          </a>
          의 공유 대기열 위에서 동작합니다. 자원을 기부한 사람들의 GPU가 순서대로
          요청을 처리하기 때문에, 비용 대신 약간의 기다림이 필요합니다.
        </p>

        <ol className="space-y-2">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm"
              >
                {step.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  <span className="mr-1.5 text-primary">{index + 1}</span>
                  {step.title}
                </p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-[11px] leading-relaxed text-amber-900">
          <strong className="block pb-1">알아 두실 점</strong>
          붐비는 시간대에는 대기가 길어질 수 있습니다. 고해상도를 끄거나 워커가
          많은 모델을 고르면 훨씬 빨리 받아 볼 수 있어요. 생성된 이미지는 서버에
          저장되지 않고 이 브라우저에만 보관됩니다.
        </div>

        <Link href="/create" className="block">
          <Button size="lg" fullWidth variant="secondary">
            바로 만들러 가기
          </Button>
        </Link>
      </section>
    </main>
  );
}
