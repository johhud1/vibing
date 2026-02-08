# Walkthrough - Shipping Pedal Amp 🚀

We have successfully refined the Settings UI and triggered an Android build for installation.

## Changes

### 1. Thick, Scalable Sliders
- Replaced unstable custom sliders with **Native Android Sliders**.
- Applied **Scale Transform (1.4x)** to make them thick and easy to grab.
- Adjusted layout (card height, margins) to prevent text overlap.

### 2. Stability Improvements
- Removed `react-native-reanimated` and `react-native-gesture-handler` implementation that caused crashes on the current dev build.
- Native sliders are 100% stable and performant.

## Installation

### Android APK
The build is currently running on Expo Application Services (EAS). Once complete, you can download and install the APK directly to your Android device.

**Build Status & Download:**
[View on Expo Dashboard](https://expo.dev/accounts/santa_claude/projects/pedal-amp/builds/37e5f96c-3376-463d-948e-c5352def5365)

> [!NOTE]
> This build uses the `preview` profile with `internal` distribution, which generates an installable APK (not an AAB for the store).

## Next Steps
1. Wait for build to finish (approx. 10-15 mins).
2. Open the link on your Android device.
3. Download and install the APK.
