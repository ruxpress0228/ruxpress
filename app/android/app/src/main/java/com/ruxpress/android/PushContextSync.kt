package com.ruxpress.android

import android.content.Context
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

private const val PREFS_AUTH = "ruxpress_auth"
private const val PREFS_FCM = "fcm"

/** WebView와 동일: `local.properties`의 `ruxpress.web.devBaseUrl` → [BuildConfig.WEB_DEV_BASE_URL]. */
private fun apiBaseUrl(): String = BuildConfig.WEB_DEV_BASE_URL.trimEnd('/')

private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

private val pushHttpClient: OkHttpClient by lazy {
    OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
}

/**
 * 로그인 스냅샷 + FCM으로 [POST /api/v1/users/me/push-context] 전송.
 * [WebAppInterface]와 [RuxpressFcmService.onNewToken]에서 공유.
 */
object PushContextSync {

    const val KEY_SNAPSHOT = "snapshot"
    const val KEY_FCM_TOKEN = "token"

    fun prefsAuth(context: Context) =
        context.getSharedPreferences(PREFS_AUTH, Context.MODE_PRIVATE)

    fun prefsFcm(context: Context) =
        context.getSharedPreferences(PREFS_FCM, Context.MODE_PRIVATE)

    fun readFcmFromPrefs(context: Context): String =
        prefsFcm(context).getString(KEY_FCM_TOKEN, "") ?: ""

    fun readJwtFromSnapshot(context: Context): String? {
        val raw = prefsAuth(context).getString(KEY_SNAPSHOT, null) ?: return null
        return try {
            JSONObject(raw).optString("token", "").takeIf { it.isNotEmpty() }
        } catch (_: Exception) {
            null
        }
    }

    fun mergeDeviceInto(root: JSONObject, context: Context) {
        root.put("fcmToken", readFcmFromPrefs(context))
        root.put("manufacturer", Build.MANUFACTURER ?: "")
        root.put("model", Build.MODEL ?: "")
        root.put("brand", Build.BRAND ?: "")
        root.put("device", Build.DEVICE ?: "")
        root.put("versionRelease", Build.VERSION.RELEASE ?: "")
        root.put("sdkInt", Build.VERSION.SDK_INT)
        root.put("notificationsEnabled", notificationsEnabled(context))
    }

    private fun notificationsEnabled(context: Context): Boolean =
        NotificationManagerCompat.from(context).areNotificationsEnabled()

    fun buildPushBody(context: Context, merged: JSONObject): String {
        val o = JSONObject()
        o.put("fcmToken", merged.optString("fcmToken", readFcmFromPrefs(context)))
        o.put("manufacturer", merged.optString("manufacturer", ""))
        o.put("model", merged.optString("model", ""))
        o.put("brand", merged.optString("brand", ""))
        o.put("device", merged.optString("device", ""))
        o.put("versionRelease", merged.optString("versionRelease", ""))
        if (merged.has("sdkInt") && !merged.isNull("sdkInt")) {
            o.put("sdkInt", merged.getInt("sdkInt"))
        }
        o.put("notificationsEnabled", notificationsEnabled(context))
        return o.toString()
    }

    private fun postHttpBlocking(appContext: Context, jwt: String, merged: JSONObject) {
        val body = buildPushBody(appContext, merged).toRequestBody(jsonMediaType)
        val request = Request.Builder()
            .url("${apiBaseUrl()}/api/v1/users/me/push-context")
            .header("Authorization", "Bearer $jwt")
            .post(body)
            .build()
        pushHttpClient.newCall(request).execute().use { }
    }

    /** 스냅샷이 이미 최신(FCM 반영)일 때 */
    suspend fun postPushContext(context: Context) {
        val app = context.applicationContext
        withContext(Dispatchers.IO) {
            try {
                val jwt = readJwtFromSnapshot(app) ?: return@withContext
                val raw = prefsAuth(app).getString(KEY_SNAPSHOT, null) ?: return@withContext
                val merged = try {
                    JSONObject(raw)
                } catch (_: Exception) {
                    return@withContext
                }
                postHttpBlocking(app, jwt, merged)
            } catch (_: Exception) {
                // 무시
            }
        }
    }

    /**
     * FCM 등록 토큰이 바뀐 뒤 호출. JWT(로그인 스냅샷)가 있으면 스냅샷을 갱신하고 서버로 전송.
     */
    fun onFcmTokenRefreshed(context: Context, newToken: String) {
        val app = context.applicationContext
        Thread {
            try {
                val jwt = readJwtFromSnapshot(app) ?: return@Thread
                val raw = prefsAuth(app).getString(KEY_SNAPSHOT, null) ?: return@Thread
                val merged = try {
                    JSONObject(raw)
                } catch (_: Exception) {
                    return@Thread
                }
                merged.put("fcmToken", newToken)
                merged.put("notificationsEnabled", notificationsEnabled(app))
                prefsAuth(app).edit().putString(KEY_SNAPSHOT, merged.toString()).apply()
                postHttpBlocking(app, jwt, merged)
            } catch (_: Exception) {
                // 무시
            }
        }.start()
    }
}
