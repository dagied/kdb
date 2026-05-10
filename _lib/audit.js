// lib/audit.js

/**
 * Log an activity to the audit_logs table
 */
export async function logActivity({ 
  action, 
  description, 
  userName, 
  userRole, 
  requestType,
  metadata, 
  status,
  userId 
}) {
  try {
    const response = await fetch('/api/audit/recent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        description,
        userName,
        userRole,
        requestType,
        metadata,
        status,
        userId
      })
    });
    
    if (!response.ok) {
      console.error('Failed to log activity');
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
}

// Convenience methods for common actions
export const AuditLogger = {
  logRequest: (action, details) => logActivity({
    action,
    description: details,
    status: 'pending',
    requestType: 'service_request'
  }),
  
  logApproval: (action, details) => logActivity({
    action,
    description: details,
    status: 'approved',
    requestType: 'approval'
  }),
  
  logRejection: (action, details) => logActivity({
    action,
    description: details,
    status: 'rejected',
    requestType: 'rejection'
  }),
  
  logCompletion: (action, details) => logActivity({
    action,
    description: details,
    status: 'completed',
    requestType: 'completion'
  })
};