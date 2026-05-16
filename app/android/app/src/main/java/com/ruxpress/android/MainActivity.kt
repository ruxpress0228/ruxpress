package com.ruxpress.android

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.enableEdgeToEdge
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    companion object {
        var instance: MainActivity? = null
    }

    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* 결과 무시 */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        instance = this
        setContentView(R.layout.activity_main)
        applySafeAreaInsets(findViewById(R.id.main))

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
                setContentView(R.layout.activity_main)
                applySafeAreaInsets(findViewById(R.id.main))
                webView = findViewById(R.id.webView)
                webView.webViewClient = this
                webView.settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                }
                webView.addJavascriptInterface(WebAppInterface(this@MainActivity), "Android")
                webView.loadUrl(BuildConfig.WEB_DEV_BASE_URL)
                return true
            }
        }
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
        }
        webView.loadUrl(BuildConfig.WEB_DEV_BASE_URL)
    }

    private fun applySafeAreaInsets(root: android.view.View) {
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
            )
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        ViewCompat.requestApplyInsets(root)
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    fun evaluateJavascript(script: String, nothing: Nothing?) {
        webView.evaluateJavascript(script, null)
    }

    override fun onDestroy() {
        if (instance === this) instance = null
        super.onDestroy()
    }
}
