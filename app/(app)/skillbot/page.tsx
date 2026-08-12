import { PageContainer, PageHeader } from "@/components/shell/page";
import { configuredProviders } from "@/lib/ai/fallback-chain";
import { requireUser } from "@/lib/firebase/admin";
import type { Metadata } from "next";
import { SkillBotChat } from "./skillbot-chat";

export const metadata: Metadata = {
  title: "SkillBot",
  robots: { index: false, follow: false },
};

export default async function SkillBotPage() {
  const me = await requireUser();
  const providers = configuredProviders();

  return (
    <PageContainer width="narrow" className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <PageHeader
        title="SkillBot"
        subtitle="Ask what you should learn next, or get help writing your profile."
      />
      <SkillBotChat
        firstName={me.displayName.split(" ")[0]}
        hasSkills={me.skillsTeach.length > 0 || me.skillsLearn.length > 0}
        providerCount={providers.length}
      />
    </PageContainer>
  );
}
