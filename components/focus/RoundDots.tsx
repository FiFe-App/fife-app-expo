import { View } from "react-native";

/** Done rounds filled, the running one half-filled, the rest outlined. */
export default function RoundDots({ round, rounds, fill, outline }: {
  round: number; rounds: number; fill: string; outline: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${round}. kör a ${rounds}-ből`}
      style={{ flexDirection: "row", gap: 12 }}
    >
      {Array.from({ length: rounds }, (_, i) => {
        const n = i + 1;
        return (
          <View
            key={n}
            style={{
              width: 12, height: 12, borderRadius: 6,
              backgroundColor: n <= round ? fill : "transparent",
              opacity: n === round ? 0.55 : 1,
              borderWidth: n > round ? 1.5 : 0,
              borderColor: outline,
            }}
          />
        );
      })}
    </View>
  );
}
