import { PERMISSIONS, type Permission } from '@wild-hills/contracts';

export type ActorRole =
  | 'owner'
  | 'wh_owner'
  | 'admin'
  | 'wh_admin'
  | 'agent'
  | 'wh_agent'
  | 'editor'
  | 'wh_editor'
  | 'public'
  | 'submitter'
  | 'seller';

export interface PolicyActor {
  userId?: string;
  role: ActorRole;
  countryScopes?: string[]; // e.g. ['ae', 'tr']
  submissionToken?: string;
}

export interface PolicyResource {
  id?: string;
  countryCode?: string;
  assignedAgentId?: string | null;
  authorId?: string | null;
  targetRole?: string | null;
  status?: string | null;
  submissionToken?: string | null;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Normalizes role string to canonical form (e.g. 'wh_owner' -> 'owner').
 */
export function normalizeRole(role: ActorRole): 'owner' | 'admin' | 'agent' | 'editor' | 'public' | 'submitter' {
  if (role === 'wh_owner' || role === 'owner') return 'owner';
  if (role === 'wh_admin' || role === 'admin') return 'admin';
  if (role === 'wh_agent' || role === 'agent') return 'agent';
  if (role === 'wh_editor' || role === 'editor') return 'editor';
  if (role === 'submitter' || role === 'seller') return 'submitter';
  return 'public';
}

/**
 * Checks whether an actor's country scopes permit access to a given country code.
 */
function isCountryAllowed(actor: PolicyActor, countryCode?: string): boolean {
  if (!countryCode) return true;
  if (!actor.countryScopes || actor.countryScopes.length === 0) return true;
  return actor.countryScopes.map((c) => c.toLowerCase()).includes(countryCode.toLowerCase());
}

/**
 * Central authorization policy strictly enforcing Section 10.8 permission matrix.
 */
export function authorize(
  actor: PolicyActor,
  permission: Permission | string,
  resource?: PolicyResource
): AuthorizationResult {
  const role = normalizeRole(actor.role);

  // 1. Platform Owner has full omnipotent authorization
  if (role === 'owner') {
    return { allowed: true };
  }

  // 2. Internal health probes and public read/write permissions
  if (
    permission === 'internal:probe' ||
    permission === 'public:read' ||
    permission === PERMISSIONS.READ_PUBLIC ||
    permission === PERMISSIONS.CREATE_LEAD ||
    permission === PERMISSIONS.CREATE_SUBMISSION ||
    permission === 'public:create_lead' ||
    permission === 'public:create_submission' ||
    permission === 'public:presign_upload' ||
    permission === 'create:upload'
  ) {
    return { allowed: true };
  }

  // If public or submitter, deny all admin permissions
  if (role === 'public') {
    return {
      allowed: false,
      reason: 'Public visitors are not authorized for administrative operations',
    };
  }

  if (role === 'submitter') {
    // Submitter can only access submission resources matching their capability token
    if (
      (permission === PERMISSIONS.CREATE_SUBMISSION ||
        permission === 'read:submission' ||
        permission === 'write:submission') &&
      resource?.submissionToken &&
      actor.submissionToken &&
      resource.submissionToken === actor.submissionToken
    ) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Submitter capability token does not grant administrative privileges',
    };
  }

  // 3. Country-Manager / Admin Role
  if (role === 'admin') {
    // Sensitive owner-only boundaries
    if (permission === PERMISSIONS.ADMIN_MANAGE_SETTINGS) {
      return {
        allowed: false,
        reason: 'Site settings modification requires platform owner privileges',
      };
    }
    if (permission === PERMISSIONS.ADMIN_VIEW_AUDIT) {
      return {
        allowed: false,
        reason: 'Viewing system audit logs requires platform owner privileges',
      };
    }

    // User management: Admins cannot promote or alter owners/admins
    if (permission === PERMISSIONS.ADMIN_WRITE_USERS) {
      if (resource?.targetRole && (resource.targetRole === 'owner' || resource.targetRole === 'admin')) {
        return {
          allowed: false,
          reason: 'Admins cannot create or modify other administrators or owners',
        };
      }
      return { allowed: true };
    }

    if (permission === PERMISSIONS.ADMIN_READ_USERS) {
      return { allowed: true };
    }

    // Country-scoped operations for listings, leads, and locations
    if (
      permission === PERMISSIONS.ADMIN_READ_LISTINGS ||
      permission === PERMISSIONS.ADMIN_WRITE_LISTINGS ||
      permission === PERMISSIONS.ADMIN_READ_LEADS ||
      permission === PERMISSIONS.ADMIN_WRITE_LEADS ||
      permission === PERMISSIONS.ADMIN_MANAGE_LOCATIONS
    ) {
      if (resource?.countryCode && !isCountryAllowed(actor, resource.countryCode)) {
        return {
          allowed: false,
          reason: `Actor country scopes do not permit operations in '${resource.countryCode}'`,
        };
      }
      return { allowed: true };
    }

    return { allowed: true };
  }

  // 4. Agent Role
  if (role === 'agent') {
    // Strictly forbidden for agents
    if (
      permission === PERMISSIONS.ADMIN_MANAGE_SETTINGS ||
      permission === PERMISSIONS.ADMIN_VIEW_AUDIT ||
      permission === PERMISSIONS.ADMIN_READ_USERS ||
      permission === PERMISSIONS.ADMIN_WRITE_USERS ||
      permission === PERMISSIONS.ADMIN_MANAGE_LOCATIONS
    ) {
      return {
        allowed: false,
        reason: `Agents are not permitted to execute '${permission}'`,
      };
    }

    // Listings: Agents can read listings in their country scopes
    if (permission === PERMISSIONS.ADMIN_READ_LISTINGS) {
      if (resource?.countryCode && !isCountryAllowed(actor, resource.countryCode)) {
        return {
          allowed: false,
          reason: `Listing country '${resource.countryCode}' is outside agent country scopes`,
        };
      }
      return { allowed: true };
    }

    // Listings Write: Agents can only write draft listings or listings they author
    if (permission === PERMISSIONS.ADMIN_WRITE_LISTINGS) {
      if (resource?.countryCode && !isCountryAllowed(actor, resource.countryCode)) {
        return {
          allowed: false,
          reason: `Listing country '${resource.countryCode}' is outside agent country scopes`,
        };
      }
      // If resource has author, ensure agent owns it
      if (resource?.authorId && actor.userId && resource.authorId !== actor.userId) {
        return {
          allowed: false,
          reason: 'Agents can only modify listings they created',
        };
      }
      return { allowed: true };
    }

    // Leads Read: Agents can read leads assigned to them or unassigned leads in scope
    if (permission === PERMISSIONS.ADMIN_READ_LEADS) {
      if (resource?.countryCode && !isCountryAllowed(actor, resource.countryCode)) {
        return {
          allowed: false,
          reason: `Lead country '${resource.countryCode}' is outside agent country scopes`,
        };
      }
      if (resource?.assignedAgentId && actor.userId && resource.assignedAgentId !== actor.userId) {
        return {
          allowed: false,
          reason: 'Agents can only access leads assigned to them',
        };
      }
      return { allowed: true };
    }

    // Leads Write: Agents can only update leads assigned to them
    if (permission === PERMISSIONS.ADMIN_WRITE_LEADS) {
      if (resource?.assignedAgentId && actor.userId && resource.assignedAgentId !== actor.userId) {
        return {
          allowed: false,
          reason: 'Agents can only update leads assigned to them',
        };
      }
      return { allowed: true };
    }

    return { allowed: false, reason: `Permission '${permission}' not granted to agent` };
  }

  // 5. Editor Role (content only)
  if (role === 'editor') {
    if (
      permission === PERMISSIONS.ADMIN_READ_LISTINGS ||
      permission === PERMISSIONS.ADMIN_WRITE_LISTINGS
    ) {
      if (resource?.countryCode && !isCountryAllowed(actor, resource.countryCode)) {
        return { allowed: false, reason: 'Country scope mismatch' };
      }
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Editor role is restricted to listing content editing',
    };
  }

  return { allowed: false, reason: 'Unauthorized access' };
}
