declare module '@react-native-community/slider' {
    import { Component } from 'react';
    import { ViewProps, StyleProp, ViewStyle } from 'react-native';

    export interface SliderProps extends ViewProps {
        value?: number;
        minimumValue?: number;
        maximumValue?: number;
        step?: number;
        minimumTrackTintColor?: string;
        maximumTrackTintColor?: string;
        thumbTintColor?: string;
        disabled?: boolean;
        onValueChange?: (value: number) => void;
        onSlidingStart?: (value: number) => void;
        onSlidingComplete?: (value: number) => void;
        style?: StyleProp<ViewStyle>;
        inverted?: boolean;
        tapToSeek?: boolean;
        testID?: string;
    }

    export default class Slider extends Component<SliderProps> { }
}
