import { specifyTutorialStepLayout } from "@/redux/reducers/tutorialReducer";
import { useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import type { ViewProps } from "react-native";
import React, { useContext } from "react";
import { TutorialContext } from "./TutorialOverlay";
import { RootState } from "@/redux/store";

interface MeasureProps extends ViewProps {
  children: React.ReactElement;
  name: string | null;
  onPress?: () => void;
}

const Measure = ({ children, name, ...viewProps }: MeasureProps) => {
  const dimensions = Dimensions.get("window");
  const childRef = useRef<View>(null);
  const dispatch = useDispatch();
  const tutorialContext = useContext(TutorialContext);
  const handleNext = tutorialContext?.handleNextTutorialStep;
  const { isTutorialActive, isTutorialStarted } = useSelector(
    (state: RootState) => state.tutorial
  );
  const [layout, setLayout] = useState(null);

  const side = dimensions.width > 600 ? (dimensions.width - 600) / 2 : 0;
  useEffect(() => {
    if (name && isTutorialActive) {
      childRef?.current?.measure((x, y, width, height, pageX, pageY) => {
        console.log("measured", name, x, y, width, height);

        dispatch(
          specifyTutorialStepLayout({
            key: name,
            layout: { x: pageX - side, y: pageY, width, height },
          })
        );
      });
    }
  }, [name, layout, dispatch, dimensions, isTutorialActive]);


  if (name == null || !isTutorialActive) return children;

  const handleOnLayout = (e) => {
    setLayout(e);
    console.log("layout change");

  };
  // Only call handleNextTutorialStep from context if available
  const handlePress = (...args: unknown[]) => {
    console.log("pressed");

    if (handleNext && isTutorialStarted) {
      handleNext();
    }
  };

  return React.cloneElement(children, {
    ref: childRef,
    onLayout: handleOnLayout,
    onPress: handlePress,
    ...viewProps,
  });
};

export default Measure;
