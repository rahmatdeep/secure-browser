#!/bin/bash

# Get environment variables
URL=${TARGET_URL:-"https://example.com"}
USER_AGENT=${USER_AGENT:-"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36"}
IS_MOBILE=${IS_MOBILE:-"false"}
VIEWPORT_WIDTH=${VIEWPORT_WIDTH:-"1280"}
VIEWPORT_HEIGHT=${VIEWPORT_HEIGHT:-"720"}

echo "Starting VNC browser with:"
echo "URL: $URL"
echo "User Agent: $USER_AGENT"
echo "Mobile Mode: $IS_MOBILE"
echo "Viewport: ${VIEWPORT_WIDTH}x${VIEWPORT_HEIGHT}"

# Set up display with appropriate resolution
if [ "$IS_MOBILE" = "true" ]; then
    # Mobile resolution
    DISPLAY_RESOLUTION="375x667x24"
    SCALE_RESOLUTION="375x667"
else
    # Desktop resolution
    DISPLAY_RESOLUTION="1280x720x24"
    SCALE_RESOLUTION="1280x720"
fi

# Start virtual display
Xvfb :1 -screen 0 $DISPLAY_RESOLUTION &
export DISPLAY=:1

# Wait for X server to initialize
sleep 3

# Start lightweight window manager
openbox &

# Wait for window manager to start
sleep 2

# Hide mouse cursor when inactive
unclutter -idle 3 -root &

# Generate VNC password for this session (use env var if provided, otherwise random)
if [ -z "$VNC_PASSWORD" ]; then
    VNC_PASSWORD=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 8)
fi
mkdir -p /tmp/vnc
if ! x11vnc -storepasswd "$VNC_PASSWORD" /tmp/vnc/passwd; then
    echo "FATAL: Failed to store VNC password in /tmp/vnc/passwd" >&2
    exit 1
fi
if [ ! -s /tmp/vnc/passwd ]; then
    echo "FATAL: /tmp/vnc/passwd is empty or missing" >&2
    exit 1
fi

# Start VNC server with password authentication and appropriate scaling
x11vnc -display :1 -rfbauth /tmp/vnc/passwd -forever -shared -ncache_cr -scale $SCALE_RESOLUTION &
X11VNC_PID=$!

# Wait for VNC to start and check liveness
sleep 2
if ! kill -0 $X11VNC_PID 2>/dev/null; then
    echo "FATAL: x11vnc failed to start on display :1" >&2
    exit 1
fi

# Start noVNC server on port 6080
websockify --web=/opt/novnc 6080 localhost:5900 &
WEBSOCKIFY_PID=$!

# Wait for noVNC to be ready and check liveness
sleep 3
if ! kill -0 $WEBSOCKIFY_PID 2>/dev/null; then
    echo "FATAL: websockify failed to start on port 6080" >&2
    exit 1
fi

# Generate in-container PAC script for dynamic egress filtering & DNS rebinding protection
PAC_SCRIPT='function FindProxyForURL(url, host) {
  var cleanHost = host.replace(/^\[|\]$/g, "");
  if (cleanHost === "127.0.0.1" && (url.indexOf("6080") !== -1 || url.indexOf("5900") !== -1)) {
    return "DIRECT";
  }
  var resolvedIp = dnsResolve(cleanHost);
  if (!resolvedIp) {
    return "PROXY 127.0.0.1:1";
  }
  if (resolvedIp === "::1" || resolvedIp.indexOf(":") !== -1) {
    return "PROXY 127.0.0.1:1";
  }
  if (isInNet(resolvedIp, "127.0.0.0", "255.0.0.0") ||
      isInNet(resolvedIp, "10.0.0.0", "255.0.0.0") ||
      isInNet(resolvedIp, "172.16.0.0", "255.240.0.0") ||
      isInNet(resolvedIp, "192.168.0.0", "255.255.0.0") ||
      isInNet(resolvedIp, "169.254.0.0", "255.255.0.0") ||
      isInNet(resolvedIp, "100.64.0.0", "255.192.0.0") ||
      isInNet(resolvedIp, "192.0.2.0", "255.255.255.0") ||
      isInNet(resolvedIp, "198.18.0.0", "255.254.0.0") ||
      isInNet(resolvedIp, "198.51.100.0", "255.255.255.0") ||
      isInNet(resolvedIp, "203.0.113.0", "255.255.255.0") ||
      isInNet(resolvedIp, "0.0.0.0", "255.0.0.0")) {
    return "PROXY 127.0.0.1:1";
  }
  return "DIRECT";
}'
PAC_B64=$(printf "%s" "$PAC_SCRIPT" | base64 | tr -d '\n')

# Restart Chrome if it crashes
restart_chrome() {
    while true; do
        # Base Chrome arguments
        chrome_args=(
            --disable-dev-shm-usage
            --disable-gpu
            --disable-software-rasterizer
            --disable-background-timer-throttling
            --disable-backgrounding-occluded-windows
            --disable-renderer-backgrounding
            --no-first-run
            --disable-default-apps
            --disable-extensions
            --disable-plugins
            --disable-translate
            --disable-background-networking
            --disable-sync
            --user-data-dir=/tmp/chrome-data
            --kiosk
            --disable-pinch
            --overscroll-history-navigation=0
            --disable-features=TranslateUI
            --disable-ipc-flooding-protection
            --disable-hang-monitor
            --disable-prompt-on-repost
            --disable-session-crashed-bubble
            --disable-infobars
            --disable-restore-session-state
            --disable-background-mode
            --no-default-browser-check
            --disable-component-update
            --user-agent="$USER_AGENT"
            --window-size=$VIEWPORT_WIDTH,$VIEWPORT_HEIGHT
            "--proxy-pac-url=data:application/x-ns-proxy-autoconfig;base64,${PAC_B64}"
        )

        # Add mobile-specific arguments
        if [ "$IS_MOBILE" = "true" ]; then
            chrome_args+=(
                --device-scale-factor=1
                --force-device-scale-factor=1
                --enable-features=OverlayScrollbar
                --touch-events=enabled
                --enable-pinch
                # --disable-features=VizDisplayCompositor
                # --enable-use-zoom-for-dsf=false
                # --disable-text-selection-on-touch
                # --disable-touch-drag-drop
                # --disable-touch-editing
                # --enable-smooth-scrolling
                # --enable-gesture-navigation
                # --disable-pull-to-refresh-effect
            )
        fi

        # Add the target URL
        chrome_args+=(--app="$URL")

        echo "Starting Chrome with mobile mode: $IS_MOBILE"
        google-chrome "${chrome_args[@]}"
        
        echo "Chrome exited, restarting in 2 seconds..."
        sleep 2
    done
}

# Launch Chrome with auto-restart
restart_chrome &

# Monitor and restart the display if needed
monitor_display() {
    while true; do
        if ! pgrep -f "Xvfb :1" > /dev/null; then
            echo "Xvfb crashed, restarting..."
            Xvfb :1 -screen 0 $DISPLAY_RESOLUTION &
        fi
        sleep 10
    done
}

monitor_display &

# Keep container running
wait