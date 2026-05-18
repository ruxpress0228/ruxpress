package com.ruxpress.android

import android.Manifest
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
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

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val cb = fileUploadCallback ?: return@registerForActivityResult
            fileUploadCallback = null
            if (result.resultCode != Activity.RESULT_OK) {
                cb.onReceiveValue(null)
                return@registerForActivityResult
            }
            val data = result.data
            if (data == null) {
                cb.onReceiveValue(null)
                return@registerForActivityResult
            }
            val clip = data.clipData
            val single = data.data
            when {
                clip != null && clip.itemCount > 0 -> {
                    val uris = Array(clip.itemCount) { clip.getItemAt(it).uri }
                    cb.onReceiveValue(uris)
                }
                single != null -> cb.onReceiveValue(arrayOf(single))
                else -> cb.onReceiveValue(null)
            }
        }

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
        bindWebChromeClient(webView)
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
                    allowFileAccess = true
                    allowContentAccess = true
                }
                webView.addJavascriptInterface(WebAppInterface(this@MainActivity), "Android")
                bindWebChromeClient(webView)
                webView.loadUrl(BuildConfig.WEB_DEV_BASE_URL)
                return true
            }
        }
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
        }
        webView.loadUrl(BuildConfig.WEB_DEV_BASE_URL)
    }

    private fun bindWebChromeClient(target: WebView) {
        target.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                fileChooserParams: WebChromeClient.FileChooserParams,
            ): Boolean = openFileChooser(filePathCallback, fileChooserParams)
        }
    }

    private fun openFileChooser(
        callback: ValueCallback<Array<Uri>>,
        params: WebChromeClient.FileChooserParams,
    ): Boolean {
        fileUploadCallback?.onReceiveValue(null)
        fileUploadCallback = callback
        val intent = params.createIntent()
        return try {
            fileChooserLauncher.launch(Intent.createChooser(intent, null))
            true
        } catch (_: ActivityNotFoundException) {
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = null
            false
        }
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
        fileUploadCallback?.onReceiveValue(null)
        fileUploadCallback = null
        if (instance === this) instance = null
        super.onDestroy()
    }
}
