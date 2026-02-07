const path = require('path');
const fs = require('fs');
const {
  AndroidConfig,
  IOSConfig,
  withDangerousMod,
  withMainApplication,
  withXcodeProject,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const MODULE_NAME = 'SystemVolume';

function withSystemVolume(config) {
  config = withAndroidSystemVolume(config);
  config = withIosSystemVolume(config);
  return config;
}

function withAndroidSystemVolume(config) {
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package;
      if (!packageName) {
        throw new Error('android.package must be set in app.json');
      }

      const packagePath = packageName.replace(/\./g, '/');
      const moduleDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java',
        packagePath,
      );

      fs.mkdirSync(moduleDir, { recursive: true });

      const modulePath = path.join(moduleDir, `${MODULE_NAME}Module.kt`);
      const packagePathFile = path.join(moduleDir, `${MODULE_NAME}Package.kt`);

      fs.writeFileSync(
        modulePath,
        `package ${packageName}

import android.media.AudioManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ${MODULE_NAME}Module(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "${MODULE_NAME}"

  @ReactMethod
  fun setVolume(volume: Double) {
    val audioManager = reactApplicationContext.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
    val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    val clamped = volume.coerceIn(0.0, 1.0)
    val target = (max * clamped).toInt().coerceIn(0, max)
    audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, target, 0)
  }
}
`,
      );

      fs.writeFileSync(
        packagePathFile,
        `package ${packageName}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ${MODULE_NAME}Package : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(${MODULE_NAME}Module(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
`,
      );

      return config;
    },
  ]);

  config = withMainApplication(config, (config) => {
    const packageName = config.android?.package;
    if (!packageName) {
      throw new Error('android.package must be set in app.json');
    }

    let contents = config.modResults.contents;

    if (!contents.includes(`${MODULE_NAME}Package`)) {
      contents = mergeContents({
        tag: 'system-volume-import',
        src: contents,
        newSrc: `import ${packageName}.${MODULE_NAME}Package`,
        anchor: /import com\.facebook\.react\.PackageList/, // Kotlin
        offset: 1,
        comment: '//',
      }).contents;

      contents = mergeContents({
        tag: 'system-volume-package',
        src: contents,
        newSrc: `    packages.add(${MODULE_NAME}Package())`,
        anchor: /val packages = PackageList\(this\)\.packages/, // Kotlin
        offset: 1,
        comment: '//',
      }).contents;
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

function withIosSystemVolume(config) {
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosRoot = config.modRequest.platformProjectRoot;
      const filePath = path.join(iosRoot, `${MODULE_NAME}Module.m`);

      const contents = `#import <React/RCTBridgeModule.h>
#import <MediaPlayer/MediaPlayer.h>
#import <UIKit/UIKit.h>

@interface ${MODULE_NAME}Module : NSObject <RCTBridgeModule>
@end

@implementation ${MODULE_NAME}Module {
  MPVolumeView *_volumeView;
  UISlider *_slider;
}

RCT_EXPORT_MODULE(SystemVolume)

- (instancetype)init {
  if ((self = [super init])) {
    _volumeView = [[MPVolumeView alloc] initWithFrame:CGRectZero];
    _volumeView.hidden = YES;
    for (UIView *view in _volumeView.subviews) {
      if ([view isKindOfClass:[UISlider class]]) {
        _slider = (UISlider *)view;
        break;
      }
    }
  }
  return self;
}

RCT_EXPORT_METHOD(setVolume:(nonnull NSNumber *)volume) {
  float clamped = fmaxf(0.0, fminf(1.0, volume.floatValue));
  dispatch_async(dispatch_get_main_queue(), ^{
    UIWindow *keyWindow = UIApplication.sharedApplication.keyWindow;
    if (self->_volumeView.superview == nil && keyWindow != nil) {
      [keyWindow addSubview:self->_volumeView];
    }
    if (self->_slider != nil) {
      self->_slider.value = clamped;
      [self->_slider sendActionsForControlEvents:UIControlEventTouchUpInside];
    }
  });
}

@end
`;

      fs.writeFileSync(filePath, contents);
      return config;
    },
  ]);

  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const groupName = IOSConfig.XcodeUtils.getProjectName(config.modRequest.projectRoot);
    const filePath = `${MODULE_NAME}Module.m`;

    IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
      filepath: filePath,
      groupName,
      project,
    });

    return config;
  });

  return config;
}

module.exports = createRunOncePlugin(withSystemVolume, 'with-system-volume', '1.0.0');
