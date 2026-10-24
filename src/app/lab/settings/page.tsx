import '../lab.css';

import type { Metadata } from 'next';

import { LabShell } from '@/widgets/lab-shell';
import { SettingsView } from '@/widgets/settings-view';

export const metadata: Metadata = {
  title: 'Engine Settings · QSlate',
  description:
    'Manage sandbox execution limits, slippage parameters, and compliance',
};

export default function SettingsPage() {
  return (
    <LabShell>
      <SettingsView />
    </LabShell>
  );
}
