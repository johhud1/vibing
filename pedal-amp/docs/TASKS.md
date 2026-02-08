# Pedal Amp: Volume Control + Settings UI Update

## Tasks

- [x] Plan implementation
  - [x] Research system volume options for Expo Go
  - [x] Confirm no existing tests
  - [x] Write implementation plan
  - [x] Get user approval

- [x] Implement sliders
  - [x] Fallback to native `Slider` (due to missing native code in build)
  - [x] Apply scale transform for "thick" look
  - [x] Verify stability

- [x] Ship App (Installable Build)
  - [x] Push to GitHub
  - [x] Trigger EAS Build (Android) -> [**Download APK**](https://expo.dev/artifacts/eas/7UmefXk1FRYAMggXhJM22x.apk)
  - [x] Run Local Android Build (`eas build --local`) (Failed: Environment Issues - Use Remote)
