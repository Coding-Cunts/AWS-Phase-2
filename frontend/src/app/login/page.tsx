import type { Metadata } from 'next';
import AuthView from '@/components/AuthView';

export const metadata: Metadata = {
  title: 'Sign In · TERRA Enterprise Material Intelligence',
  description:
    'Authenticate into the TERRA waste intelligence terminal to access live sorting telemetry, optical QA, and cryptographic ISO 14001 audits.',
};

export default function LoginPage() {
  return <AuthView initialMode="login" />;
}
