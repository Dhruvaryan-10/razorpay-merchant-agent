import { redirect } from 'next/navigation';

// The root will become the marketing landing page. Until then it sends people
// into the workspace, which forwards to /connect when no store is connected.
export default function Home() {
  redirect('/app');
}
