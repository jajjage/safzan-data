import { redirect } from "next/navigation";

interface ReferralPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { code } = await params;

  // Backwards-compatible invite shortcut. Keep the redirect same-origin so the
  // tenant host remains the source of truth for backend tenant resolution.
  redirect(`/register?agentCode=${code}`);
}
