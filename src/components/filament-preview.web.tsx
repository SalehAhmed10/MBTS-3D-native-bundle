import { StyleSheet, Text, View } from "react-native";

export function FilamentPreview() {
  return (
    <View style={styles.shell}>
      <Text style={styles.text}>
        Native Filament preview is only available in Android and iOS development builds.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    height: 240,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  text: {
    color: "#6b7280",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
});
