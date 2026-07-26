package com.remoteconfig.utils

import ru.rustore.sdk.remoteconfig.RemoteConfigException

interface ReactRemoteConfigListener {
  fun backgroundJobErrors(exception: RemoteConfigException.BackgroundConfigUpdateError)
  fun firstLoadComplete()
  fun initComplete()
  fun memoryCacheUpdated()
  fun persistentStorageUpdated()
  fun remoteConfigNetworkRequestFailure(throwable: Throwable)
}
