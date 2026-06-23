import { StyleSheet, Text, View } from "react-native";
import FeedList from "@/src/components/feed/FeedList";

export default function HomeScreen() {
  return <FeedList />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
  },
  text: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
});
