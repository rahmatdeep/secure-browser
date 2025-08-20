// simplePortPool.ts

// Object to keep track of ports
const portPool: Record<
  number,
  { subdomain: string; status: "free" | "occupied" }
> = {
  25101: { subdomain: "vnc1.secure-browser.rahmatdeep.com", status: "free" },
  25102: { subdomain: "vnc2.secure-browser.rahmatdeep.com", status: "free" },
  25103: { subdomain: "vnc3.secure-browser.rahmatdeep.com", status: "free" },
  25104: { subdomain: "vnc4.secure-browser.rahmatdeep.com", status: "free" },
  25105: { subdomain: "vnc5.secure-browser.rahmatdeep.com", status: "free" },
  25106: { subdomain: "vnc6.secure-browser.rahmatdeep.com", status: "free" },
  25107: { subdomain: "vnc7.secure-browser.rahmatdeep.com", status: "free" },
  25108: { subdomain: "vnc8.secure-browser.rahmatdeep.com", status: "free" },
  25109: { subdomain: "vnc9.secure-browser.rahmatdeep.com", status: "free" },
  25110: { subdomain: "vnc10.secure-browser.rahmatdeep.com", status: "free" },
  25111: { subdomain: "vnc11.secure-browser.rahmatdeep.com", status: "free" },
  25112: { subdomain: "vnc12.secure-browser.rahmatdeep.com", status: "free" },
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
