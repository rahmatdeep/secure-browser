// simplePortPool.ts

// Object to keep track of ports
const portPool: Record<
  number,
  { subdomain: string; status: "free" | "occupied" }
> = {
  25100: { subdomain: "vnc1.secure-browser.rahmatdeep.com", status: "free" },
  25101: { subdomain: "vnc2.secure-browser.rahmatdeep.com", status: "free" },
  25102: { subdomain: "vnc3.secure-browser.rahmatdeep.com", status: "free" },
  25103: { subdomain: "vnc4.secure-browser.rahmatdeep.com", status: "free" },
  25104: { subdomain: "vnc5.secure-browser.rahmatdeep.com", status: "free" },
};

// Function to get a free port
function getFreePort() {
  for (const port in portPool) {
    if (portPool[+port].status === "free") {
      portPool[+port].status = "occupied";
      return { port: +port, subdomain: portPool[+port].subdomain };
    }
  }
  return null; // No free ports
}

// Function to release a port back to free
function releasePort(port: number) {
  if (portPool[port]) {
    portPool[port].status = "free";
  }
}

export { portPool, getFreePort, releasePort };
