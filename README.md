# AI_PRODUCTION

## Installed agent skills (`.claude/skills/`)
- **HyperFrames** (heygen-com/hyperframes) — 21 skills: `hyperframes`, `general-video`, `motion-graphics`, `music-to-video`, `hyperframes-animation`, `hyperframes-core`, ...
- **Remotion** (remotion-dev/remotion `packages/skills`) — 12 skills: `remotion-best-practices`, `remotion-create`, `remotion-render`, `remotion-markup`, ...
- **remotion-motion-graphics** (haidrrrry/claude-remotion-skill)

## Projects
- [`chef-plating/`](chef-plating) — 30s realistic restaurant spot (chef plating, hands only): storyboard, AI-video prompts per shot, mellow jazz, Remotion post-production with logo; animatic until the generated clips are dropped into `public/shots/`.
- [`autumn-nursery/`](autumn-nursery) — «برگ پاییزی»: 45s hand-painted-style motion graphic (Remotion), mother & 2-year-old daughter in an autumn nursery, with a synthesized autumn lullaby. See `STORYBOARD.md`, `storyboard.jpg`, `out/autumn-nursery-web.mp4`.

```bash
cd autumn-nursery && npm install
npm run music                                   # regenerate the music
REMOTION_BROWSER=/path/to/headless_shell npm run render
```
