export type Plan = 'FREE' | 'PREMIUM'

/** What `GET /api/v1/entitlements/me` answers. */
export interface Entitlement {
  /** The caller's own plan, not a partner's. */
  plan: Plan
  /**
   * Whether the AI features are open to the caller: through their own plan or, while the
   * pair is active, the partner's. What the screens read before showing a paid feature.
   */
  aiAccess: boolean
}
