// The voice of the notes: a preset or a file, checked by a hand-written validator that follows
// schema/foghorn-voice.schema.json. No dependency.
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CHECK_IDS } from "./notes-checks.ts";

export const PERSONS = ["first", "third"] as const;
export const CREDIT_STYLES = ["esbuild", "thanks", "by-line"] as const;
export const PRESETS = ["esbuild", "esbuild-plus", "neutral"] as const;
export const DEFAULT_PRESET = "esbuild-plus";

export const SEVERITIES = ["hard", "warn"] as const;

export interface Voice {
  readonly name: string;
  readonly person: (typeof PERSONS)[number];
  readonly creditStyle: (typeof CREDIT_STYLES)[number];
  readonly prefaceRules: { readonly text: string; readonly pinning: string };
  readonly exampleStyle: { readonly labels: { readonly original: string; readonly oldOutput: string; readonly newOutput: string } };
  readonly affectsLine: boolean;
  readonly maxEntryChars: number;
  readonly openers: readonly string[];
  readonly bannedWords: readonly string[];
  // Credit the owner of the repository too. Off by default: a solo maintainer credits no one but outside contributors.
  readonly creditOwner?: boolean;
  // A check id mapped to the severity this voice gives it. A voice can soften a check that its source breaks itself.
  readonly severity?: Readonly<Record<string, (typeof SEVERITIES)[number]>>;
}

type Json = Record<string, unknown>;

const PRESET_DIR = fileURLToPath(new URL("../skills/voice/presets/", import.meta.url));
const MIN_ENTRY_CHARS = 200;
const MIN_LABEL_CHARS = 3;
const BYTES_PER_KIB = 1024;
const MAX_VOICE_BYTES = 64 * BYTES_PER_KIB;
const PREFACE_KEYS = ["text", "pinning"] as const;
const EXAMPLE_KEYS = ["labels"] as const;
const MAX_CHARS = "maxEntryChars";
const CREDIT_OWNER = "creditOwner";
const LABEL_KEYS = ["original", "oldOutput", "newOutput"] as const;
const TOP_KEYS = ["name", "person", "creditStyle", "prefaceRules", "exampleStyle", "affectsLine", MAX_CHARS, "openers", "bannedWords", CREDIT_OWNER, "severity"] as const;

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";
const isTextList = (value: unknown): value is readonly string[] => Array.isArray(value) && value.every(isText);
const onlyKeys = (value: Json, allowed: readonly string[]): boolean => Object.keys(value).every((key) => allowed.includes(key));
const isLabel = (value: unknown): boolean => isText(value) && value.trim().length >= MIN_LABEL_CHARS;
const oneOf = (value: unknown, options: readonly string[]): boolean => typeof value === "string" && options.includes(value);

// A missing severity is valid. A present one maps known check ids to a known severity.
const validSeverity = (value: unknown): boolean =>
  value === undefined || (isObject(value) && Object.entries(value).every(([id, level]) => CHECK_IDS.includes(id) && oneOf(level, SEVERITIES)));

function child(value: Json, key: string): Json {
  const found = value[key];
  return isObject(found) ? found : {};
}

// Returns the problems of a voice object. An empty list means the object is valid.
export function validateVoice(value: unknown): readonly string[] {
  if (!isObject(value)) return ["the voice must be a JSON object"];
  const rules = child(value, "prefaceRules");
  const example = child(value, "exampleStyle");
  const labels = child(example, "labels");
  const checks: readonly (readonly [boolean, string])[] = [
    [isText(value["name"]), "name must be a non-empty string"],
    [oneOf(value["person"], PERSONS), `person must be one of ${PERSONS.join(", ")}`],
    [oneOf(value["creditStyle"], CREDIT_STYLES), `creditStyle must be one of ${CREDIT_STYLES.join(", ")}`],
    [isText(rules["text"]) && isText(rules["pinning"]), "prefaceRules needs text and pinning, both non-empty strings"],
    [LABEL_KEYS.every((key) => isLabel(labels[key])), `exampleStyle.labels needs ${LABEL_KEYS.join(", ")}, each at least ${MIN_LABEL_CHARS} characters`],
    [onlyKeys(rules, PREFACE_KEYS) && onlyKeys(example, EXAMPLE_KEYS) && onlyKeys(labels, LABEL_KEYS), "prefaceRules, exampleStyle and labels allow only the keys of the schema"],
    [typeof value["affectsLine"] === "boolean", "affectsLine must be true or false"],
    [Number.isInteger(value[MAX_CHARS]) && Number(value[MAX_CHARS]) >= MIN_ENTRY_CHARS, `${MAX_CHARS} must be a whole number of at least ${MIN_ENTRY_CHARS}`],
    [isTextList(value["openers"]), "openers must be a list of non-empty strings"],
    [isTextList(value["bannedWords"]), "bannedWords must be a list of non-empty strings"],
    [value[CREDIT_OWNER] === undefined || typeof value[CREDIT_OWNER] === "boolean", "creditOwner must be true or false"],
    [validSeverity(value["severity"]), `severity must map a check id to one of ${SEVERITIES.join(", ")}`],
    [Object.keys(value).every((key) => (TOP_KEYS as readonly string[]).includes(key)), `only these keys are allowed: ${TOP_KEYS.join(", ")}`],
  ];
  return checks.filter(([ok]) => !ok).map(([, message]) => message);
}

export class VoiceError extends Error {}

// Reads a voice file. A file that is not a regular file, or is over 64 KiB, is refused before it is read.
// A parse error says only that the file is not JSON: it never echoes what the file holds.
function readVoiceFile(path: string): unknown {
  const info = statSync(path);
  if (!info.isFile() || info.size > MAX_VOICE_BYTES) throw new VoiceError(`voice ${path} must be a regular file of at most ${MAX_VOICE_BYTES / BYTES_PER_KIB} KiB`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new VoiceError(`voice ${path} is not valid JSON`);
  }
}

// A preset name loads from skills/voice/presets. Anything else is read as a path to a voice file.
export function loadVoice(spec: string): Voice {
  const path = (PRESETS as readonly string[]).includes(spec) ? `${PRESET_DIR}${spec}.json` : spec;
  const raw = readVoiceFile(path);
  const problems = validateVoice(raw);
  if (problems.length) throw new VoiceError(`voice ${spec} is not valid: ${problems.join("; ")}`);
  return raw as Voice; // validateVoice has checked every field
}
