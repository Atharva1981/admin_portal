const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Cloud Function triggered when a complaint document is created or updated
 * Automatically sends notifications based on status changes
 */
exports.onComplaintStatusChange = functions.firestore
  .document('complaints/{complaintId}')
  .onWrite(async (change, context) => {
    const { complaintId } = context.params;
    
    try {
      // Get the new document data
      const newData = change.after.exists ? change.after.data() : null;
      const oldData = change.before.exists ? change.before.data() : null;
      
      if (!newData) {
        console.log(`Complaint ${complaintId} was deleted`);
        return null;
      }
      
      const newStatus = newData.status;
      const oldStatus = oldData?.status;
      const userId = newData.userId;
      
      if (!userId) {
        console.log(`No userId found for complaint ${complaintId}`);
        return null;
      }
      
      // Determine if we should send a notification
      let notificationType = null;
      
      if (!oldData) {
        // New complaint created
        notificationType = 'confirmation';
      } else if (oldStatus !== newStatus) {
        // Status changed
        switch (newStatus) {
          case 'in-progress':
            notificationType = 'acknowledgment';
            break;
          case 'resolved':
            notificationType = 'resolution';
            break;
        }
      }
      
      if (!notificationType) {
        console.log(`No notification needed for complaint ${complaintId}`);
        return null;
      }
      
      // Get user's FCM token
      const tokenDoc = await db.doc(`fcmTokens/${userId}_web`).get();
      
      if (!tokenDoc.exists) {
        console.log(`No FCM token found for user ${userId}`);
        return null;
      }
      
      const tokenData = tokenDoc.data();
      
      if (!tokenData.isActive) {
        console.log(`FCM token is inactive for user ${userId}`);
        return null;
      }
      
      // Generate notification content
      const notificationContent = generateNotificationContent(notificationType, newData);
      
      // Send the notification
      const message = {
        token: tokenData.token,
        notification: {
          title: notificationContent.title,
          body: notificationContent.body,
          icon: notificationContent.icon
        },
        data: {
          complaintId: complaintId,
          type: notificationType,
          action: notificationContent.data.action,
          clickAction: `${functions.config().app.url}/complaints/${complaintId}`
        },
        webpush: {
          fcmOptions: {
            link: `${functions.config().app.url}/complaints/${complaintId}`
          }
        }
      };
      
      const response = await messaging.send(message);
      console.log(`✅ Notification sent successfully:`, response);
      
      // Log the notification
      await db.collection('notificationLogs').add({
        userId: userId,
        complaintId: complaintId,
        type: notificationType,
        title: notificationContent.title,
        body: notificationContent.body,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'sent',
        fcmToken: tokenData.token,
        messageId: response
      });
      
      return response;
      
    } catch (error) {
      console.error(`❌ Error sending notification for complaint ${complaintId}:`, error);
      
      // Log the failed notification
      if (newData?.userId) {
        await db.collection('notificationLogs').add({
          userId: newData.userId,
          complaintId: complaintId,
          type: 'unknown',
          title: 'Notification Failed',
          body: error.message,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'failed',
          error: error.message
        });
      }
      
      return null;
    }
  });

/**
 * Generate notification content based on type and complaint data
 */
function generateNotificationContent(type, complaintData) {
  const { complaintId, category } = complaintData;
  
  switch (type) {
    case 'confirmation':
      return {
        title: '✅ Complaint Submitted Successfully',
        body: `Your ${category} complaint (#${complaintId}) has been received and is being processed.`,
        icon: '/icons/confirmation.png',
        data: {
          action: 'view_complaint'
        }
      };
      
    case 'acknowledgment':
      return {
        title: '🔄 Complaint Acknowledged',
        body: `Your ${category} complaint (#${complaintId}) has been assigned and is now in progress.`,
        icon: '/icons/in-progress.png',
        data: {
          action: 'view_progress'
        }
      };
      
    case 'resolution':
      return {
        title: '✨ Complaint Resolved',
        body: `Great news! Your ${category} complaint (#${complaintId}) has been resolved.`,
        icon: '/icons/resolved.png',
        data: {
          action: 'view_resolution'
        }
      };
      
    default:
      return {
        title: 'Complaint Update',
        body: `Your complaint (#${complaintId}) has been updated.`,
        icon: '/icons/notification.png',
        data: {
          action: 'view_complaint'
        }
      };
  }
}

/**
 * HTTP Cloud Function to send custom notifications
 * Can be called from your admin panel to send manual notifications
 */
exports.sendCustomNotification = functions.https.onCall(async (data, context) => {
  // Verify the user is authenticated and has admin privileges
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // You can add additional authorization checks here
  // For example, check if user has admin role
  
  const { userId, complaintId, title, body, type } = data;
  
  if (!userId || !complaintId || !title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }
  
  try {
    // Get user's FCM token
    const tokenDoc = await db.doc(`fcmTokens/${userId}_web`).get();
    
    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'FCM token not found for user');
    }
    
    const tokenData = tokenDoc.data();
    
    if (!tokenData.isActive) {
      throw new functions.https.HttpsError('failed-precondition', 'FCM token is inactive');
    }
    
    // Send the notification
    const message = {
      token: tokenData.token,
      notification: {
        title: title,
        body: body,
        icon: '/icons/notification.png'
      },
      data: {
        complaintId: complaintId,
        type: type || 'custom',
        action: 'view_complaint'
      }
    };
    
    const response = await messaging.send(message);
    
    // Log the notification
    await db.collection('notificationLogs').add({
      userId: userId,
      complaintId: complaintId,
      type: type || 'custom',
      title: title,
      body: body,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent',
      fcmToken: tokenData.token,
      messageId: response,
      sentBy: context.auth.uid
    });
    
    return { success: true, messageId: response };
    
  } catch (error) {
    console.error('Error sending custom notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Scheduled function to clean up old notification logs
 * Runs daily at midnight
 */
exports.cleanupNotificationLogs = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep logs for 30 days
    
    try {
      const oldLogsQuery = db.collection('notificationLogs')
        .where('sentAt', '<', cutoffDate);
      
      const snapshot = await oldLogsQuery.get();
      
      if (snapshot.empty) {
        console.log('No old notification logs to clean up');
        return null;
      }
      
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Cleaned up ${snapshot.size} old notification logs`);
      
      return null;
    } catch (error) {
      console.error('❌ Error cleaning up notification logs:', error);
      return null;
    }
  });
