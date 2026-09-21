export interface ContainerInfo {
  container?: any;
  containerIp?: string;
  vncPort: string;
  vncHost?: string;
  guestToken?: string;
  url: string;
  createdAt: Date;
  timeoutId?: ReturnType<typeof setTimeout> | any;
  vncPassword?: string;
  vncTicket?: string;
}

export interface CreateContainerRequest {
  url: string;
  guestToken?: string;
}

export interface CreateContainerResponse {
  containerId: string;
  vncPort: string;
  vncUrl: string;
}

export interface ContainerSummary {
  containerId: string;
  url: string;
  vncPort: string;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ViewportDimensions {
  width: number;
  height: number;
}
