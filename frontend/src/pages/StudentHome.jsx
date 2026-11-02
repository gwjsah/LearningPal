import React from 'react';
import SubjectDashboard from './SubjectDashboard';

/**
 * Backward compatibility export. SubjectDashboard manages specific subject workspaces.
 */
export default function StudentHome(props) {
  return <SubjectDashboard {...props} />;
}
