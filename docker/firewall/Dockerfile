FROM alpine:3.20

RUN apk add --no-cache iptables ip6tables docker-cli bash

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
