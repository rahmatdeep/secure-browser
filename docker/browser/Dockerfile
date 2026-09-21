# Use Ubuntu 22.04 LTS base image
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Update package list and install dependencies
RUN apt-get update && apt-get install -y \
    xvfb \
    openbox \
    x11vnc \
    wget \
    curl \
    git \
    python3 \
    python3-pip \
    python3-numpy \
    python3-websockify \
    unclutter \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome for current architecture (supports native arm64 and amd64)
RUN ARCH="$(dpkg --print-architecture)" && \
    if [ "$ARCH" = "amd64" ] || [ "$ARCH" = "arm64" ]; then \
        wget -q "https://dl.google.com/linux/direct/google-chrome-stable_current_${ARCH}.deb" && \
        apt-get update && \
        apt-get install -y "./google-chrome-stable_current_${ARCH}.deb" && \
        rm -f "./google-chrome-stable_current_${ARCH}.deb"; \
    else \
        apt-get update && \
        apt-get install -y chromium-browser && \
        ln -sf "$(which chromium-browser)" /usr/bin/google-chrome; \
    fi && \
    apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install noVNC
RUN git clone https://github.com/novnc/noVNC.git /opt/novnc
RUN git clone https://github.com/novnc/websockify /opt/novnc/utils/websockify
COPY vnc_lite.html /opt/novnc/vnc_lite.html

# Create non-root user for running browser processes
RUN groupadd -r browser && useradd -r -g browser -G audio,video browser \
    && mkdir -p /home/browser/.config/openbox /tmp/chrome-data /tmp/vnc \
    && chown -R browser:browser /home/browser /tmp/chrome-data /tmp/vnc

# Create openbox configuration to disable window decorations
RUN echo '<?xml version="1.0" encoding="UTF-8"?>' > /home/browser/.config/openbox/rc.xml && \
    echo '<openbox_config xmlns="http://openbox.org/3.4/rc">' >> /home/browser/.config/openbox/rc.xml && \
    echo '  <theme>' >> /home/browser/.config/openbox/rc.xml && \
    echo '    <name>Clearlooks</name>' >> /home/browser/.config/openbox/rc.xml && \
    echo '    <titleLayout></titleLayout>' >> /home/browser/.config/openbox/rc.xml && \
    echo '  </theme>' >> /home/browser/.config/openbox/rc.xml && \
    echo '  <desktops>' >> /home/browser/.config/openbox/rc.xml && \
    echo '    <number>1</number>' >> /home/browser/.config/openbox/rc.xml && \
    echo '  </desktops>' >> /home/browser/.config/openbox/rc.xml && \
    echo '</openbox_config>' >> /home/browser/.config/openbox/rc.xml && \
    chown -R browser:browser /home/browser/.config

# Create startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Switch to non-root user
USER browser

# Expose VNC and noVNC ports
EXPOSE 5900 6080

# Start the services
CMD ["/start.sh"]