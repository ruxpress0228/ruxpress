import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.google.services)
}

// 실기기·무선 디버깅: app/android/local.properties 에
//   ruxpress.web.devBaseUrl=http://<PC_LAN_IP>:80
// 예) http://192.168.0.12:80  (Docker Nginx 80 포트). 에뮬은 기본 10.0.2.2.
val localProperties = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) {
        f.inputStream().use { load(it) }
    }
}
val webDevBaseUrl =
    localProperties.getProperty("ruxpress.web.devBaseUrl", "http://10.0.2.2:80").trim()

val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
val releaseKeystoreConfigured =
    keystorePropertiesFile.exists().also { exists ->
        if (exists) {
            keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
        }
    }

android {
    namespace = "com.ruxpress.android"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.ruxpress.android"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField(
            "String",
            "WEB_DEV_BASE_URL",
            "\"" + webDevBaseUrl.replace("\\", "\\\\").replace("\"", "\\\"") + "\"",
        )
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        if (releaseKeystoreConfigured) {
            create("release") {
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
                storePassword = keystoreProperties.getProperty("storePassword")
                storeFile = rootProject.file(requireNotNull(keystoreProperties.getProperty("storeFile")))
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            if (releaseKeystoreConfigured) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.messaging)
    implementation(libs.okhttp)
    implementation(libs.lifecycle.runtime.ktx)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.coroutines.play.services)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}