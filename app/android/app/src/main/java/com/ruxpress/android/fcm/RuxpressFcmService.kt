package com.ruxpress.android.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.ruxpress.android.MainActivity
import com.ruxpress.android.PushContextSync
import com.ruxpress.android.R

class RuxpressFcmService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        PushContextSync.prefsFcm(this).edit().putString(PushContextSync.KEY_FCM_TOKEN, token).apply()
        PushContextSync.onFcmTokenRefreshed(this, token)
    }

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val title = message.notification?.title ?: message.data["title"] ?: return
        val body = message.notification?.body ?: message.data["body"] ?: ""
        val url = message.data["url"]

        // 포그라운드: WebView JS + 시스템 알림(권한 있을 때)
        MainActivity.instance?.let { activity ->
            val payload = org.json.JSONObject().apply {
                put("title", title)
                put("body", body)
                url?.let { put("url", it) }
            }.toString()
            activity.runOnUiThread {
                activity.evaluateJavascript("window.onPushReceived($payload)", null)
            }
        }

        showNotification(title, body, url)
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun showNotification(title: String, body: String, url: String?) {
        val channelId = "ruxpress_default"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val channel = NotificationChannel(
            channelId, "기본 알림", NotificationManager.IMPORTANCE_HIGH
        )
        manager.createNotificationChannel(channel)

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            url?.let { putExtra("url", it) }
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        manager.notify(System.currentTimeMillis().toInt(), notification)
    }
}
