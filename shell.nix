{ pkgs ? import <nixpkgs> {} }:
  let
  config = {
    allowUnfree = true;
  };
  in
  pkgs.mkShell {
    shellHook = ''
      # # export JAVA_HOME=${pkgs.zulu21}/
      # export ZIG_LIB_PATH="${pkgs.zig}/lib/zig"
      # echo "ZIG_LIB_PATH: $ZIG_LIB_PATH"
    '';
    # Use pkgs directly for runtime dependencies
    nativeBuildInputs = with pkgs; [
      codex
      claude-code
      claude-monitor
      claude-code-router
      gemini-cli-bin
      flutter
    ];
}

