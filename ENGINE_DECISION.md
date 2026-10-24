# Engine decision: Babylon.js

Date: 23 October 2026  
Status: Selected for the browser vertical slice  
Version: Babylon.js 9.32.0, bundled locally with esbuild 0.25.11

## Decision

Use Babylon.js as the world and presentation runtime while retaining the existing HTML interface and authoritative Node/SSE room service.

The slice is delivered as a normal browser page. `src/world-engine.js` is bundled into `public/world-engine.js`; clients do not depend on a public CDN. The mission server remains unaware of Babylon-specific objects and continues to decide stages, eligibility, deadlines, scoring, discoveries and endings.

## Why Babylon.js

- It embeds into the existing browser shell instead of requiring a second application/export boundary.
- Its documented feature set includes WebGL/WebGPU rendering, scene graphs, animation, sprites, collision and scene picking.
- Its sprite system is designed for camera-facing animated 2D assets in 2.5D scenes.
- The current service can continue using HTTP and server-sent events without porting mission rules into an engine-specific networking layer.
- The npm package is Apache-2.0 licensed and can be bundled locally for reproducible hosting.

Primary references:

- https://www.babylonjs.com/specifications/
- https://doc.babylonjs.com/features/featuresDeepDive/sprites
- https://doc.babylonjs.com/setup/frameworkPackages/npmSupport/
- https://www.npmjs.com/package/@babylonjs/core

## Rejected for this slice

### Godot 4 web export

Godot remains attractive if native applications or an editor-first workflow become primary. It was not selected for the first browser slice because the official web documentation requires the Compatibility renderer, describes web exports as WebAssembly with additional mobile performance constraints, and notes browser-specific limitations. Adopting it would also create a new export boundary around a working HTML lobby and mission interface.

Reference: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html

### Three.js

Three.js is smaller and flexible, with strong glTF and sprite primitives. It was not selected because this project currently benefits from Babylon's higher-level scene, picking, animation and collision facilities. Three.js would require more project-owned gameplay scaffolding before reaching the same slice.

References:

- https://threejs.org/docs/pages/GLTFLoader.html
- https://threejs.org/docs/pages/Sprite.html

## Current proof

- Fixed elevated camera and low-poly street, lounge, club and gate scene variants.
- Transparent billboard avatars with a foot anchor, shadow, label and distinct cast colors.
- Local ground picking plus keyboard movement.
- Interpolated authoritative player positions.
- Independent cosmetic NPC patrol.
- Server-side bounds, collision zones and discovery interaction range.
- Existing HTML challenge, clue sharing, Mission, Fame, scores and audio retained.

## Constraints and next gate

The current avatars are generated provisional textures, not final sprite atlases. Collision uses authored rectangular zones rather than a navigation mesh. The slice has not yet been measured on the agreed iOS and Android phones, so no mobile performance claim is made. WebGPU is not required; the slice uses Babylon's broadly available browser rendering path.

Do not begin full environment or character-asset production until the built bundle has been tested on the representative phones and the results are recorded.
