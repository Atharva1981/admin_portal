import React, { useState } from 'react';
import { Bell, Send, TestTube, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { useNotifications } from './NotificationProvider';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';

const NotificationTester: React.FC = () => {
  const { user } = useAuth();
  const { isEnabled, enableNotifications, sendTestNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 4)]);
  };

  const handleTestNotification = async (type: 'confirmation' | 'acknowledgment' | 'resolution') => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      await sendTestNotification(type);
      addTestResult(`✅ ${type} notification sent successfully`);
    } catch (error) {
      addTestResult(`❌ Failed to send ${type} notification`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullWorkflowTest = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    addTestResult('🚀 Starting full workflow test...');

    try {
      // Test 1: Confirmation
      await new Promise(resolve => setTimeout(resolve, 1000));
      await sendTestNotification('confirmation');
      addTestResult('✅ Step 1: Confirmation notification sent');

      // Test 2: Acknowledgment
      await new Promise(resolve => setTimeout(resolve, 2000));
      await sendTestNotification('acknowledgment');
      addTestResult('✅ Step 2: Acknowledgment notification sent');

      // Test 3: Resolution
      await new Promise(resolve => setTimeout(resolve, 2000));
      await sendTestNotification('resolution');
      addTestResult('✅ Step 3: Resolution notification sent');

      addTestResult('🎉 Full workflow test completed!');
    } catch (error) {
      addTestResult('❌ Workflow test failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEnabled) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Enable Notifications First</h3>
          <p className="text-gray-600 mb-4">
            You need to enable notifications before you can test them.
          </p>
          <button
            onClick={enableNotifications}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Enable Notifications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <TestTube className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Notification Tester</h3>
      </div>

      {/* Individual Tests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => handleTestNotification('confirmation')}
          disabled={isLoading}
          className="flex flex-col items-center p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
          <span className="font-medium text-gray-900">Confirmation</span>
          <span className="text-sm text-gray-600 text-center">Test submission notification</span>
        </button>

        <button
          onClick={() => handleTestNotification('acknowledgment')}
          disabled={isLoading}
          className="flex flex-col items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <Clock className="h-8 w-8 text-blue-500 mb-2" />
          <span className="font-medium text-gray-900">Acknowledgment</span>
          <span className="text-sm text-gray-600 text-center">Test assignment notification</span>
        </button>

        <button
          onClick={() => handleTestNotification('resolution')}
          disabled={isLoading}
          className="flex flex-col items-center p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
        >
          <Sparkles className="h-8 w-8 text-purple-500 mb-2" />
          <span className="font-medium text-gray-900">Resolution</span>
          <span className="text-sm text-gray-600 text-center">Test resolution notification</span>
        </button>
      </div>

      {/* Full Workflow Test */}
      <div className="mb-6">
        <button
          onClick={handleFullWorkflowTest}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
          <span>{isLoading ? 'Running Tests...' : 'Test Full Workflow'}</span>
        </button>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Sends all three notification types in sequence (5 second intervals)
        </p>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Test Results</h4>
          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono text-gray-700 mb-1">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Testing Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Individual tests send one notification type</li>
          <li>• Full workflow simulates the complete complaint lifecycle</li>
          <li>• Check both in-app notifications and browser notifications</li>
          <li>• Test with browser tab both active and inactive</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTester;
