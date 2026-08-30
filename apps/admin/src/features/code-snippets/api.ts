import { apiRequest } from "@/lib/api-client";

export type SnippetLocation = "head" | "body_start" | "body_end";
export type SnippetScope    = "global" | "specific";

export interface CodeSnippet {
  id:        number;
  name:      string;
  code:      string;
  location:  SnippetLocation;
  scope:     SnippetScope;
  pages:     string[];
  isEnabled: boolean;
  order:     number;
  createdAt: string;
  updatedAt: string;
}

export type CreateSnippetInput = {
  name:      string;
  code:      string;
  location:  SnippetLocation;
  scope:     SnippetScope;
  pages:     string[];
  isEnabled: boolean;
  order:     number;
};

export type UpdateSnippetInput = Partial<CreateSnippetInput>;

export const codeSnippetsApi = {
  getAll: () =>
    apiRequest<CodeSnippet[]>("/code-snippets/all"),

  create: (data: CreateSnippetInput) =>
    apiRequest<CodeSnippet>("/code-snippets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateSnippetInput) =>
    apiRequest<CodeSnippet>(`/code-snippets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    apiRequest<{ success: boolean }>(`/code-snippets/${id}`, {
      method: "DELETE",
    }),
};
