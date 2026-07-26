package com.remoteconfig

import ru.rustore.sdk.remoteconfig.Account
import ru.rustore.sdk.remoteconfig.ConfigRequestParameter
import ru.rustore.sdk.remoteconfig.ConfigRequestParameterProvider
import ru.rustore.sdk.remoteconfig.Language

class ConfigRequestParameterProviderImpl : ConfigRequestParameterProvider {

  companion object {
    private var account: Account? = null
    private var language: Language? = null

    fun setAccount(value: String ) {
      account = Account(value)
    }

    fun setLanguage(value: String) {
      language = Language(value)
    }
  }

  override fun getConfigRequestParameter(): ConfigRequestParameter {
    return ConfigRequestParameter(
      language = language,
      account = account
    )
  }
}
