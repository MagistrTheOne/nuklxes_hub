package com.remoteconfig

import android.os.Handler
import android.os.Looper
import com.remoteconfig.utils.ReactRemoteConfigListener
import ru.rustore.sdk.remoteconfig.RemoteConfigClientEventListener
import ru.rustore.sdk.remoteconfig.RemoteConfigException

class RemoteConfigListenerImpl: RemoteConfigClientEventListener {

  companion object {
    var listener: ReactRemoteConfigListener? = null
  }

  private val uiThreadHandler: Handler = Handler(Looper.getMainLooper())


  override fun backgroundJobErrors(exception: RemoteConfigException.BackgroundConfigUpdateError) {
    uiThreadHandler.post {
      listener?.backgroundJobErrors(exception)
    }
  }

  override fun firstLoadComplete() {
    uiThreadHandler.post {
      listener?.firstLoadComplete()
    }
  }

  override fun initComplete() {
    uiThreadHandler.post {
      listener?.initComplete()
    }
  }

  override fun memoryCacheUpdated() {
    uiThreadHandler.post {
      listener?.memoryCacheUpdated()
    }
  }

  override fun persistentStorageUpdated() {
    uiThreadHandler.post {
      listener?.persistentStorageUpdated()
    }
  }

  override fun remoteConfigNetworkRequestFailure(throwable: Throwable) {
    uiThreadHandler.post {
      listener?.remoteConfigNetworkRequestFailure(throwable)
    }
  }
}
