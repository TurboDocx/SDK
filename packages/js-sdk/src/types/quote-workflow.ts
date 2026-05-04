/**
 * TypeScript types for TurboQuote — Approval Workflow entity and request/response types
 */

// ============================================
// DOMAIN TYPES
// ============================================

export interface WorkflowNodePosition {
  x: number;
  y: number;
}

export interface WorkflowConditionData {
  field: 'productQuantity' | 'discountAmount' | 'approved' | 'price';
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
  value: number | boolean;
}

export interface WorkflowNode {
  id: string;
  type: 'start' | 'approval' | 'condition';
  data: {
    label: string;
    condition?: WorkflowConditionData;
    approvers?: string[];
    requireAll?: boolean;
    timeoutHours?: number;
  };
  position: WorkflowNodePosition;
  deletable?: boolean;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Workflow {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: WorkflowViewport | null;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: WorkflowViewport;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  viewport?: WorkflowViewport;
}

export interface ApproveQuoteRequest {
  action: 'approved' | 'rejected';
  comments?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export type WorkflowListResponse = Workflow[];

export interface ApprovalAction {
  id: string;
  approvalStateId: string;
  quoteId: string;
  nodeId: string;
  orgId: string;
  action: 'approved' | 'rejected';
  userId: string;
  comments: string | null;
  actionedAt: string;
  createdOn: string;
}

export interface ApprovalState {
  id: string;
  quoteId: string;
  workflowId: string;
  orgId: string;
  currentNodeId: string;
  status: 'pending' | 'approved' | 'rejected';
  startedAt: string;
  completedAt: string | null;
  isActive: boolean;
  createdOn: string;
  updatedOn: string;
}

export type ApprovalResponse = ApprovalAction;

export type ApprovalActivityResponse = ApprovalAction[];

export type ApprovalRequestListResponse = ApprovalState[];
