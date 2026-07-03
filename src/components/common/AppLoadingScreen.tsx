import { StyleSheet, View } from "react-native";

import SowahLogo from "@/src/assets/images/sowah-cover.svg";

export default function AppLoadingScreen() {
  return (
    <View style={styles.container}>
      <SowahLogo width={250} height={233} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
