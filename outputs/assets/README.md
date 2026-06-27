# Frontier 2075 Asset Manifest

Drop correctly named files into this folder and reload the page. The app will swap them in automatically and keep procedural geometry as fallback when a file is absent.

Console status is intentionally loud:

- `[assets] OK: <file> → <object> (<scene>)`
- `[assets] MISSING: <file> → procedural fallback (place it at outputs/assets/<file>)`

Use uncompressed `.glb` where possible. Use `+Y` up, object centered on X/Z, with the base or feet near `Y=0` unless noted.

| Filename | Replaces | Scene | Target scale / orientation |
| --- | --- | --- | --- |
| `rocket.glb` | Colossus Heavy launch vehicle | Hub / Starbase | `+Y` up; base at ground; auto-fit to `24.6` scene units tall |
| `droid.glb` | Maintenance/service droids | Orbit Starcloud inspection + Starcloud deck | Orbit: auto-fit to `0.04R-0.052R`; Starcloud: auto-fit to `~2m` |
| `figure.glb` | Human suited scale figures | Orbit Starcloud inspection + Starcloud deck | Orbit: auto-fit to `0.042` scene units; Starcloud: auto-fit to `1.8m` |
| `dragon_capsule.glb` | Dragon-like servicing capsule / lunar shuttle proxy | Orbit Starcloud + Gateway shuttle dock + Starcloud unit dock | Orbit: auto-fit to `0.13R`; Gateway: auto-fit to `2.0` scene units; Starcloud: auto-fit to `12m` |
| `moon_2k_real.jpg` | Real lunar albedo and subtle bump source | Orbit Moon focus + Gateway hologram | 2048x1024 equirectangular texture from Solar System Scope |
| `gateway_chair.glb` | Reception lounge red molded chairs | Gateway interior | Auto-fit to `0.95` scene units tall; centered at chair origin |
| `gateway_desk.glb` | Reception desk | Gateway interior | Auto-fit to `1.15` scene units tall; centered on desk origin |
| `starcloud_habitat_dome.glb` | Geodesic / dome lunar houses | Starcloud first-person scene | Local scale `1 unit = 1m`; auto-fit to `8-10m` depending placement |
| `starcloud_habitat_pod.glb` | Inflatable / cylindrical habitat pods | Starcloud first-person scene | Local scale `1 unit = 1m`; auto-fit to `12m` |
| `starcloud_habitat_villa.glb` | Angular glass villa habitats | Starcloud first-person scene | Local scale `1 unit = 1m`; auto-fit to each procedural villa height |
| `env_space.hdr` | Space reflection / image-based lighting | Orbit, Moon, Starcloud | Equirectangular HDRI; PMREM converted at runtime |
| `env_day.hdr` | Daylight reflection / image-based lighting | Hub / Starbase | Equirectangular HDRI; optional, procedural sky fallback exists |
| `env_interior.hdr` | Bright interior reflection / image-based lighting | Gateway interior | Equirectangular HDRI; optional, procedural interior fallback exists |

Good asset sources: Poly Haven and ambientCG for CC0 HDRIs; Kenney/Quaternius for permissive game assets; or AI/modeling tools exported as `.glb`.

Keep assets same-origin in this folder. Do not add another Three.js CDN or external runtime.
