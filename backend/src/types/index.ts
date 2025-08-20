import { Container } from "dockerode";

export interface ContainerInfo {
  container: Container;
  vncPort: string;
  basePort: string;
  url: string;
  createdAt: Date;
  timeoutId: NodeJS.Timeout;
  subdomain: string;
}

export interface CreateContainerResponse {
  containerId: string;
  vncPort: string;
  vncUrl: string;
  subdomain: string;
}

export interface ContainerSummary {
  containerId: string;
  url: string;
  vncPort: string;
  createdAt: Date;
  subdomain: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateContainerRequest {
  url: string;
}
