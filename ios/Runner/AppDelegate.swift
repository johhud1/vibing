import Flutter
import MediaPlayer
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  private let channelName = "com.vibing/system_volume"
  private let volumeController = VolumeController()

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    let controller = window?.rootViewController as? FlutterViewController
    if let controller {
      let channel = FlutterMethodChannel(name: channelName, binaryMessenger: controller.binaryMessenger)
      channel.setMethodCallHandler { [weak self] call, result in
        guard call.method == "setVolume" else {
          result(FlutterMethodNotImplemented)
          return
        }
        let args = call.arguments as? [String: Any]
        let volume = (args?["volume"] as? Double) ?? 0.0
        self?.volumeController.attach(to: controller.view)
        self?.volumeController.setVolume(Float(volume))
        result(nil)
      }
    }
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}

final class VolumeController {
  private let volumeView = MPVolumeView(frame: .zero)
  private var slider: UISlider? = nil

  init() {
    volumeView.isHidden = true
    slider = volumeView.subviews.compactMap { $0 as? UISlider }.first
  }

  func attach(to view: UIView) {
    if volumeView.superview == nil {
      view.addSubview(volumeView)
    }
  }

  func setVolume(_ volume: Float) {
    let clamped = max(0, min(volume, 1))
    DispatchQueue.main.async {
      self.slider?.value = clamped
      self.slider?.sendActions(for: .touchUpInside)
    }
  }
}
