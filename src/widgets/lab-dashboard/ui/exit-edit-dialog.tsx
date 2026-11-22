'use client';

import { type ReactNode, useCallback, useState } from 'react';

import { Button, Dialog } from '@/shared/ui';

import type { DashboardEditor } from '../model/use-dashboard-editor';

export interface ExitEditMode {
  /** Leaves edit mode, asking first when the draft has unsaved changes. */
  readonly request: () => void;
  readonly confirming: boolean;
  readonly dialog: ReactNode;
}

/** Exit of the edit mode, guarded by a confirmation when dirty. */
export function useExitEditMode(editor: DashboardEditor): ExitEditMode {
  const [confirming, setConfirming] = useState(false);
  const { dirty, cancel } = editor;

  const request = useCallback(() => {
    if (dirty) setConfirming(true);
    else cancel();
  }, [cancel, dirty]);

  const dialog = confirming ? (
    <Dialog
      title="Quitter la personnalisation ?"
      description="Tes modifications non enregistrées seront perdues."
      onClose={() => setConfirming(false)}
      footer={
        <>
          <Button variant="quiet" onClick={() => setConfirming(false)}>
            Continuer l&apos;édition
          </Button>
          <Button
            onClick={() => {
              setConfirming(false);
              cancel();
            }}
          >
            Quitter sans enregistrer
          </Button>
        </>
      }
    >
      {null}
    </Dialog>
  ) : null;

  return { request, confirming, dialog };
}
