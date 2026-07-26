package com.remoteconfig

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.gson.GsonBuilder
import com.remoteconfig.utils.ReactEnvironment
import com.remoteconfig.utils.ReactRemoteConfigEvents
import com.remoteconfig.utils.ReactRemoteConfigListener
import com.remoteconfig.utils.ReactUpdateBehaviour
import ru.rustore.sdk.remoteconfig.AppBuild
import ru.rustore.sdk.remoteconfig.AppId
import ru.rustore.sdk.remoteconfig.AppVersion
import ru.rustore.sdk.remoteconfig.DeviceId
import ru.rustore.sdk.remoteconfig.DeviceModel
import ru.rustore.sdk.remoteconfig.Environment
import ru.rustore.sdk.remoteconfig.OsVersion
import ru.rustore.sdk.remoteconfig.RemoteConfig
import ru.rustore.sdk.remoteconfig.RemoteConfigClient
import ru.rustore.sdk.remoteconfig.RemoteConfigClientBuilder
import ru.rustore.sdk.remoteconfig.RemoteConfigException
import ru.rustore.sdk.remoteconfig.UpdateBehaviour
import kotlin.time.DurationUnit
import kotlin.time.toDuration

class RemoteConfigModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private companion object {
    var remoteConfig: RemoteConfig? = null
  }
  private var isInitialized = false

  override fun getName(): String {
    return "RemoteConfig"
  }

  @ReactMethod
  fun createRemoteConfig(appId:String, interval:Double, updateBehaviour: String, params: ReadableMap) {
    if (isInitialized) return

    createReactRemoteConfigListener()

    val osVersion = params.getString("osVersion")
    val deviceModel = params.getString("deviceModel")
    val deviceId = params.getString("deviceId")
    val appVersion = params.getString("appVersion")
    val appBuild = params.getString("appBuild")


    val behaviour = when (updateBehaviour) {
      ReactUpdateBehaviour.ACTUAL.name   -> UpdateBehaviour.Actual
      ReactUpdateBehaviour.DEFAULT.name  -> UpdateBehaviour.Default(interval.toDuration(DurationUnit.MINUTES))
      ReactUpdateBehaviour.SNAPSHOT.name -> UpdateBehaviour.Snapshot(interval.toDuration(DurationUnit.MINUTES))
      else                               -> UpdateBehaviour.Actual
    }

    val environment = when (params.getString("environment")) {
      ReactEnvironment.ALPHA.name   -> Environment.ALPHA
      ReactEnvironment.BETA.name    -> Environment.BETA
      ReactEnvironment.RELEASE.name -> Environment.RELEASE
      else                          -> null
    }

    RemoteConfigClientBuilder(AppId(appId), reactApplicationContext)
      .setConfigRequestParameterProvider(ConfigRequestParameterProviderImpl())
      .setRemoteConfigClientEventListener(RemoteConfigListenerImpl())
      .setUpdateBehaviour(behaviour)
      .setOsVersion(osVersion?.let { OsVersion(it) })
      .setDevice(deviceModel?.let { DeviceModel(it) })
      .setDeviceId(deviceId?.let { DeviceId(it) })
      .setEnvironment(environment)
      .setAppVersion(appVersion?.let { AppVersion(it) })
      .setAppBuild(appBuild?.let { AppBuild(it) })
      .build()

    isInitialized = true
  }

  @ReactMethod
  fun init(promise: Promise) {
    RemoteConfigClient.instance.init()
      .addOnSuccessListener {
        promise.resolve(true)
      }
      .addOnFailureListener {
        promise.reject(it)
      }
  }

  @ReactMethod
  fun getRemoteConfig(promise: Promise) {
    val gson = GsonBuilder().create()
    RemoteConfigClient.instance.getRemoteConfig()
    .addOnSuccessListener { config ->
      remoteConfig = config
      val data = gson.toJson(config)
      promise.resolve(data)
    }
    .addOnFailureListener { throwable ->
      promise.reject(throwable)
    }
  }

  @ReactMethod
  fun getString(key: String, promise: Promise) {
    promise.resolve(remoteConfig?.getString(key))
  }

  @ReactMethod
  fun getBoolean(key: String, promise: Promise) {
    promise.resolve(remoteConfig?.getBoolean(key))
  }

  @ReactMethod
  fun getNumber(key: String, promise: Promise) {
    promise.resolve(remoteConfig?.getDouble(key))
  }

  @ReactMethod
  fun containsKey(key: String, promise: Promise) {
    promise.resolve(remoteConfig?.containsKey(key))
  }

  @ReactMethod
  fun setAccount(value: String) {
    ConfigRequestParameterProviderImpl.setAccount(value)
  }

  @ReactMethod
  fun setLanguage(value: String) {
    ConfigRequestParameterProviderImpl.setLanguage(value)
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Keep: Required for RN built in Event Emitter Calls.
  }
  @ReactMethod
  fun removeListeners(count: Int) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  private fun createReactRemoteConfigListener()  {
    if (RemoteConfigListenerImpl.listener != null) return

    RemoteConfigListenerImpl.listener = object : ReactRemoteConfigListener {

      override fun backgroundJobErrors(exception: RemoteConfigException.BackgroundConfigUpdateError) {
        val params = WritableNativeMap().apply {
          putString("callback", exception.toString())
        }

        sendEvent(reactApplicationContext, ReactRemoteConfigEvents.BACKGROUND_JOB_ERRORS.name, params)
      }

      override fun firstLoadComplete() {
        val params = WritableNativeMap().apply {
          putString("callback", "firstLoadComplete")
        }

        sendEvent(reactApplicationContext, ReactRemoteConfigEvents.FIRST_LOAD_COMPLETE.name, params)
      }

      override fun initComplete() {
        val params = WritableNativeMap().apply {
          putString("callback", "initComplete")
        }

        sendEvent(reactApplicationContext, ReactRemoteConfigEvents.INIT_COMPLETE.name, params)
      }

      override fun memoryCacheUpdated() {
        val params = WritableNativeMap().apply {
          putString("callback", "memoryCacheUpdated")
        }

        sendEvent(reactApplicationContext, ReactRemoteConfigEvents.MEMORY_CACHE_UPDATED.name, params)
      }

      override fun persistentStorageUpdated() {
        val params = WritableNativeMap().apply {
          putString("callback", "persistentStorageUpdated")
        }

        sendEvent(reactApplicationContext, ReactRemoteConfigEvents.PERSISTENT_STORAGE_UPDATED.name, params)
      }

      override fun remoteConfigNetworkRequestFailure(throwable: Throwable) {
        val params = WritableNativeMap().apply {
          putString("callback", throwable.toString())
        }

        sendEvent(reactApplicationContext, ReactRemoteConfigEvents.REMOTE_CONFIG_NETWORK_REQUEST_FAILURE.name, params)
      }
    }
  }

  private fun sendEvent(reactContext: ReactContext, eventName: String, params: WritableMap?) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
}
