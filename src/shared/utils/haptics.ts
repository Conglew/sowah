import * as Haptics from "expo-haptics";

/**
 * 觸覺回饋統一入口。日後要做「設定內關閉觸覺」時，只改這裡即可。
 * 皆為 fire-and-forget（不需 await）。
 */
export const haptics = {
  light: () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  selection: () => {
    void Haptics.selectionAsync();
  },
  success: () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};
