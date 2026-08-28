import TextareaAutosize from "react-textarea-autosize";
import { LIMITS } from "@/lib/horde/constants";

/** 아이디어가 막혔을 때 눌러 쓸 수 있는 예시들. */
export const EXAMPLE_PROMPTS = [
  "해질녘 서울 골목, 젖은 아스팔트에 비친 네온사인",
  "우주복을 입은 고양이가 달 표면에 앉아 지구를 바라본다",
  "이끼 낀 폐허 속 유리 온실, 안개 사이로 들어오는 빛줄기",
  "한복을 입은 소녀와 커다란 흰 호랑이, 수묵화 스타일",
  "구름 위에 떠 있는 도시, 하늘을 나는 고래들",
  "빈티지 필름 카메라로 찍은 여름 해변, 오후 4시의 햇살",
  "사이버펑크 포장마차, 홀로그램 간판과 김이 나는 국물",
  "거대한 도서관 속 나선형 계단, 책이 공중에 떠 있다",
];

type Props = {
  prompt: string;
  negativePrompt: string;
  disabled?: boolean;
  onPromptChange: (value: string) => void;
  onNegativeChange: (value: string) => void;
};

export default function PromptComposer({
  prompt,
  negativePrompt,
  disabled,
  onPromptChange,
  onNegativeChange,
}: Props) {
  const overLimit = prompt.length > LIMITS.promptMaxLength;

  const pickExample = () => {
    const next =
      EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    onPromptChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="prompt" className="text-sm font-bold text-gray-900">
          무엇을 그릴까요?
        </label>
        <button
          type="button"
          onClick={pickExample}
          disabled={disabled}
          className="cursor-pointer rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        >
          🎲 예시 넣기
        </button>
      </div>

      <div
        className={`rounded-2xl border bg-white transition focus-within:ring-2 ${
          overLimit
            ? "border-red-300 focus-within:ring-red-200"
            : "border-gray-300 focus-within:border-primary focus-within:ring-primary/20"
        }`}
      >
        <TextareaAutosize
          id="prompt"
          minRows={3}
          maxRows={10}
          value={prompt}
          disabled={disabled}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="원하는 장면을 자유롭게 적어 주세요. 한국어도 어느 정도 통하지만, 영어로 쓰면 결과가 더 정확합니다."
          className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-gray-400 disabled:opacity-60"
        />
        <div className="flex items-center justify-between px-4 pb-2.5">
          <span
            className={`text-[11px] ${
              overLimit ? "text-red-600" : "text-gray-400"
            }`}
          >
            {prompt.length} / {LIMITS.promptMaxLength}
          </span>
          {prompt.length > 0 && (
            <button
              type="button"
              onClick={() => onPromptChange("")}
              disabled={disabled}
              className="cursor-pointer text-[11px] text-gray-400 transition hover:text-gray-700 disabled:opacity-50"
            >
              지우기
            </button>
          )}
        </div>
      </div>

      <details className="group rounded-2xl border border-gray-200 bg-gray-50/60">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-700">
          제외할 요소 (선택)
          <span className="text-gray-400 transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="px-4 pb-3">
          <TextareaAutosize
            minRows={2}
            value={negativePrompt}
            disabled={disabled}
            onChange={(e) => onNegativeChange(e.target.value)}
            placeholder="예: text, watermark, extra fingers"
            className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          <p className="pt-1.5 text-[11px] text-gray-500">
            품질 관련 기본 제외어는 자동으로 함께 적용됩니다.
          </p>
        </div>
      </details>
    </div>
  );
}
