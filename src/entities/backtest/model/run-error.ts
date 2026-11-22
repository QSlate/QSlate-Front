import { ApiError } from '@/shared/api';

/** What the user can do about a failed run. */
export type BacktestRunErrorAction = 'reconnect' | 'retry' | 'none';

export interface BacktestRunError {
  readonly message: string;
  readonly action: BacktestRunErrorAction;
  /** Backend error code (or a local one) for logs and tests. */
  readonly code: string;
}

/** Thrown when the job ends as failed/cancelled on the server side. */
export class BacktestJobError extends Error {
  constructor(
    public readonly status: 'failed' | 'cancelled' | 'timeout',
    public readonly detail: string | null
  ) {
    super(detail ?? status);
    this.name = 'BacktestJobError';
  }
}

/**
 * Error codes returned by the lab service (services/lab internal/http
 * router): invalid_input 400, unauthorized 401, not_found 404,
 * state_conflict 409, quota_exceeded 429, execution_unavailable 503.
 */
/** Developer hint: the local stack ships without the lab executor. */
const LOCAL_LAB_HINT = ' En local, lance le back avec `make up-lab-local`.';

function describeApiError(error: ApiError): BacktestRunError {
  switch (error.code) {
    case 'unauthorized':
      return {
        code: error.code,
        action: 'reconnect',
        message: 'Ta session a expiré. Reconnecte-toi pour lancer ce backtest.',
      };
    case 'execution_unavailable':
      return {
        code: error.code,
        action: 'retry',
        message:
          "L'exécution des backtests est désactivée ou indisponible sur ce serveur. Réessaie plus tard ou contacte l'administrateur." +
          (process.env.NODE_ENV === 'production' ? '' : LOCAL_LAB_HINT),
      };
    case 'invalid_input':
      return {
        code: error.code,
        action: 'none',
        message:
          'Le serveur a refusé ces réglages. Vérifie le capital, les frais, le glissement, la chauffe et les paramètres de la stratégie.',
      };
    case 'not_found':
      return {
        code: error.code,
        action: 'none',
        message:
          "La stratégie, le jeu de données ou le backtest demandé n'existe plus. Vérifie ta sélection.",
      };
    case 'forbidden':
      return {
        code: error.code,
        action: 'none',
        message: "Tu n'as pas accès à ce backtest.",
      };
    case 'quota_exceeded':
      return {
        code: error.code,
        action: 'retry',
        message:
          'Tu as déjà trop de backtests en attente. Attends la fin de l’un d’eux ou annule-le.',
      };
    case 'state_conflict':
      return {
        code: error.code,
        action: 'retry',
        message:
          'Ce backtest est déjà en cours de traitement. Réessaie dans un instant.',
      };
    default:
      break;
  }
  if (error.statusCode === 403) {
    return {
      code: 'forbidden',
      action: 'none',
      message: "Tu n'as pas accès à ce backtest.",
    };
  }
  if (error.statusCode === 401) {
    return {
      code: 'unauthorized',
      action: 'reconnect',
      message: 'Ta session a expiré. Reconnecte-toi pour lancer ce backtest.',
    };
  }
  return {
    code: error.code,
    action: 'retry',
    message: `Le serveur n'a pas pu lancer le backtest (erreur ${error.statusCode}). Réessaie dans un instant.`,
  };
}

/** Human-readable French description of any error raised by a run. */
export function describeRunError(error: unknown): BacktestRunError {
  if (error instanceof ApiError) return describeApiError(error);
  if (error instanceof BacktestJobError) {
    if (error.status === 'timeout') {
      return {
        code: 'timeout',
        action: 'retry',
        message:
          "Le backtest n'a pas terminé dans le délai prévu. Consulte l'historique pour voir s'il s'est terminé.",
      };
    }
    if (error.status === 'cancelled') {
      return {
        code: 'cancelled',
        action: 'retry',
        message: 'Le backtest a été annulé par le serveur.',
      };
    }
    return {
      code: 'failed',
      action: 'retry',
      message: error.detail
        ? `Le backtest a échoué : ${error.detail}`
        : 'Le backtest a échoué pendant son exécution. Consulte les logs pour le détail.',
    };
  }
  if (error instanceof TypeError) {
    return {
      code: 'network',
      action: 'retry',
      message:
        'Impossible de joindre le serveur. Vérifie ta connexion puis réessaie.',
    };
  }
  return {
    code: 'unknown',
    action: 'retry',
    message: 'Le backtest n’a pas pu être lancé. Réessaie dans un instant.',
  };
}
