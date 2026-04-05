export interface User {
  name: string;
  email: string;
  role: 'CITIZEN' | 'ADMIN' | 'AUDITOR';
  token: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  submittedByEmail: string;
  submittedByName: string;
  assignedToEmail?: string;
  adminRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  performedByEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

export interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}