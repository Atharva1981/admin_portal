import React, { useState } from 'react';
import { Bell, Play, CheckCircle, AlertCircle } from 'lucide-react';

const QuickNotificationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setTestResults(prev => [`${timestamp}: ${emoji} ${message}`, ...prev.slice(0, 9)]);
  };

  const testBrowserNotifications = async () => {
    setIsRunning(true);
    addResult('Starting browser notification test...');

    try {
      // Test 1: Check if notifications are supported
      if (!('Notification' in window)) {
        addResult('Browser notifications not supported', 'error');
        return;
      }
      addResult('Browser supports notifications', 'success');

      // Test 2: Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        addResult(`Permission ${permission}`, 'error');
        return;
      }
      addResult('Notification permission granted', 'success');

      // Test 3: Show test notification
      const notification = new Notification('🎉 Test Notification', {
        body: 'This is a test notification from your civic portal',
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        tag: 'test-notification'
      });

      notification.onclick = () => {
        addResult('Notification clicked!', 'success');
        notification.close();
      };

      addResult('Test notification sent', 'success');

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
        addResult('Test notification auto-closed');
      }, 5000);

    } catch (error) {
      addResult(`Error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const testServiceWorker = async () => {
    setIsRunning(true);
    addResult('Testing service worker...');

    try {
      if (!('serviceWorker' in navigator)) {
        addResult('Service workers not supported', 'error');
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        addResult('Service worker is registered', 'success');
        addResult(`SW scope: ${registration.scope}`);
      } else {
        addResult('No service worker registered', 'error');
        
        // Try to register our service worker
        try {
          const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          addResult('Service worker registered successfully', 'success');
        } catch (regError) {
          addResult(`SW registration failed: ${regError.message}`, 'error');
        }
      }
    } catch (error) {
      addResult(`SW error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const testFullWorkflow = async () => {
    setIsRunning(true);
    addResult('Testing complete notification workflow...');

    const notifications = [
      {
        title: '✅ Complaint Submitted',
        body: 'Your road maintenance complaint (#TEST-001) has been received',
        delay: 1000
      },
      {
        title: '🔄 Complaint Assigned',
        body: 'Your complaint has been assigned to Public Works department',
        delay: 3000
      },
      {
        title: '✨ Complaint Resolved',
        body: 'Great news! Your complaint has been resolved',
        delay: 5000
      }
    ];

    try {
      for (const notif of notifications) {
        await new Promise(resolve => setTimeout(resolve, notif.delay));
        
        const notification = new Notification(notif.title, {
          body: notif.body,
          icon: '/icons/notification-icon.png',
          tag: `workflow-${Date.now()}`
        });

        addResult(`Sent: ${notif.title}`, 'success');

        // Auto-close after 3 seconds
        setTimeout(() => notification.close(), 3000);
      }

      addResult('Full workflow test completed!', 'success');
    } catch (error) {
      addResult(`Workflow error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Bell className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quick Notification Test</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testBrowserNotifications}
          disabled={isRunning}
          className="flex flex-col items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <Bell className="h-8 w-8 text-blue-500 mb-2" />
          <span className="font-medium">Test Browser</span>
          <span className="text-sm text-gray-600 text-center">Basic notification test</span>
        </button>

        <button
          onClick={testServiceWorker}
          disabled={isRunning}
          className="flex flex-col items-center p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
          <span className="font-medium">Test Service Worker</span>
          <span className="text-sm text-gray-600 text-center">Check SW registration</span>
        </button>

        <button
          onClick={testFullWorkflow}
          disabled={isRunning}
          className="flex flex-col items-center p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
        >
          <Play className="h-8 w-8 text-purple-500 mb-2" />
          <span className="font-medium">Test Workflow</span>
          <span className="text-sm text-gray-600 text-center">Full 3-stage test</span>
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Test Results</h4>
          <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono text-gray-700 mb-1">
                {result}
              </div>
            ))}
          </div>
          <button
            onClick={() => setTestResults([])}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Clear Results
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">Quick Test Instructions</h4>
        <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
          <li>Click "Test Browser" first to check basic functionality</li>
          <li>Click "Test Service Worker" to verify background support</li>
          <li>Click "Test Workflow" to simulate the full complaint process</li>
          <li>Check both browser notifications and console output</li>
        </ol>
      </div>
    </div>
  );
};

export default QuickNotificationTest;
