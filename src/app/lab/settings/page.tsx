import type { Metadata } from 'next';

import { LabHeader } from '@/widgets/lab-frame';
import { SettingsView } from '@/widgets/settings-view';

export const metadata: Metadata = {
  title: 'Réglages · QSlate',
  description: 'Apparence, clés API et compte',
};

export default function SettingsPage() {
  return (
    <>
      <LabHeader title="Réglages" />
      <SettingsView />
    </>
  );
}
