import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "sowah.refresh_token";

/**
 * refresh_token 是長期憑證，存在加密的 SecureStore（非明文 AsyncStorage）。
 * access_token 生命週期短，只放記憶體（見 http-client）。
 */
export const tokenStorage = {
  getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
