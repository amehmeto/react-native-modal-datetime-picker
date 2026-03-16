import React, { Component } from "react";
import {
  Animated,
  DeviceEventEmitter,
  Dimensions,
  Easing,
  EmitterSubscription,
  Modal as ReactNativeModal,
  StyleSheet,
  TouchableWithoutFeedback,
  ViewStyle,
} from "react-native";

const MODAL_ANIM_DURATION = 300;
const MODAL_BACKDROP_OPACITY = 0.6;

interface ModalProps {
  onBackdropPress?: () => void;
  onHide?: () => void;
  isVisible?: boolean;
  contentStyle?: ViewStyle | (ViewStyle | undefined)[];
  backdropStyle?: ViewStyle;
  backdropOpacity?: number;
  backdropColor?: string;
  animationDuration?: number;
  children?: React.ReactNode;
}

interface ModalState {
  isVisible: boolean;
  deviceWidth: number;
  deviceHeight: number;
}

export class Modal extends Component<ModalProps, ModalState> {
  static defaultProps = {
    onBackdropPress: () => null,
    onHide: () => null,
    isVisible: false,
  };

  state: ModalState = {
    isVisible: this.props.isVisible ?? false,
    deviceWidth: Dimensions.get("window").width,
    deviceHeight: Dimensions.get("window").height,
  };

  animVal = new Animated.Value(0);
  _isMounted = false;
  _deviceEventEmitter: EmitterSubscription | null = null;

  componentDidMount() {
    this._isMounted = true;
    if (this.state.isVisible) {
      this.show();
    }
    this._deviceEventEmitter = DeviceEventEmitter.addListener(
      "didUpdateDimensions",
      this.handleDimensionsUpdate,
    );
  }

  componentWillUnmount() {
    this._deviceEventEmitter?.remove();
    this._isMounted = false;
  }

  componentDidUpdate(prevProps: ModalProps) {
    if (this.props.isVisible && !prevProps.isVisible) {
      this.show();
    } else if (!this.props.isVisible && prevProps.isVisible) {
      this.hide();
    }
  }

  handleDimensionsUpdate = (dimensionsUpdate: {
    window: { width: number; height: number };
  }) => {
    const deviceWidth = dimensionsUpdate.window.width;
    const deviceHeight = dimensionsUpdate.window.height;
    if (
      deviceWidth !== this.state.deviceWidth ||
      deviceHeight !== this.state.deviceHeight
    ) {
      this.setState({ deviceWidth, deviceHeight });
    }
  };

  show = () => {
    this.setState({ isVisible: true });
    Animated.timing(this.animVal, {
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
      duration: this.props.animationDuration ?? MODAL_ANIM_DURATION,
      toValue: 1,
    }).start();
  };

  hide = () => {
    Animated.timing(this.animVal, {
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
      duration: this.props.animationDuration ?? MODAL_ANIM_DURATION,
      toValue: 0,
    }).start(() => {
      if (this._isMounted) {
        this.setState({ isVisible: false }, this.props.onHide);
      }
    });
  };

  render() {
    const {
      children,
      onBackdropPress,
      contentStyle,
      backdropStyle,
      backdropOpacity,
      backdropColor,
      animationDuration: _animationDuration,
      ...otherProps
    } = this.props;
    const { deviceHeight, deviceWidth, isVisible } = this.state;
    const backdropAnimatedStyle = {
      opacity: this.animVal.interpolate({
        inputRange: [0, 1],
        outputRange: [0, backdropOpacity ?? MODAL_BACKDROP_OPACITY],
      }),
    };
    const contentAnimatedStyle = {
      transform: [
        {
          translateY: this.animVal.interpolate({
            inputRange: [0, 1],
            outputRange: [deviceHeight, 0],
            extrapolate: "clamp",
          }),
        },
      ],
    };
    return (
      <ReactNativeModal
        transparent
        animationType="none"
        visible={isVisible}
        {...otherProps}
      >
        <TouchableWithoutFeedback onPress={onBackdropPress}>
          <Animated.View
            style={[
              styles.backdrop,
              backdropAnimatedStyle,
              { width: deviceWidth, height: deviceHeight },
              backdropColor ? { backgroundColor: backdropColor } : undefined,
              backdropStyle,
            ]}
          />
        </TouchableWithoutFeedback>
        {isVisible && (
          <Animated.View
            style={[styles.content, contentAnimatedStyle, contentStyle]}
            pointerEvents="box-none"
          >
            {children}
          </Animated.View>
        )}
      </ReactNativeModal>
    );
  }
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#020617",
    opacity: 0,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
  },
});

export default Modal;
