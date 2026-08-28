import CreatePanel from "@/components/create/CreatePanel";
import Seo from "@/components/common/Seo";

export default function CreatePage() {
  return (
    <>
      <Seo
        title="이미지 만들기"
        description="프롬프트를 적고 스타일과 모델을 고르면 끝. AI Horde 대기열을 통해 무료로 이미지를 생성합니다."
      />
      <main className="flex-1">
        <CreatePanel />
      </main>
    </>
  );
}
