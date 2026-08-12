import { PageContainer, PageHeader } from "@/components/shell/page";
import { requireUser } from "@/lib/firebase/admin";
import { getCategories, getSkills } from "@/lib/queries";
import type { Metadata } from "next";
import { ProfileEditForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Edit profile",
  robots: { index: false, follow: false },
};

export default async function ProfileEditPage({ searchParams }: PageProps<"/profile/edit">) {
  const [user, skills, categories, params] = await Promise.all([
    requireUser(),
    getSkills(),
    getCategories(),
    searchParams,
  ]);

  const isWelcome = params.welcome === "1";

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow={isWelcome ? "One last step" : undefined}
        title={isWelcome ? "What can you swap?" : "Edit profile"}
        subtitle={
          isWelcome
            ? "Pick at least one thing you can teach and one you want to learn. You can change these any time."
            : undefined
        }
      />
      <ProfileEditForm user={user} skills={skills} categories={categories} />
    </PageContainer>
  );
}
