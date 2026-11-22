'use client';

import {
  Check,
  Copy,
  KeyRound,
  LogOut,
  Palette,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react';

import { useAuthStore, useUserStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { apiClient, type APIKeyDto, type NewAPIKeyDto } from '@/shared/api';
import { cn } from '@/shared/lib/class-names';
import { useHydratedStore } from '@/shared/lib/store';
import { useAppearance } from '@/shared/theme';
import {
  Badge,
  Button,
  Dialog,
  IconButton,
  IconTile,
  Input,
  SegmentedControl,
  Skeleton,
} from '@/shared/ui';

const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const EXPIRY_OPTIONS = [
  { value: '30', label: '30 j' },
  { value: '90', label: '90 j' },
  { value: '365', label: '1 an' },
] as const;
type ExpiryValue = (typeof EXPIRY_OPTIONS)[number]['value'];

function isExpiry(value: string): value is ExpiryValue {
  return EXPIRY_OPTIONS.some((option) => option.value === value);
}

interface PanelProps {
  readonly title: string;
  readonly description: string;
  readonly icon: ReactNode;
  readonly actions?: ReactNode | undefined;
  readonly children: ReactNode;
}

function Panel({ title, description, icon, actions, children }: PanelProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-[var(--card-hl),var(--surface)] p-5 shadow-card"
    >
      <header className="flex items-start gap-3">
        <IconTile icon={icon} tone="brand" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 id={headingId} className="m-0 text-[14px] font-semibold text-fg">
            {title}
          </h2>
          <p className="m-0 text-[12.5px] text-fg-3">{description}</p>
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

function Row({
  label,
  helper,
  children,
}: {
  readonly label: string;
  readonly helper: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line-2)] pt-3.5">
      <div className="flex flex-col gap-px">
        <span className="text-[12.5px] font-medium text-fg">{label}</span>
        <span className="text-[11.5px] text-fg-3">{helper}</span>
      </div>
      {children}
    </div>
  );
}

function keyState(key: APIKeyDto): {
  readonly label: string;
  readonly tone: 'gain' | 'loss' | 'neutral';
} {
  if (key.revoked_at) return { label: 'Révoquée', tone: 'neutral' };
  if (Date.parse(key.expires_at) < Date.now())
    return { label: 'Expirée', tone: 'loss' };
  return { label: 'Active', tone: 'gain' };
}

/** Réglages: appearance, colour-blind mode, runner API keys and account. */
export function SettingsView() {
  const router = useRouter();
  const showToast = useLabStore((state) => state.showToast);
  const appearance = useAppearance();
  // The store is the live source; the provider value seeds the first render.
  const theme = useHydratedStore(
    useUserStore,
    (state) => state.theme,
    appearance.theme
  );
  const colorblindMode = useHydratedStore(
    useUserStore,
    (state) => state.colorblindMode,
    appearance.colorblindMode
  );
  const setTheme = useUserStore((state) => state.setTheme);
  const setColorblindMode = useUserStore((state) => state.setColorblindMode);
  const user = useAuthStore((state) => state.user);
  const formId = useId();

  const [keys, setKeys] = useState<readonly APIKeyDto[] | null>(null);
  const [keysError, setKeysError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [expiry, setExpiry] = useState<ExpiryValue>('90');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<NewAPIKeyDto | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<APIKeyDto | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      const page = await apiClient.getApiKeys();
      setKeys(page.items ?? []);
      setKeysError(false);
    } catch {
      setKeysError(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiClient
      .getApiKeys()
      .then((page) => {
        if (active) setKeys(page.items ?? []);
      })
      .catch(() => {
        if (active) setKeysError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const createKey = async (event: FormEvent) => {
    event.preventDefault();
    if (newName.trim() === '' || submitting) return;
    setSubmitting(true);
    try {
      const result = await apiClient.createApiKey({
        name: newName.trim(),
        expires_in_days: Number(expiry),
      });
      setCreated(result);
      setCreating(false);
      setNewName('');
      setCopied(false);
      await loadKeys();
    } catch {
      showToast('Impossible de créer la clé.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const revokeKey = async (key: APIKeyDto) => {
    setSubmitting(true);
    try {
      await apiClient.revokeApiKey(key.id);
      showToast(`Clé « ${key.name} » révoquée`, 'success');
      setRevoking(null);
      await loadKeys();
    } catch {
      showToast('Impossible de révoquer la clé.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      showToast('Copie impossible : sélectionne la clé à la main.', 'warning');
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // The local session is cleared even when the gateway is unreachable.
    } finally {
      useAuthStore.getState().clearAuth();
      router.push('/login');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-4 px-[22px] py-5">
      <Panel
        title="Apparence"
        description="Thème et couleurs des gains et des pertes."
        icon={<Palette />}
      >
        <Row label="Thème" helper="Sombre ou clair, appliqué à tout le Lab.">
          <SegmentedControl
            label="Thème"
            options={[
              { value: 'dark', label: 'Sombre' },
              { value: 'light', label: 'Clair' },
            ]}
            value={theme}
            onValueChange={setTheme}
          />
        </Row>
        <Row
          label="Mode daltonien"
          helper="Gains en bleu et pertes en orange au lieu de vert et rouge."
        >
          <SegmentedControl
            label="Couleurs des gains et pertes"
            options={[
              { value: 'none', label: 'Vert / rouge' },
              { value: 'orange-blue', label: 'Bleu / orange' },
            ]}
            value={colorblindMode}
            onValueChange={setColorblindMode}
          />
        </Row>
      </Panel>

      <Panel
        title="Clés API du runner"
        description="Pour lancer des backtests depuis un script ou un runner local. Le secret n'est affiché qu'une fois."
        icon={<KeyRound />}
        actions={
          <Button
            size="sm"
            leadingIcon={<Plus size={14} />}
            onClick={() => setCreating(true)}
          >
            Nouvelle clé
          </Button>
        }
      >
        {keys === null && !keysError ? (
          <Skeleton className="h-16" />
        ) : keysError ? (
          <p role="alert" className="m-0 text-xs text-loss">
            Impossible de charger tes clés.{' '}
            <button
              type="button"
              className="underline"
              onClick={() => void loadKeys()}
            >
              Réessayer
            </button>
          </p>
        ) : keys && keys.length === 0 ? (
          <p className="m-0 text-xs text-fg-3">Aucune clé pour le moment.</p>
        ) : (
          <table className="w-full border-collapse text-[12.5px]">
            <caption className="sr-only">Clés API</caption>
            <thead>
              <tr className="text-left text-[11px] text-fg-3">
                {['Nom', 'Statut', 'Créée le', 'Expire le', ''].map(
                  (header) => (
                    <th
                      key={header || 'actions'}
                      scope="col"
                      className="border-b border-line px-2 py-1.5 font-medium"
                    >
                      {header || <span className="sr-only">Actions</span>}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {keys?.map((key) => {
                const state = keyState(key);
                return (
                  <tr
                    key={key.id}
                    className={cn(
                      'border-b border-[var(--line-2)] last:border-0',
                      key.revoked_at && 'text-fg-3'
                    )}
                  >
                    <td className="px-2 py-2 font-medium">{key.name}</td>
                    <td className="px-2 py-2">
                      <Badge tone={state.tone} dot>
                        {state.label}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 font-mono text-fg-3">
                      {DATE.format(new Date(key.created_at))}
                    </td>
                    <td className="px-2 py-2 font-mono text-fg-3">
                      {DATE.format(new Date(key.expires_at))}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {key.revoked_at ? null : (
                        <IconButton
                          icon={<Trash2 size={14} />}
                          label={`Révoquer ${key.name}`}
                          size="sm"
                          onClick={() => setRevoking(key)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel
        title="Compte"
        description="Ton identité sur QSlate."
        icon={<UserRound />}
      >
        <Row label={user?.username ?? 'Utilisateur'} helper={user?.email ?? ''}>
          <Button
            variant="secondary"
            leadingIcon={<LogOut size={14} />}
            onClick={() => void logout()}
          >
            Se déconnecter
          </Button>
        </Row>
      </Panel>

      {creating ? (
        <Dialog
          title="Nouvelle clé API"
          onClose={() => setCreating(false)}
          footer={
            <>
              <Button variant="quiet" onClick={() => setCreating(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                form={formId}
                disabled={newName.trim() === '' || submitting}
              >
                {submitting ? 'Création…' : 'Créer la clé'}
              </Button>
            </>
          }
        >
          <form
            id={formId}
            onSubmit={(event) => void createKey(event)}
            className="flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-fg">
              Nom
              <Input
                value={newName}
                maxLength={80}
                autoFocus
                onChange={(event) => setNewName(event.target.value)}
              />
            </label>
            <div className="flex items-center justify-between gap-3 text-[12.5px] font-medium text-fg">
              Validité
              <SegmentedControl
                label="Validité de la clé"
                options={EXPIRY_OPTIONS}
                value={expiry}
                onValueChange={(value) => {
                  if (isExpiry(value)) setExpiry(value);
                }}
              />
            </div>
          </form>
        </Dialog>
      ) : null}

      {created ? (
        <Dialog
          title="Copie ta clé maintenant"
          description="Ce secret ne sera plus jamais affiché. Garde-le dans un gestionnaire de mots de passe."
          onClose={() => setCreated(null)}
          footer={
            <Button onClick={() => setCreated(null)}>
              J&apos;ai copié la clé
            </Button>
          }
        >
          <div className="flex items-center gap-2 rounded-lg border border-line bg-sunken p-2">
            <code className="min-w-0 flex-1 break-all font-mono text-xs text-fg">
              {created.secret}
            </code>
            <IconButton
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              label={copied ? 'Clé copiée' : 'Copier la clé'}
              size="sm"
              onClick={() => void copySecret(created.secret)}
            />
          </div>
        </Dialog>
      ) : null}

      {revoking ? (
        <Dialog
          title="Révoquer cette clé ?"
          description={`Les scripts qui utilisent « ${revoking.name} » ne pourront plus lancer de backtests. Cette action est définitive.`}
          onClose={() => setRevoking(null)}
          footer={
            <>
              <Button variant="quiet" onClick={() => setRevoking(null)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                disabled={submitting}
                onClick={() => void revokeKey(revoking)}
              >
                {submitting ? 'Révocation…' : 'Révoquer'}
              </Button>
            </>
          }
        >
          {null}
        </Dialog>
      ) : null}
    </div>
  );
}
