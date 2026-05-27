export type TestStatus = 'idle' | 'running' | 'pass' | 'fail';

export interface TestResult {
  status: TestStatus;
  durationMs: number;
  error?: string;
  response?: unknown;
}

export type TestResultMap = Record<string, TestResult>;
