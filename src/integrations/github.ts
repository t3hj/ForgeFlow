export interface GithubRepository {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  defaultBranch: string;
  htmlUrl: string;
}

export interface GithubPullRequest {
  number: number;
  title: string;
  body: string | null;
  author: string;
  baseBranch: string;
  headBranch: string;
  additions: number;
  deletions: number;
}

export interface GithubChangedFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface GithubPullRequestBundle {
  pullRequest: GithubPullRequest;
  files: GithubChangedFile[];
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class GithubClient {
  private readonly token: string;
  private readonly fetcher: FetchLike;
  private readonly baseUrl: string;

  constructor(
    token: string,
    fetcher: FetchLike = fetch,
    baseUrl = 'https://api.github.com',
  ) {
    this.token = token;
    this.fetcher = fetcher;
    this.baseUrl = baseUrl;
  }

  async getRepository(owner: string, name: string): Promise<GithubRepository> {
    const data = await this.request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
    return {
      id: numberField(data, 'id'),
      fullName: stringField(data, 'full_name'),
      owner: stringField(objectField(data, 'owner'), 'login'),
      name: stringField(data, 'name'),
      defaultBranch: stringField(data, 'default_branch'),
      htmlUrl: stringField(data, 'html_url'),
    };
  }

  async getPullRequest(owner: string, name: string, number: number): Promise<GithubPullRequest> {
    if (!Number.isInteger(number) || number < 1) throw new Error('pull request number must be positive');
    const data = await this.request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls/${number}`);
    return {
      number: numberField(data, 'number'),
      title: stringField(data, 'title'),
      body: nullableStringField(data, 'body'),
      author: stringField(objectField(data, 'user'), 'login'),
      baseBranch: stringField(objectField(data, 'base'), 'ref'),
      headBranch: stringField(objectField(data, 'head'), 'ref'),
      additions: numberField(data, 'additions'),
      deletions: numberField(data, 'deletions'),
    };
  }

  async listChangedFiles(owner: string, name: string, number: number): Promise<GithubChangedFile[]> {
    const data = await this.request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls/${number}/files?per_page=100`);
    if (!Array.isArray(data)) throw new Error('GitHub returned an invalid changed-files response');
    return data.map((file) => {
      const record = objectValue(file);
      return {
        path: stringField(record, 'filename'),
        status: stringField(record, 'status'),
        additions: numberField(record, 'additions'),
        deletions: numberField(record, 'deletions'),
        patch: nullableStringField(record, 'patch') ?? '',
      };
    });
  }

  async getPullRequestBundle(owner: string, name: string, number: number): Promise<GithubPullRequestBundle> {
    const [pullRequest, files] = await Promise.all([
      this.getPullRequest(owner, name, number),
      this.listChangedFiles(owner, name, number),
    ]);
    return { pullRequest, files };
  }

  private async request(path: string): Promise<unknown> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${this.token}`,
        'x-github-api-version': '2022-11-28',
      },
    });
    if (!response.ok) throw new Error(`GitHub API request failed with ${response.status}`);
    return response.json();
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('GitHub returned an invalid object');
  return value as Record<string, unknown>;
}

function objectField(value: unknown, key: string): Record<string, unknown> {
  return objectValue(objectValue(value)[key]);
}

function stringField(value: unknown, key: string): string {
  const result = objectValue(value)[key];
  if (typeof result !== 'string' || !result) throw new Error(`GitHub response field ${key} is invalid`);
  return result;
}

function nullableStringField(value: unknown, key: string): string | null {
  const result = objectValue(value)[key];
  if (result !== null && typeof result !== 'string') throw new Error(`GitHub response field ${key} is invalid`);
  return result;
}

function numberField(value: unknown, key: string): number {
  const result = objectValue(value)[key];
  if (typeof result !== 'number') throw new Error(`GitHub response field ${key} is invalid`);
  return result;
}
