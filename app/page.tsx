"use client";

import { useMemo, useState } from "react";
import { Binary, Braces, Check, Clipboard, Eraser, FileDigit, Radio, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type InputMode = "auto" | "text" | "binary" | "hex" | "decimal";
type OutputMode = "text" | "binary" | "hex" | "decimal";
const DEFAULT_TEXT = "Build bridges, one byte at a time.";

const INPUTS = [
  ["auto", "Auto", Sparkles], ["text", "Text", Type], ["binary", "Binary", Binary],
  ["hex", "Hex", Braces], ["decimal", "Decimal", FileDigit],
] as const;
const OUTPUTS = [
  ["text", "Text", Type], ["binary", "Binary", Binary],
  ["hex", "Hex", Braces], ["decimal", "Decimal", FileDigit],
] as const;

function parseBinary(input: string) {
  const clean = input.replace(/0b/gi, "").replace(/[\s,_-]+/g, "");
  if (!clean) return new Uint8Array();
  if (/[^01]/.test(clean)) throw new Error("Binary can only contain 0 and 1.");
  if (clean.length % 8) {
    const remainder = clean.length % 8;
    throw new Error(`The final byte has ${remainder} bit${remainder === 1 ? "" : "s"}. Each byte needs 8.`);
  }
  return new Uint8Array(clean.match(/.{8}/g)?.map((v) => parseInt(v, 2)) ?? []);
}

function parseHex(input: string) {
  const clean = input.replace(/0x/gi, "").replace(/[\s,_-]+/g, "");
  if (!clean) return new Uint8Array();
  if (/[^0-9a-f]/i.test(clean)) throw new Error("Hex can only contain 0–9 and A–F.");
  if (clean.length % 2) throw new Error("Hex needs two digits per byte. One digit is left over.");
  return new Uint8Array(clean.match(/.{2}/g)?.map((v) => parseInt(v, 16)) ?? []);
}

function parseDecimal(input: string) {
  if (!input.trim()) return new Uint8Array();
  const values = input.trim().split(/[\s,;]+/).map(Number);
  if (values.some((v) => !Number.isInteger(v)))
    throw new Error("Decimal bytes must be whole numbers separated by spaces or commas.");
  if (values.some((v) => v < 0 || v > 255))
    throw new Error("Each decimal byte must be between 0 and 255.");
  return new Uint8Array(values);
}

function detect(input: string): Exclude<InputMode, "auto"> {
  const trimmed = input.trim();
  const clean = trimmed.replace(/[\s,_-]+/g, "");
  const binary = clean.replace(/0b/gi, "");

  if (binary.length >= 8 && binary.length % 8 === 0 && /^[01]+$/.test(binary)) return "binary";

  // A 0x prefix is an unambiguous signal that the user pasted hexadecimal.
  if (/0x/i.test(trimmed)) return "hex";

  // Hex strings containing A–F can be recognized without a prefix. Numeric-only
  // strings stay text in Auto mode because they are ambiguous with decimal bytes.
  if (/^[0-9a-f]+$/i.test(clean) && /[a-f]/i.test(clean) && clean.length % 2 === 0) return "hex";

  return "text";
}

function convert(input: string, requested: InputMode) {
  const mode = requested === "auto" ? detect(input) : requested;
  const bytes = mode === "binary" ? parseBinary(input)
    : mode === "hex" ? parseHex(input)
    : mode === "decimal" ? parseDecimal(input)
    : new TextEncoder().encode(input);
  const text = mode === "text" ? input : new TextDecoder("utf-8").decode(bytes);
  return {
    mode, bytes, text,
    binary: Array.from(bytes, (b) => b.toString(2).padStart(8, "0")).join(" "),
    hex: Array.from(bytes, (b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" "),
    decimal: Array.from(bytes).join(" "),
    hasReplacement: mode !== "text" && text.includes("\uFFFD"),
  };
}

export default function Home() {
  const [input, setInput] = useState(DEFAULT_TEXT);
  const [inputMode, setInputMode] = useState<InputMode>("auto");
  const [outputMode, setOutputMode] = useState<OutputMode>("binary");
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => {
    try { return { data: convert(input, inputMode), error: "" }; }
    catch (e) { return { data: null, error: e instanceof Error ? e.message : "That input could not be translated." }; }
  }, [input, inputMode]);
  const output = result.data?.[outputMode] ?? "";

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function loadExample() {
    setInput("01110100 01101111 01101111 01101100 01110011 00101110 00100000 01101000 01101111 01101111 01101011 01110011 00101110 00100000 01100101 01110110 01100001 01101100 01110011 00101110 00100000 01110011 01110100 01110010 01100101 01100001 01101101 01101001 01101110 01100111 00101110 00100000 01110000 01111001 01110100 01101000 01101111 01101110 00100000 00101011 00100000 01110100 01111001 01110000 01100101 01110011 01100011 01110010 01101001 01110000 01110100 00101110 00100000 01101111 01110011 01110011");
    setInputMode("auto");
    setOutputMode("text");
  }

  function loadHexExample() {
    setInput("0x48 0x65 0x78 0x20 0x42 0x72 0x69 0x64 0x67 0x65");
    setInputMode("auto");
    setOutputMode("text");
  }

  return (
    <main className="signal-grid min-h-screen overflow-hidden px-4 py-5 text-foreground sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="mb-5 flex items-center justify-between gap-4 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="logo-mark" aria-hidden="true"><span>01</span></div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-[-0.04em] sm:text-2xl">Binary Bridge</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">Text and bytes, translated instantly.</p>
            </div>
          </div>
          <div className="privacy-chip"><span className="status-dot" />On-device</div>
        </header>

        <section className="translator-shell" aria-label="Binary translator">
          <div className="pane input-pane">
            <div className="pane-header">
              <div><p className="eyebrow">Input signal</p><h2>Paste or start typing</h2></div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setInput("")}
                disabled={!input} className="muted-action"><Eraser /> Clear</Button>
            </div>
            <RadioGroup value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}
              className="mode-picker" aria-label="Input format">
              {INPUTS.map(([value, label, Icon]) => (
                <label key={value} className="mode-option">
                  <RadioGroupItem value={value} id={`mode-${value}`} className="peer sr-only" />
                  <span className="mode-pill"><Icon /> {label}</span>
                </label>
              ))}
            </RadioGroup>
            <p className="mode-hint">
              {inputMode === "hex"
                ? "Hex accepts 0x48 0x69, 48 69, or 4869."
                : "Auto detects binary, 0x hex, and ordinary text."}
            </p>
            <div className="editor-wrap">
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false}
                aria-label="Content to translate" placeholder="Type text or paste binary here…"
                className="signal-editor" />
              <div className="editor-footer">
                <span>{result.data && inputMode === "auto" ? `Detected: ${result.data.mode}` : `${input.length.toLocaleString()} characters`}</span>
                <span className="footer-actions">
                  <button type="button" onClick={loadExample} className="example-button">Load the AWS example</button>
                  <button type="button" onClick={loadHexExample} className="example-button">Try 0x hex</button>
                </span>
              </div>
            </div>
          </div>

          <div className="bridge-rail" aria-hidden="true">
            <span className="rail-line" /><span className="rail-node"><Radio /></span><span className="rail-line" />
          </div>

          <div className="pane output-pane">
            <div className="pane-header">
              <div><p className="eyebrow">Translated signal</p><h2>Read it your way</h2></div>
              <Button type="button" variant="outline" size="sm" onClick={copyOutput}
                disabled={!output || Boolean(result.error)} className="copy-button">
                {copied ? <Check /> : <Clipboard />}{copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Tabs value={outputMode} onValueChange={(v) => setOutputMode(v as OutputMode)}
              className="output-tabs">
              <TabsList className="format-tabs" aria-label="Output format">
                {OUTPUTS.map(([value, label, Icon]) => (
                  <TabsTrigger key={value} value={value} className="format-tab"><Icon /> {label}</TabsTrigger>
                ))}
              </TabsList>
              {OUTPUTS.map(([value]) => (
                <TabsContent key={value} value={value} className="result-wrap">
                  {result.error ? (
                    <div className="error-state" role="alert"><span>!</span><div>
                      <strong>Incomplete signal</strong><p>{result.error}</p>
                    </div></div>
                  ) : (
                    <output className={`signal-result ${value === "text" ? "text-result" : ""}`}>
                      {result.data?.[value] || <span className="empty-result">Your translation will appear here.</span>}
                    </output>
                  )}
                </TabsContent>
              ))}
            </Tabs>
            <div className="result-meta">
              <span>{result.data?.bytes.length.toLocaleString() ?? 0} bytes</span>
              <span>{((result.data?.bytes.length ?? 0) * 8).toLocaleString()} bits</span>
              <span>UTF-8</span>
              {result.data?.hasReplacement && <span className="warning">Some bytes are not valid UTF-8</span>}
            </div>
          </div>
        </section>
        <footer>Spaces, commas, line breaks, <code>0b</code>, and <code>0x</code> prefixes are welcome. Nothing leaves your device.</footer>
      </div>
    </main>
  );
}
