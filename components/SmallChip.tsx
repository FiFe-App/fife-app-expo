import { Chip, Text } from "react-native-paper";

const SmallChip = ({ children }: { children: any }) => {
  return (
    <>
      <Chip
        style={{ margin: 0, paddingHorizontal: 5 }}
        textStyle={{ margin: 1 }}
      >
        {children}
      </Chip>
      <Text> </Text>
    </>
  );
};

export default SmallChip;
