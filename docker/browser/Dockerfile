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

# Create openbox configuration directory
RUN mkdir -p /root/.config/openbox

# Create openbox configuration to disable window decorations
RUN echo '<?xml version="1.0" encoding="UTF-8"?>' > /root/.config/openbox/rc.xml && \
    echo '<openbox_config xmlns="http://openbox.org/3.4/rc">' >> /root/.config/openbox/rc.xml && \
    echo '  <theme>' >> /root/.config/openbox/rc.xml && \
    echo '    <name>Clearlooks</name>' >> /root/.config/openbox/rc.xml && \
    echo '    <titleLayout></titleLayout>' >> /root/.config/openbox/rc.xml && \
    echo '  </theme>' >> /root/.config/openbox/rc.xml && \
    echo '  <desktops>' >> /root/.config/openbox/rc.xml && \
    echo '    <number>1</number>' >> /root/.config/openbox/rc.xml && \
    echo '  </desktops>' >> /root/.config/openbox/rc.xml && \
    echo '</openbox_config>' >> /root/.config/openbox/rc.xml

# Create startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose VNC and noVNC ports
EXPOSE 5900 6080

# Start the services
CMD ["/start.sh"]