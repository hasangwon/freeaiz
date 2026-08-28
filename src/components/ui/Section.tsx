import type { ReactNode } from "react";

type Props = {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
};

/** 생성 폼에서 반복되는 "제목 + 설명 + 내용" 묶음. */
export default function Section({ title, hint, action, children }: Props) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        {action}
      </div>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {children}
    </section>
  );
}
