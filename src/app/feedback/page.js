import { getCurrentUser } from '@/lib/supabase/server';
import FeedbackClient from '@/components/FeedbackClient';

export const metadata = {
  title: 'Feedback & Product Roadmap',
  description: 'Share your ideas and help shape the future of Tjesa Suite. Browse, search, upvote requested features, and check the development roadmap.',
};

export default async function FeedbackPage() {
  const user = await getCurrentUser();

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Ancient Egypt hieroglyphic watermark */}
      <div className="hieroglyph-bg" />
      <FeedbackClient user={user} />
    </main>
  );
}
