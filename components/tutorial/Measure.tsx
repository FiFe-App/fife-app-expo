import { specifyTutorialStepLayout } from "@/redux/reducers/tutorialReducer";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useDispatch } from "react-redux";
import type { ViewProps } from "react-native";
import React, { useContext } from "react";
import { TutorialContext } from "./TutorialOverlay";

interface MeasureProps extends ViewProps {
  children: React.ReactElement;
  name: string | null;
  onPress?: () => void;
}

const Measure = ({ children, name, ...viewProps }: MeasureProps) => {
  const childRef = useRef<View>(null);
  const dispatch = useDispatch();
  const tutorialContext = useContext(TutorialContext);
  const handleNext = tutorialContext?.handleNextTutorialStep;
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    if (name) {
      childRef?.current?.measure((x, y, width, height, pageX, pageY) => {
        dispatch(
          specifyTutorialStepLayout({
            key: name,
            layout: { x: pageX, y: pageY, width, height },
          })
        );
      });
    }

  }, [name, layout, dispatch]);

  const handleOnLayout = (e) => {
    setLayout(e);
    console.log("layout change");
    
  };

  if (name == null) return children;

  // Only call handleNextTutorialStep from context if available
  const handlePress = (...args: unknown[]) => {
    console.log("pressed");
    
    if (handleNext) {
      handleNext();
    }
    // Call child's onPress if it exists
    if (childRef.current && typeof childRef.current.props?.onPress === "function") {
      childRef.current.props.onPress(...args);
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
