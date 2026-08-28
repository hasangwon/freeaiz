import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import AdvancedSettings from "./AdvancedSettings";
import ModelPicker from "./ModelPicker";
import PromptComposer from "./PromptComposer";
import QueueStatus from "./QueueStatus";
import ResultGallery from "./ResultGallery";
import SizePicker from "./SizePicker";
import StylePicker from "./StylePicker";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { useGeneration } from "@/hooks/useGeneration";
import { useModels } from "@/hooks/useModels";
import { STYLE_PRESETS } from "@/lib/horde/constants";
import {
  clampSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  popReuse,
  resolveParams,
  resolveSize,
  saveSettings,
  type CreateSettings,
} from "@/lib/horde/settings";

export default function CreatePanel() {
  const router = useRouter();
  const { models, recommended, loading, defaultModel } = useModels();
  const {
    phase,
    progress,
    results,
    error,
    warning,
    isBusy,
    generate,
    cancel,
    dismissWarning,
  } = useGeneration();

  const [settings, setSettings] = useState<CreateSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [modelNote, setModelNote] = useState<string | null>(null);

  // 사용자가 모델을 직접 고른 뒤에는 스타일 변경이 모델을 덮어쓰지 않게 한다.
  const modelTouchedRef = useRef(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // 저장된 설정 → "다시 만들기" 값 → URL 프롬프트 순으로 덮어쓴다.
  useEffect(() => {
    if (!router.isReady) return;

    const stored = loadSettings();
    const reuse = popReuse();
    const queryPrompt = router.query.prompt;
    const promptFromQuery =
      typeof queryPrompt === "string" ? queryPrompt : undefined;

    setSettings((prev) =>
      clampSettings({
        ...prev,
        ...stored,
        ...(reuse ?? {}),
        ...(promptFromQuery ? { prompt: promptFromQuery } : {}),
      })
    );

    if (reuse?.model || stored.model) modelTouchedRef.current = true;
    setHydrated(true);
  }, [router.isReady, router.query.prompt]);

  // 모델 목록을 받아 온 뒤, 저장된 모델이 사라졌으면 기본값으로 되돌린다.
  useEffect(() => {
    if (!hydrated || loading || models.length === 0) return;
    setSettings((prev) =>
      models.some((m) => m.name === prev.model)
        ? prev
        : { ...prev, model: defaultModel }
    );
  }, [hydrated, loading, models, defaultModel]);

  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [hydrated, settings]);

  // 결과가 나오면 그 위치로 부드럽게 이동한다.
  useEffect(() => {
    if (phase === "done" && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase]);

  const update = useCallback(
    <K extends keyof CreateSettings>(key: K, value: CreateSettings[K]) => {
      if (key === "model") modelTouchedRef.current = true;
      setSettings((prev) => clampSettings({ ...prev, [key]: value }));
    },
    []
  );

  /** 스타일에 어울리는 모델이 있고 사용자가 모델을 안 건드렸으면 맞춰 준다. */
  const changeStyle = useCallback(
    (styleId: string) => {
      setModelNote(null);
      setSettings((prev) => {
        const next = { ...prev, styleId };
        if (modelTouchedRef.current) return next;

        const preset = STYLE_PRESETS.find((s) => s.id === styleId);
        const match = preset?.preferredModels?.find((name) =>
          models.some((m) => m.name === name)
        );
        if (match && match !== prev.model) {
          next.model = match;
          setModelNote(`${preset?.label} 스타일에 맞춰 모델을 ${match}로 바꿨습니다.`);
        }
        return next;
      });
    },
    [models]
  );

  const size = useMemo(() => resolveSize(settings), [settings]);
  const canGenerate = settings.prompt.trim().length > 0 && !isBusy;

  const submit = useCallback(() => {
    if (!canGenerate) return;
    generate({
      prompt: settings.prompt,
      negativePrompt: settings.negativePrompt,
      model: settings.model,
      styleId: settings.styleId,
      params: resolveParams(settings),
      nsfw: settings.nsfw,
    });
  }, [canGenerate, generate, settings]);

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <PromptComposer
        prompt={settings.prompt}
        negativePrompt={settings.negativePrompt}
        disabled={isBusy}
        onPromptChange={(v) => update("prompt", v)}
        onNegativeChange={(v) => update("negativePrompt", v)}
      />

      <Section title="스타일">
        <StylePicker
          value={settings.styleId}
          disabled={isBusy}
          onChange={changeStyle}
        />
      </Section>

      <Section title="비율 / 크기">
        <SizePicker
          ratioId={settings.ratioId}
          hiRes={settings.hiRes}
          width={size.width}
          height={size.height}
          disabled={isBusy}
          onRatioChange={(v) => update("ratioId", v)}
          onHiResChange={(v) => update("hiRes", v)}
        />
      </Section>

      <Section
        title="모델"
        hint="워커가 많고 예상 시간이 짧은 모델일수록 빨리 나옵니다."
      >
        {modelNote && (
          <Alert tone="info" onDismiss={() => setModelNote(null)}>
            {modelNote}
          </Alert>
        )}
        <ModelPicker
          models={recommended}
          all={models}
          value={settings.model}
          disabled={isBusy}
          loading={loading}
          onChange={(v) => update("model", v)}
        />
      </Section>

      <AdvancedSettings
        settings={settings}
        disabled={isBusy}
        onChange={update}
      />

      {warning && (
        <Alert tone="warning" onDismiss={dismissWarning}>
          {warning}
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}

      <QueueStatus phase={phase} progress={progress} onCancel={cancel} />

      <div className="sticky bottom-0 -mx-4 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
        <Button
          size="lg"
          fullWidth
          loading={isBusy}
          disabled={!canGenerate}
          onClick={submit}
        >
          {isBusy
            ? "생성 중…"
            : `이미지 만들기${settings.count > 1 ? ` · ${settings.count}장` : ""}`}
        </Button>
        <p className="pt-2 text-center text-[11px] text-gray-400">
          완전 무료 · 로그인 불필요 · AI Horde 대기열 사용
        </p>
      </div>

      <div ref={resultsRef}>
        <ResultGallery results={results} onRegenerate={submit} busy={isBusy} />
      </div>
    </div>
  );
}
