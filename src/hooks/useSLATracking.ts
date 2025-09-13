import { useEffect, useState } from 'react';
import { Issue } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

export const useSLATracking = (issues: Issue[]) => {
  const { addNotification } = useNotifications();
  const [slaBreachedIssues, setSlaBreachedIssues] = useState<string[]>([]);

  useEffect(() => {
    const checkSLA = () => {
      const now = new Date();
      const breachedIssues: string[] = [];

      issues.forEach(issue => {
        const deadline = new Date(issue.slaDeadline);
        const isBreached = now > deadline && issue.status !== 'Resolved';
        
        if (isBreached && !slaBreachedIssues.includes(issue.id)) {
          breachedIssues.push(issue.id);
          
          // Add notification for SLA breach
          addNotification({
            type: 'sla_breach',
            title: 'SLA Deadline Breached',
            message: `Issue ${issue.id} (${issue.category}) has exceeded its SLA deadline`
          });

          // Auto-escalate if not already escalated
          if (issue.status !== 'Escalated') {
            addNotification({
              type: 'escalation',
              title: 'Issue Auto-Escalated',
              message: `Issue ${issue.id} has been automatically escalated due to SLA breach`
            });
          }
        }
      });

      if (breachedIssues.length > 0) {
        setSlaBreachedIssues(prev => [...prev, ...breachedIssues]);
      }
    };

    // Check SLA every minute
    const interval = setInterval(checkSLA, 60000);
    
    // Initial check
    checkSLA();

    return () => clearInterval(interval);
  }, [issues, slaBreachedIssues, addNotification]);

  const getSLAStatus = (issue: Issue) => {
    const now = new Date();
    const deadline = new Date(issue.slaDeadline);
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    const hoursUntilDeadline = Math.ceil(timeUntilDeadline / (1000 * 60 * 60));

    if (now > deadline && issue.status !== 'Resolved') {
      return {
        status: 'breached',
        hoursLeft: 0,
        color: 'red',
        message: 'SLA Breached'
      };
    } else if (hoursUntilDeadline < 24) {
      return {
        status: 'warning',
        hoursLeft: hoursUntilDeadline,
        color: 'yellow',
        message: `${hoursUntilDeadline}h left`
      };
    } else {
      return {
        status: 'good',
        hoursLeft: hoursUntilDeadline,
        color: 'green',
        message: `${hoursUntilDeadline}h left`
      };
    }
  };

  return {
    slaBreachedIssues,
    getSLAStatus
  };
};