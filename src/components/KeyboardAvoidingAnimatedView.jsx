
import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { Platform, Keyboard, KeyboardAvoidingView, Animated } from 'react-native';

const KeyboardAvoidingAnimatedView = forwardRef((props, ref) => {
  const {
    children,
    behavior = Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset = 0,
    style,
    contentContainerStyle,
    enabled = true,
    onLayout,
    ...leftoverProps
  } = props;

  const animatedViewRef = useRef(null);
  const initialHeightRef = useRef(0);
  const initialHeight = useRef(new Animated.Value(1)).current;
  const bottomHeight = useRef(new Animated.Value(0)).current;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const onKeyboardShow = (event) => {
      const { duration, endCoordinates } = event;
      const animatedView = animatedViewRef.current;
      if (!animatedView) return;

      const keyboardY = endCoordinates.screenY - keyboardVerticalOffset;
      const height = Math.max(animatedView.y + animatedView.height - keyboardY, 0);

      Animated.timing(bottomHeight, {
        toValue: height,
        duration: duration > 10 ? duration : 300,
        useNativeDriver: false,
      }).start();
      setIsKeyboardVisible(true);
    };

    const onKeyboardHide = () => {
      Animated.timing(bottomHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setIsKeyboardVisible(false);
    };

    const showSub = Keyboard.addListener('keyboardWillShow', onKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardVerticalOffset, enabled, bottomHeight]);

  const renderContent = () => {
    if (behavior === 'position') {
      return (
        <Animated.View style={[contentContainerStyle, { bottom: bottomHeight }]}>
          {children}
        </Animated.View>
      );
    }
    return children;
  };

  if (Platform.OS === 'web') {
    return (
      <KeyboardAvoidingView
        behavior={behavior}
        style={style}
        contentContainerStyle={contentContainerStyle}
        {...leftoverProps}
      >
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <Animated.View
      ref={ref}
      style={[
        style,
        behavior === 'height' && {
          height: Animated.subtract(initialHeight, bottomHeight),
          flex: isKeyboardVisible ? 0 : null,
        },
        behavior === 'padding' && { paddingBottom: bottomHeight },
      ]}
      onLayout={(e) => {
        const layout = e.nativeEvent.layout;
        animatedViewRef.current = layout;
        if (initialHeightRef.current === 0) {
          initialHeightRef.current = layout.height;
          initialHeight.setValue(layout.height);
        }
        if (onLayout) onLayout(e);
      }}
      {...leftoverProps}
    >
      {renderContent()}
    </Animated.View>
  );
});

KeyboardAvoidingAnimatedView.displayName = 'KeyboardAvoidingAnimatedView';

export default KeyboardAvoidingAnimatedView;
