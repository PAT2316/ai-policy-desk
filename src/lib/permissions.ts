/**
 * Source unique de vérité pour les permissions du système.
 * Toute nouvelle fonctionnalité (M4+) doit ajouter ses permissions ici plutôt que
 * de coder des vérifications de rôle ad hoc dans les routes.
 */

export const PERMISSIONS = {
  ORG_MANAGE: "organization:manage",
  MEMBER_INVITE: "member:invite",
  MEMBER_MANAGE_ROLE: "member:manage_role",
  MEMBER_REMOVE: "member:remove",

  AI_TOOL_CREATE: "ai_tool:create",
  AI_TOOL_EDIT: "ai_tool:edit",
  AI_TOOL_DELETE: "ai_tool:delete",
  AI_TOOL_VIEW: "ai_tool:view",

  USE_CASE_CREATE: "use_case:create",
  USE_CASE_EDIT: "use_case:edit",
  USE_CASE_APPROVE: "use_case:approve",
  USE_CASE_VIEW: "use_case:view",

  RISK_ASSESS: "risk:assess",
  RISK_OVERRIDE: "risk:override",
  RISK_VIEW: "risk:view",

  POLICY_GENERATE: "policy:generate",
  POLICY_APPROVE: "policy:approve",
  POLICY_VIEW: "policy:view",

  DOCUMENT_UPLOAD: "document:upload",
  DOCUMENT_DELETE: "document:delete",
  DOCUMENT_DOWNLOAD: "document:download",
  DOCUMENT_VIEW: "document:view",

  TRAINING_MANAGE: "training:manage",
  TRAINING_TAKE: "training:take",

  INCIDENT_CREATE: "incident:create",
  INCIDENT_MANAGE: "incident:manage",
  INCIDENT_VIEW: "incident:view",

  ACTION_MANAGE: "action:manage",

  REPORT_VIEW: "report:view",
  AUDIT_LOG_VIEW: "audit_log:view",
  BILLING_MANAGE: "billing:manage",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const SYSTEM_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  COMPLIANCE_OFFICER: "compliance_officer",
  IT_MANAGER: "it_manager",
  HR_MANAGER: "hr_manager",
  MANAGER: "manager",
  EMPLOYEE: "employee",
  AUDITOR: "auditor",
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);
const READ_ONLY_PERMISSIONS = ALL_PERMISSIONS.filter((p) => p.endsWith(":view"));

/**
 * Matrice rôle → permissions par défaut, appliquée à la création de l'organisation.
 * Modifiable ensuite via RolePermission sans redéploiement (cf. Phase 2 ADR-003).
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, PermissionCode[]> = {
  [SYSTEM_ROLES.OWNER]: ALL_PERMISSIONS,
  [SYSTEM_ROLES.ADMIN]: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.BILLING_MANAGE),
  [SYSTEM_ROLES.COMPLIANCE_OFFICER]: [
    PERMISSIONS.AI_TOOL_VIEW,
    PERMISSIONS.USE_CASE_VIEW,
    PERMISSIONS.USE_CASE_APPROVE,
    PERMISSIONS.RISK_ASSESS,
    PERMISSIONS.RISK_OVERRIDE,
    PERMISSIONS.RISK_VIEW,
    PERMISSIONS.POLICY_GENERATE,
    PERMISSIONS.POLICY_APPROVE,
    PERMISSIONS.POLICY_VIEW,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.INCIDENT_VIEW,
    PERMISSIONS.INCIDENT_MANAGE,
    PERMISSIONS.ACTION_MANAGE,
    PERMISSIONS.REPORT_VIEW,
  ],
  [SYSTEM_ROLES.IT_MANAGER]: [
    PERMISSIONS.AI_TOOL_CREATE,
    PERMISSIONS.AI_TOOL_EDIT,
    PERMISSIONS.AI_TOOL_DELETE,
    PERMISSIONS.AI_TOOL_VIEW,
    PERMISSIONS.USE_CASE_VIEW,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.INCIDENT_VIEW,
    PERMISSIONS.INCIDENT_MANAGE,
  ],
  [SYSTEM_ROLES.HR_MANAGER]: [
    PERMISSIONS.TRAINING_MANAGE,
    PERMISSIONS.TRAINING_TAKE,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.DOCUMENT_VIEW,
  ],
  [SYSTEM_ROLES.MANAGER]: [
    PERMISSIONS.USE_CASE_CREATE,
    PERMISSIONS.USE_CASE_EDIT,
    PERMISSIONS.USE_CASE_VIEW,
    PERMISSIONS.RISK_VIEW,
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.INCIDENT_VIEW,
    PERMISSIONS.ACTION_MANAGE,
    PERMISSIONS.TRAINING_TAKE,
    PERMISSIONS.DOCUMENT_VIEW,
  ],
  [SYSTEM_ROLES.EMPLOYEE]: [
    PERMISSIONS.INCIDENT_CREATE,
    PERMISSIONS.TRAINING_TAKE,
    PERMISSIONS.DOCUMENT_VIEW,
  ],
  // L'Auditeur ne reçoit STRICTEMENT que des permissions en lecture (":view"),
  // jamais générées dynamiquement à partir d'un rôle plus large : c'est la garantie de non-régression.
  [SYSTEM_ROLES.AUDITOR]: [...READ_ONLY_PERMISSIONS, PERMISSIONS.AUDIT_LOG_VIEW],
};
