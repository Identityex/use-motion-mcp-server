// MCP Controller Types
// Common types for MCP tool handlers

/**
 * MCP Tool Response format
 */
export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * MCP Tool Handler function signature
 */
export type MCPToolHandler<TInput, TOutput = MCPToolResponse> = (
  args: TInput
) => Promise<TOutput>;