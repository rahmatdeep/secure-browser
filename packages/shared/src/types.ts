export interface ContainerInfo {
  container?: any;
  containerIp?: string;
  vncPort: string;
  url: string;
  createdAt: Date;
  timeoutId?: ReturnType<typeof setTimeout> | any;
}

export interface CreateContainerRequest {
  url: string;
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
