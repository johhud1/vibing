# Pedal Amp: Thick Stable Sliders + System Volume Fix

## Summary

The custom sliders for volume thresholds currently have stability issues (jumping/infinite loops) and the native sliders are too thin. We will use `react-native-awesome-slider` with `react-native-gesture-handler` to create thick, stable, and visually appealing vertical sliders.

## User Review Required

> [!IMPORTANT]
> **New Dependencies Added**: I have installed `react-native-awesome-slider`, `react-native-reanimated`, and `react-native-gesture-handler`. These will provide the smooth, thick sliders you want. 

## Proposed Changes

### [Component] Settings UI Sliders

#### [MODIFY] [App.tsx](file:///Users/paul/Github/just_vibing/vibing/pedal-amp/App.tsx)

1. **Wrap App with `GestureHandlerRootView`**: Required for the new slider library.
2. **Implement `ThickVerticalSlider` component**:
   - Uses `react-native-awesome-slider`.
   - Vertical orientation via `isVertical` prop or rotation.
   - Customized track width (filling the card).
   - Stable gesture handling via Reanimated.
3. **Update Settings Modal**:
   - Replace native `Slider` with `ThickVerticalSlider`.
   - Ensure labels are clearly visible and no text wrapping occurs.

## Verification Plan

### Manual Verification
1. Open settings ⚙️.
2. Slide each volume threshold - confirm it is thick and fills the card width.
3. Confirm no "jumping" or "loop" errors.
4. Verify the volume percentage updates correctly.
5. Tap "Done" and verify the volume control still works with the new settings.
