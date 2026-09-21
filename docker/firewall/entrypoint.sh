#!/usr/bin/env bash
set -euo pipefail

SESSION_NETWORK=${SESSION_NETWORK:-"secure-browser-sessions"}
POLL_INTERVAL=${POLL_INTERVAL:-30}

# Destinations a session container must never reach (first packet of a new connection).
BLOCKED_V4=(
    0.0.0.0/8 10.0.0.0/8 100.64.0.0/10 127.0.0.0/8 169.254.0.0/16 172.16.0.0/12
    192.0.0.0/24 192.0.2.0/24 192.168.0.0/16 198.18.0.0/15 198.51.100.0/24
    203.0.113.0/24 224.0.0.0/4 240.0.0.0/4
)
BLOCKED_V6=(
    ::1/128 ::ffff:0:0/96 64:ff9b::/96 2001:db8::/32 fc00::/7 fe80::/10 ff00::/8
)

echo "[firewall-init] Starting SafeWeb container firewall manager..."
echo "[firewall-init] Monitoring Docker network: ${SESSION_NETWORK}"

# Test if iptables is available and operational in this environment
if ! iptables -w -L -n >/dev/null 2>&1; then
    echo "[firewall-init] WARNING: iptables is not available or NET_ADMIN capability is missing."
    echo "[firewall-init] In non-Linux environments (e.g. macOS Docker Desktop), host iptables cannot be managed from containers."
    echo "[firewall-init] Egress filtering will rely on in-container PAC script."
    # Sleep to avoid restart loops in dev
    exec sleep infinity
fi

# Rebuild a chain atomically (one iptables-restore transaction, so there is no window where it is empty).
#   $1 = iptables | ip6tables   $2 = chain   $3.. = destination CIDRs to drop
#   Replies to connections the host/backend opened (e.g. the noVNC proxy) must pass, so
#   ESTABLISHED,RELATED is accepted first; only new connections started by the session are dropped.
build_chain() {
    local tool="$1" chain="$2"; shift 2
    local restore="${tool}-restore"
    {
        echo "*filter"
        echo ":${chain} - [0:0]"
        echo "-F ${chain}"
        echo "-A ${chain} -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT"
        for cidr in "$@"; do
            echo "-A ${chain} -d ${cidr} -j DROP"
        done
        echo "COMMIT"
    } | "$restore" --noflush -w
}

build_input_chain() {
    local tool="$1" restore="${1}-restore"
    {
        echo "*filter"
        echo ":SB-INPUT - [0:0]"
        echo "-F SB-INPUT"
        echo "-A SB-INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT"
        echo "-A SB-INPUT -j DROP"
        echo "COMMIT"
    } | "$restore" --noflush -w
}

# Idempotently attach `-i <bridge> -j <chain>` to a built-in/user chain.
ensure_jump() {
    local tool="$1" parent="$2" bridge="$3" chain="$4"
    "$tool" -w -N "$parent" 2>/dev/null || true
    if ! "$tool" -w -C "$parent" -i "$bridge" -j "$chain" 2>/dev/null; then
        echo "[firewall-init] Attaching $chain to $parent for $bridge ($tool)"
        "$tool" -w -I "$parent" 1 -i "$bridge" -j "$chain"
    fi
}

apply_rules() {
    local bridge_iface="$1"

    build_chain iptables SB-EGRESS "${BLOCKED_V4[@]}"
    build_input_chain iptables
    ensure_jump iptables DOCKER-USER "$bridge_iface" SB-EGRESS   # traffic forwarded out of the session network
    ensure_jump iptables INPUT "$bridge_iface" SB-INPUT          # traffic addressed to the host itself (incl. :3001)

    if ip6tables -w -L -n >/dev/null 2>&1; then
        build_chain ip6tables SB-EGRESS "${BLOCKED_V6[@]}"
        build_input_chain ip6tables
        ensure_jump ip6tables DOCKER-USER "$bridge_iface" SB-EGRESS
        ensure_jump ip6tables INPUT "$bridge_iface" SB-INPUT
    fi
}

echo "[firewall-init] Entering reconciliation loop..."

while true; do
    if docker info >/dev/null 2>&1; then
        NET_ID=$(docker network inspect "$SESSION_NETWORK" -f '{{.Id}}' 2>/dev/null || echo "")
        if [ -n "$NET_ID" ]; then
            BRIDGE_IFACE="br-$(echo "$NET_ID" | cut -c1-12)"
            if ip link show "$BRIDGE_IFACE" >/dev/null 2>&1; then
                apply_rules "$BRIDGE_IFACE" || echo "[firewall-init] WARNING: failed to apply rules for $BRIDGE_IFACE"
            fi
        fi
    fi
    sleep "$POLL_INTERVAL"
done
