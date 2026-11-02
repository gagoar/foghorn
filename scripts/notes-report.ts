// The report of a run: findings per file, counts, the JSON form and the plain-text form.
import { Severity, type Finding } from "./notes-checks.ts";

export interface FileReport {
  readonly file: string;
  readonly findings: readonly Finding[];
}

export interface Report {
  readonly voice: string;
  readonly files: readonly FileReport[];
  readonly hard: number;
  readonly warn: number;
}

const JSON_INDENT = 2;
const count = (files: readonly FileReport[], severity: Severity): number =>
  files.reduce((sum, f) => sum + f.findings.filter((x) => x.severity === severity).length, 0);

export const summarize = (voice: string, files: readonly FileReport[]): Report => ({
  voice,
  files,
  hard: count(files, Severity.Hard),
  warn: count(files, Severity.Warn),
});

export const failed = (report: Report): boolean => report.hard > 0;

export const toJSON = (report: Report): string => JSON.stringify(report, null, JSON_INDENT);

const row = (file: string, f: Finding): string => `${file}:${f.line}  ${f.severity}  ${f.check}  ${f.message}`;

export function toText(report: Report): string {
  const rows = report.files.flatMap((f) => f.findings.map((x) => row(f.file, x)));
  const summary = `foghorn check-notes (voice ${report.voice}): ${report.hard} hard, ${report.warn} warnings`;
  return [...rows, summary].join("\n");
}
