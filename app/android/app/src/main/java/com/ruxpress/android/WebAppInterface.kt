package com.ruxpress.android

import android.content.Context
import android.webkit.JavascriptInterface
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.lifecycleScope
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import org.json.JSONObject

/**
 * 웹에서 쓰는 브리지: [setAuthToken], [clearAuthToken]만 노출.
 * FCM 확보·push-context 전송은 [PushContextSync]에서 처리.
 */
class WebAppInterface(private val activity: MainActivity) {

    private val context: Context get() = activity

    private suspend fun fetchFcmToken(): String {
        PushContextSync.readFcmFromPrefs(context).takeIf { it.isNotEmpty() }?.let { return it }
        val token = FirebaseMessaging.getInstance().token.await()
        PushContextSync.prefsFcm(context).edit().putString(PushContextSync.KEY_FCM_TOKEN, token).apply()
        return token
    }

    @JavascriptInterface
    fun setAuthToken(json: String) {
        val merged = mergeAuthSnapshot(json)
        PushContextSync.prefsAuth(context).edit()
            .putString(PushContextSync.KEY_SNAPSHOT, merged.toString())
            .apply()

        val jwt = merged.optString("token", "")
        if (jwt.isEmpty()) return

        activity.lifecycleScope.launch {
            try {
                val fcm = withContext(Dispatchers.IO) { fetchFcmToken() }
                val raw = PushContextSync.prefsAuth(context).getString(PushContextSync.KEY_SNAPSHOT, null) ?: return@launch
                val m = try {
                    JSONObject(raw)
                } catch (_: Exception) {
                    return@launch
                }
                m.put("fcmToken", fcm)
                m.put("notificationsEnabled", NotificationManagerCompat.from(context).areNotificationsEnabled())
                PushContextSync.prefsAuth(context).edit().putString(PushContextSync.KEY_SNAPSHOT, m.toString()).apply()
                PushContextSync.postPushContext(context)
            } catch (_: Exception) {
                // FCM 실패 등 무시
            }
        }
    }

    @JavascriptInterface
    fun clearAuthToken() {
        PushContextSync.prefsAuth(context).edit().remove(PushContextSync.KEY_SNAPSHOT).apply()
    }

    private fun mergeAuthSnapshot(webJson: String): JSONObject {
        val root = try {
            JSONObject(webJson)
        } catch (_: Exception) {
            JSONObject()
        }
        PushContextSync.mergeDeviceInto(root, context)
        return root
    }
}
