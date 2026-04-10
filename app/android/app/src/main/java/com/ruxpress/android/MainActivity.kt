package com.ruxpress.android

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    companion object {
        var instance: MainActivity? = null
    }

    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* 결과 무시 */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        instance = this
        setContentView(R.layout.activity_main)

        requestNotificationPermission()
        setupWebView()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // 알림 클릭으로 진입 시 딥링크 처리
        intent.getStringExtra("url")?.let { webView.loadUrl(it) }
    }

    private fun setupWebView() {
        webView = findViewById(R.id.webView)
        webView.addJavascriptInterface(WebAppInterface(this), "Android")
        webView.webViewClient = object : WebViewClient() {
            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                webView.destroy()
                webView = WebView(this@MainActivity).also { newWebView ->
                    newWebView.webViewClient = this
                    newWebView.settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                    }
                    newWebView.addJavascriptInterface(WebAppInterface(this@MainActivity), "Android")
                    setContentView(newWebView)
                    newWebView.loadUrl("http://10.0.2.2:80")
                }
                return true
            }
        }
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
        }
        webView.loadUrl("http://10.0.2.2:80")
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    fun evaluateJavascript(script: String) {
        webView.evaluateJavascript(script, null)
    }

    override fun onDestroy() {
        if (instance === this) instance = null
        super.onDestroy()
    }
}

class WebAppInterface(private val context: Context) {
    @JavascriptInterface
    fun getFcmToken(): String {
        return context.getSharedPreferences("fcm", Context.MODE_PRIVATE)
            .getString("token", "") ?: ""
    }
}
