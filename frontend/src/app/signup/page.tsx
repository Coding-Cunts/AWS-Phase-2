import type { Metadata } from 'next';
import AuthView from '@/components/AuthView';

export const metadata: Metadata = {
  title: 'Create Account · TERRA Enterprise Material Intelligence',
  description:
    'Provision your facility sorting network on the TERRA waste intelligence layer. Connect optical sorters, bale sentinel cameras, and automated EPA diversion ledgers.',
};

export default function SignupPage() {
  return <AuthView initialMode="signup" />;
}
