/**
 * Validates that a containerId is a valid UUID v4 format.
 * Prevents path traversal attacks when interpolating into API URLs.
 */
export function validateContainerId(containerId: string): string {
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
      containerId
    )
  ) {
    throw new Error("Invalid container ID format");
  }
  return containerId;
}
