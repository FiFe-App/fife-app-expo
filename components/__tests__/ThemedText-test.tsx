import { render } from "@testing-library/react-native";

import { ThemedText } from "../ThemedText";

it("renders correctly", async () => {
  const { toJSON } = await render(<ThemedText>Snapshot test!</ThemedText>);

  expect(toJSON()).toMatchSnapshot();
});
