# Binary Bridge

Binary Bridge is a fast, on-device translator for text, binary, hexadecimal, and decimal bytes.

**Live tool:** [binary-bridge.jaronkbragg37.chatgpt.site](https://binary-bridge.jaronkbragg37.chatgpt.site)

## What it does

- Detects ordinary text and pasted binary automatically
- Converts between UTF-8 text, binary, hexadecimal, and decimal byte views
- Accepts spaces, commas, line breaks, `0b`, and `0x` prefixes
- Explains incomplete or malformed input instead of silently failing
- Copies any translated view with one tap
- Processes everything in the browser; input is not uploaded

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Then open the local URL shown by Vinext. Create a production build with `npm run build`.

## License

MIT — see [LICENSE](LICENSE).
