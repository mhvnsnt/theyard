# GENRE RESEARCH — theyard

**Date:** 2026-10-09 | **Lane:** 1 (theyard) | **Branch:** `research/genre-study-theyard`
**Purpose:** Ground theyard's design — a racing / demolition-derby game with robots and
biomechs and a Gunpla/Bionicle-style modular mecha customizer — in what real games have
already proven. Owner-confirmed core mechanic: **mechs TRANSFORM mid-competition** (vehicle/
racer mode ↔ combat/derby mode, switchable mid-race, mid-battle, mid-derby). Confirmed
inspirations: Evangelion, Gundam, Transformers, Bionicle, Gunpla, Kamen Rider (form changes),
Power Rangers (Zord-style).

**How to read this doc:** Sections 1–5 report *researched fact* (summarized from the sources
listed at the end). Section 6–8 mix fact and analysis. Section 9 (SYNTHESIS) is
*recommendation* — my proposals, clearly separated from the facts. IP rule applies
throughout: designs must be ORIGINAL — inspired by these references, never copies (no
likenesses, names, or faction symbols).

---

## 1. Demolition-derby / combat-racing games

### 1a. FlatOut series — the deep dive

The series (Bugbear Entertainment; FlatOut 2004, FlatOut 2 2006, FlatOut: Ultimate Carnage
2007, FlatOut: Head On PSP 2008) is the owner's named reference and the closest genre
ancestor to theyard's racing/derby half.

**Damage modeling (researched fact):**
- Ultimate Carnage builds each car from **up to ~40 separate destructible/deformable parts**
  (doors, bonnet, boot, bumpers, etc.). Each has a modeled damage-mesh with degrees of
  deformation from scratched to fully mangled; parts can be ripped off entirely under
  enough force. (Gamespot Q&A with Bugbear; Wikipedia.)
- Damage is not purely cosmetic — sustained damage degrades performance and a car can be
  destroyed outright (wrecked out of the event). (gamingpastime review.)
- FlatOut 2 grades hits on opponents in escalating tiers: light Slam → Power Hit → Super
  Flip → Crash Out (driver ejected) → Wrecked (opponent eliminated). The driver is a
  ragdoll that gets flung from the car on big crashes — this also feeds the stunt
  minigames. (slayerpit review.)

**Physics and reward loop (researched fact):**
- Nitrous/boost is **earned by causing carnage**: hitting opponents, long airtime, and
  destroying trackside objects all fill the nitro meter. This is the signature risk/reward
  loop — aggression is the fuel. (Eurogamer, slayerpit review.)
- Trackside objects aren't just decoration; heavy ones can affect car handling when hit.
  (Eurogamer.)
- Career mode: race through events, earn money, buy cars and upgrade parts. (multiple
  reviews.)

**Modes and structure (researched fact):**
- Standard circuit races, demolition-derby arena deathmatches, figure-8 races, and a
  ragdoll-driver stunt mode (fling the driver at targets: high jump, long jump, etc.).
- Ultimate Carnage added a **Carnage mode**: 36 challenges mixing stunts, derby
  deathmatches, carnage races, and time-attack ("beat the bomb") events. (Wikipedia.)
- Races run up to 12 cars (player + 11 AI). AI drivers have named personalities and
  aggressive behavior (deliberate shunts, forcing you into walls). (slayerpit review,
  Eurogamer.)

**What happened after Bugbear left (cautionary tale, researched fact):**
- Bugbear left the series after Ultimate Carnage. FlatOut 3 (Team6, 2011) is widely
  regarded as one of the worst games ever made. FlatOut 4 (Kylotonn, 2017) partially
  recovered the feel — aggressive AI, nitro-from-contact, ~27 unlockable cars, engine/
  gearbox/chassis upgrades, three car classes across 24 cups — but was criticized for
  ~10 tracks, dated damage physics vs. Wreckfest's soft-body standard, and a grindy
  economy. The lesson: the *physics quality* is the franchise's identity; shipping stiff
  or canned destruction kills it. (Eurogamer, TeamVVV, HowLongToBeat reviews.)

### 1b. Wreckfest — Bugbear's spiritual successor

- Soft-body damage modeling: dents land **exactly where the impact happened, sized to the
  impact** — no pre-baked damage states. Damage is location-based and affects driving
  dynamics (a smashed wheel/suspension genuinely changes handling). Two damage settings:
  Normal and Realistic. (TeamVVV tech-demo coverage; community/press summaries.)
- Structure: 17 tracks + 3 derby arenas at launch, car tuning, 24-player multiplayer,
  modding support. Development took ~4 years including a failed Kickstarter and Early
  Access — scope discipline mattered. (Slideshare deck summarizing the game; Eurogamer.)
- **Key production lesson:** all cars are fictional/invented (loosely modeled on real
  archetypes). A racing-games journalist's anonymous developer source put it plainly:
  licensed manufacturers restrict how their cars may break; Bugbear "can do whatever they
  want" because every car is invented. theyard's mechs are original designs by mandate —
  this is a *feature*, not a limitation. (racinggames.gg.)

### 1c. Other derby/combat-racing entries

- **Carmageddon (1997, Stainless):** damage shown by *warping the car mesh itself*;
  three ways to win every race — finish first, wreck all opponents, or (infamously)
  eliminate all pedestrians. Credits earned from damage/kills fund upgrades and mid-race
  repairs; wrecked opponents' cars become unlockable. Open environments, power-ups, and
  checkpoint time bonuses. (Rock Paper Shotgun retrospective; Wikipedia.) Takeaway: the
  multi-win-condition race is a proven format theyard can adapt (race vs. wreck vs.
  objective) without the pedestrian content.
- **Demolition Racer (Infogrames, 1999/2000):** simpler arcade take; damage progressed
  through fixed stages (hood blows off → rear smashed → smoke) — a cautionary example of
  *canned* damage feeling cheap next to real deformation. (GameSpot review.)
- **Destruction AllStars (Lucid, PS5 2021):** 16 hero characters, each with a unique
  hero vehicle and special ability charged by dealing damage/collecting pickups.
  Disposable "common" cars (fast/nimble/heavy) vs. your signature hero car; you can
  **eject from your car at any time** and fight on foot with parkour (wall-run, vault,
  double jump), hijack opponents' cars, and call down your hero vehicle when its meter
  is full. Modes: Mayhem (FFA derby), Carnado (bank wreck-points into a tornado),
  Stockpile (bank at control points), Gridfall (collapsing-floor last-man-standing).
  **Cautionary:** multiplayer servers were taken offline with the game delisted (May
  2026 per community wiki) and single-player support ends Nov 2026 — a live-service
  derby game can die with its servers. Design theyard so the core loop survives without
  servers. (Wikipedia, Destructoid, EGM.)

---

## 2. Gundam-style mecha games — the customization masters

### 2a. Gundam Breaker 4 (Crafts & Meister / Bandai Namco, 2024)

The closest existing model for theyard's modular customizer — a hack-and-slash **looter
about Gunpla**:

- **11 part slots:** head, body, right arm, left arm, legs, backpack, shield, plus right
  and left ranged weapons and right and left melee weapons. Nearly every enemy unit in
  the game can have its parts taken. (WorthPlaying, Final Weapon reviews.)
- **Loot loop:** break parts off enemies in combat and keep them — a Diablo-style loot
  grind where the customization IS the progression. Mission ranks (S-rank, part-break
  performance) determine loot quality; parts can also be bought with earned currency.
- **Fine control per part:** resize parts, reposition them on the frame (so mismatched
  scales still fit), remove sub-elements (e.g., head fins), add optional "Builder's
  Parts" (spikes, chest plates, horns, capes) as cosmetic/skill flair. (Anime News
  Network advertorial.)
- **Paint:** per-aspect painting with color/style wheels (metallic, glossy, matte),
  preset color themes, weathering effects, and decals. Plus a Diorama photo mode.
- **Stats:** parts modify HP, reaction speed, thruster capacity; weapons drive the
  biggest playstyle changes; EX/OP skills come from parts/weapons with ability
  cartridges as buffs/debuffs. (shsta/96xs review.)
- **Key quote from coverage:** with 250+ base kits' worth of parts, the combinations
  run into the quintillions — the customizer is legitimately the game's main selling
  point, with reviewers noting players "spend the majority of playtime building."

### 2b. Armored Core VI: Fires of Rubicon (FromSoftware, 2023)

- **Assembly is the core loop** — director Masaru Yamamura called free customization
  "a universal and borderless source of fun." External parts: head, core, arms, legs
  (+ shoulder weapons); internal parts: booster, FCS (fire-control: lock-on assist tuned
  per range band), generator, expansion. (DotEsports preview.)
- **Constraints create builds:** every part has weight and EN (energy) load; exceeding
  generator capacity makes the mech sluggish; total weight crosses "cliffs" between
  light/mid/heavy classes with sharp mobility penalties. Parts are bought in the shop,
  unlocked by mission progress, Loghunts (optional elite kills), and arena wins.
  (ScreenRant, N4G, PCGamesN guides.)
- **Experimentation-friendly economy:** buying and selling parts has **no penalty —
  full sellback price** — explicitly designed so players try builds without fear.
  (Yamamura interview via Ungeek.) This is the single most portable lesson for
  theyard's customizer: never punish the player for experimenting.
- Combat feel: fast, vertical, lock-on based; assembly choices directly change how a
  mission plays ("the right AC for the right problem").

### 2c. MechWarrior / MechWarrior Online — hardpoint discipline

- The MechLab: each chassis has a **tonnage cap** and a grid of **critical slots**;
  weapons may only mount on **hardpoints of matching type** (ballistic / energy /
  missile) at specific locations. This exists specifically to prevent degenerate
  "boating" (e.g., stuffing 20 of the best weapon onto one mech) and to preserve the
  visual logic of the machine. Different variants of the same mech = different
  hardpoint layouts, which is itself content. (MWO forums, community guides.)
- theyard takeaway: free-form part swapping is fun, but typed slots keep builds sane
  and balanceable.

### 2d. Zone of the Enders: The 2nd Runner (Konami, 2003) — combat feel reference

- The gold standard for *fast anime mecha action*: high-speed 3D arena combat with
  lock-on, a **context-sensitive attack button** (melee up close, ranged at distance),
  grab/throw enemies (use them as shields or projectiles), dash-modified attacks, and a
  dozen subweapons on a shared energy meter. Movement (boost, dash, vertical) IS the
  defense — standing still and trading damage is punished. (WorthPlaying, FragginCivvie
  retrospectives.)
- Relevant because theyard's derby/combat mode needs to feel like *piloting*, not like
  driving a car with a robot skin.

---

## 3. Transformers-style games — the transformation reference

### Transformers: Fall of Cybertron (High Moon Studios, 2012)

- **Transform at will** (one button press) between robot and vehicle modes at almost any
  time. Vehicle form = smaller target profile, fast repositioning/escape, and access to
  the vehicle's heavy weapon; robot form = full gunplay and melee. (Polygon, GameSpy
  reviews.)
- **Character-specific abilities** differentiate the roster: e.g., one character cloaks
  for stealth segments, another ejects minions, and **Grimlock's dino mode is
  rage-gated** — you build a rage meter by dealing melee damage, then unleash the
  alternate form. This is a proven template for transformation-as-earned-power.
  (Empire, CheatCC reviews.)
- **The critical warning (Eurogamer review):** in Fall of Cybertron, transformation was
  often a "bolted-on extra" the level design forgot about — long empty roads were the
  only prompt to transform, with "no tactical purpose to it, nor any challenges built
  around what transformation can entail." **theyard must not repeat this.** If
  transformation is the core mechanic, tracks/arenas/events must *demand* it.
- Multiplayer had class-based character creation with unlockable parts — a lighter
  version of the customizer loop. (CGMagazine review.)

---

## 4. Biomech games — organic-machine hybrid aesthetics in games

### Scorn (Ebb Software, 2022)

- A first-person horror adventure whose entire identity is its **biomechanical art
  direction**, inspired by H.R. Giger and Zdzisław Beksiński: flesh fused with machine,
  anatomical forms treated as utilitarian systems, environments that feel grown as much
  as built. (PC Gamer interview with project lead Ljubomir Peklar.)
- **Production lesson:** a small team (Ebb Software, indie) differentiated itself from
  the entire FPS genre purely through art direction. Peklar's note that most artists
  default to "big teeth, big eyes and some form of bugs" when asked for biomechanical
  is a warning — theyard's biomechs need a *designed* visual language (see §5), not
  generic spikes-and-teeth.
- The world-as-character approach (no dialogue, story told through the environment)
  shows how far committed art direction carries a game. (TheSixthAxis, CBR reviews.)

### General note

Biomechanical *playable mecha* are rare in games — the design language lives mostly in
enemy/creature design (Giger's Alien lineage) and in anime (Evangelion, §5). That
scarcity is theyard's opening: an EVA-inspired biomech you *customize and race* has
almost no direct competition.

---

## 5. Neon Genesis Evangelion — the core biomech design reference

(Researched from episode-accurate lore summaries — ScreenRant, Gamerant, the Evangelion
fandom wiki, and Wikipedia's Evangelion (mecha) article.)

**What an EVA is (researched fact):**
- EVAs are **not robots — they are biomechanical cyborgs**: giant artificial humans
  (cloned from the Angels they fight) with cybernetic components grafted on. When armor
  is damaged, organic tissue is revealed underneath — human hands complete with
  fingernails, toes, brown organic tissue, red blood-like fluid. (ScreenRant, CBR
  anatomy article.)
- The colored armor plating is **restraint, not just protection**: constrictive plates
  bolt the organism down and hide its true form. When restraints fail, the EVA goes
  **Berserk** — the organism overrides the controls. (vectree Unit-01 summary,
  Gamerant.)
- **Power constraint:** EVAs fight tethered to an umbilical cable; on internal battery
  they get roughly **five minutes** of operation. The energy limit is their defining
  tactical weakness. (ScreenRant, vectree.)
- **Proportions:** lanky, elongated limbs and torso — more exaggerated than a human but
  unmistakably humanoid, not boxy-mecha. (CBR.)
- **Signature details:** Unit-01 — purple armor, horned forehead, mouth bolted shut,
  green/orange accent striping. Each unit is visually distinct (00 blue, 01 purple, 02
  red) with unique capabilities and a single bonded pilot. (Wikipedia.)
- Later films add **Beast Mode** — the restraints released, the organism unleashed.
  (Blokees kit coverage summarizing the films.)

**Design language to distill (not copy) for theyard's biomechs:**
1. Flesh under armor — joints, necks, and damage states reveal sinew/tissue, never bare
   metal endoskeleton cliché.
2. Restraint aesthetics — bolts, straps, constrictive plating, muzzled mouths; the
   machine looks like it's *holding something back*.
3. Bestial movement — loping, twitching, head-tilts; idle animation sells "alive."
4. Lanky humanoid proportions over boxy mecha blocks.
5. Power as a leash — the umbilical/battery idea maps beautifully to a gameplay
   resource (see Synthesis).

---

## 6. Key titles — what each is known for

| Title | Year | Known for (verified) |
|---|---|---|
| FlatOut 2 / Ultimate Carnage | 2006/07 | ~40-part destructible cars; nitro earned by carnage; ragdoll driver stunts; Carnage mode |
| Wreckfest | 2018 | Soft-body, location-based damage that changes handling; fictional cars = damage freedom |
| FlatOut 4: Total Insanity | 2017 | Partial series recovery; cautionary — thin track count, dated damage, grindy economy |
| Carmageddon | 1997 | Mesh-warp damage; 3 win conditions per race; credits-from-destruction economy |
| Demolition Racer | 1999 | Simple arcade derby; cautionary — canned staged damage feels cheap |
| Destruction AllStars | 2021 | Hero vehicles + eject-anytime + on-foot parkour; cautionary — servers shut down 2026 |
| Gundam Breaker 4 | 2024 | 11 part slots; loot-by-breaking-enemy-parts; resize/reposition/paint/weather/decals |
| Armored Core VI | 2023 | Assembly-as-core-loop; weight/EN constraints; full-price sellback encourages builds |
| MechWarrior (Online/5) | 2013/19 | Hardpoint type restrictions; tonnage caps; anti-"boating" variant design |
| Zone of the Enders: The 2nd Runner | 2003 | Fastest-feeling mecha action; context-sensitive melee/ranged; grab/throw |
| Transformers: Fall of Cybertron | 2012 | Transform-at-will; rage-gated alt form (Grimlock); warning: transformation needs tactical purpose |
| Scorn | 2022 | Giger/Beksiński biomechanical art direction as a small team's whole differentiator |
| Neon Genesis Evangelion (anime) | 1995– | Biomech design bible: flesh under restraint-armor, 5-min power leash, berserk mode |

---

## 7. Systems & mechanics worth stealing

1. **Nitro-from-carnage (FlatOut):** boost is earned by hitting rivals, catching air,
   and smashing scenery. Aggression = fuel. theyard's derby mode should tie its
   transformation/ability meters to this same behavior.
2. **Per-part destructible damage (FlatOut UC / Wreckfest):** damage states per body
   panel, with handling consequences for *where* you're hit. For mechs: damaged arm =
   worse melee, damaged leg = worse handling, cracked armor reveals the biomech tissue
   underneath (art + readability in one system).
3. **Loot-by-breaking (Gundam Breaker 4):** tear a part off a rival in the derby and
   you can claim it. Turns every race into a parts economy.
4. **No-penalty respec (Armored Core VI):** full sellback on parts. Experimentation
   without fear is what makes a customizer *fun* instead of stressful.
5. **Typed slots / hardpoints (MechWarrior):** weapon/armor types restricted by slot
   type. Prevents degenerate builds and keeps every chassis readable.
6. **Earn the transformation (FoC Grimlock / AllStars hero meter):** alternate forms
   gated behind a meter built by playing well — or transform-at-will with a *cost*
   (momentum loss, vulnerability window). Never free with no tradeoff.
7. **Eject / mode-switch as an escape tool (AllStars / FoC):** vehicle form as the
   "smaller target + reposition" option; the switch itself is a combat verb.
8. **Multi-win-condition events (Carmageddon):** finish the race OR wreck the field OR
   complete the objective. Gives losing racers a second path to victory.
9. **Rival personalities (FlatOut 2):** named AI drivers with grudges and driving
   styles. Cheap to implement, huge for derby-mode life.
10. **Builder's Parts (Gundam Breaker 4):** pure-flair cosmetic slots (horns, spikes,
    plates, capes) separate from stat parts — the self-expression layer that costs
    nothing to balance.

---

## 8. Art direction notes

- **North star:** EVA design language (§5) — flesh under restraint-armor, bolts and
  straps, lanky proportions, bestial idle/movement. Original designs only; no EVA
  colorways (no purple-01/green, no horned forehead), no NERV-style iconography.
- **Differentiation:** Scorn proves a small team can own a lane purely through a
  committed biomechanical art direction. theyard's "biomech you race" has almost no
  direct competition — lean into it.
- **Damage as art:** the moment armor cracks and tissue shows is the signature visual.
  Design the damage states first, not last — they're the money shot.
- **Readability:** in a derby, silhouettes must read at speed. Keep per-mech
  silhouettes distinct (lanky / bulky / bladed / horned archetypes) and let paint +
  Builder's Parts carry player identity.
- **Transformation readability:** the mode switch must read instantly at a glance
  (stance change, unfolding panels, glow shift) — spectators and rivals need to know
  which mode you're in without a UI tutorial.

---

## 9. Customization systems — comparative notes

| System | Slots | Constraints | Economy | Steal this |
|---|---|---|---|---|
| Gundam Breaker 4 | 11 (head/body/arms/legs/backpack/shield/4 weapons) | minimal — free mixing + resize | loot drops + shop | resize/reposition parts; loot-by-breaking; Builder's Parts |
| Armored Core VI | 4 external + 4 internal + weapons | weight + EN load, class cliffs | shop, full sellback | no-penalty respec; constraints that create build identity |
| MechWarrior | chassis-defined | hardpoint types + tonnage + crit slots | purchase/inventory | typed slots prevent degenerate builds |
| AllStars | hero vehicle + hero ability | charge meter | earned in-match | signature vehicle as earned power spike |

**theyard customizer shape (recommendation, see §10):** per-mech slots — head, torso/
core, right arm, left arm, legs, backpack, armor plates, ranged weapon, melee weapon —
each with a **per-mode assignment** (racer-mode config vs. derby-mode config, 2+
modes). Weight/tonnage budget + hardpoint typing constrain builds. Full sellback.
Live 3D preview **shows the transformation** between modes.

---

## 10. Production & scope lessons (what's achievable for a small team)

1. **Damage physics IS the genre.** FlatOut 3 died on bad physics; Wreckfest spent 4
   years (failed Kickstarter → Early Access) getting soft-body right. For theyard:
   invest physics effort in the *derby contact* first — per-part damage states with
   handling consequences beat full soft-body simulation on a small-team budget. Fake
   the rest with good deformation art.
2. **Fictional machines = creative and legal freedom.** Wreckfest's invented cars let
   Bugbear destroy them without licensor approval. theyard's original-design mandate
   is the same advantage — document it as a feature.
3. **Don't ship multiplayer-dependent.** Destruction AllStars' servers are being shut
   down; design theyard's core loop (career, derby vs. AI rivals, customizer) to be
   complete offline. Multiplayer is a stretch goal, not the foundation.
4. **Art direction is the cheapest differentiator.** Scorn (small indie team) stood out
   purely on biomechanical art commitment. theyard doesn't need AAA poly counts — it
   needs a *designed* biomech visual language applied consistently.
5. **Content is the grind — plan for it.** FlatOut 4 was dinged for ~10 tracks;
   Gundam Breaker 4's 250+ kits are its content moat. For theyard: procedural/arena
   variants and a strong part library beat a handful of hand-made tracks. The part
   library IS content — every part is a loot drop, a shop item, and a player-expression
   tool.
6. **Transformation must be designed into levels, not bolted on.** Fall of Cybertron's
   Eurogamer critique is the warning label: if tracks and modes don't *require* mode
   switching, players will ignore it and the core mechanic dies.

---

## 11. SYNTHESIS — concrete recommendations for theyard

> Everything below is **recommendation** (my synthesis of the research above), not
> researched fact.

### A. The modular mecha customizer

- **Slot layout (per mech):** head, torso/core, right arm, left arm, legs, backpack,
  armor plates, ranged weapon, melee weapon — 9–11 slots, mirroring Gundam Breaker 4's
  proven granularity.
- **Dual-mode configs:** every slot takes a part assignment **per mode** (racer mode /
  derby mode, extensible to more). The customizer's live 3D preview **animates the
  transformation** between the two configs — this is the owner's explicit requirement.
- **Constraints:** a tonnage/weight budget (Armored Core-style) plus hardpoint typing
  (MechWarrior-style: e.g., only plow/blade parts in the ram slot, only boosters in
  the engine slot). Constraints create build identity and keep balance tractable.
- **Economy:** parts earned by **breaking them off rivals** in derby events (Gundam
  Breaker loot loop) plus a shop; **full sellback, zero respec penalty** (Armored Core
  VI's rule) so players experiment freely.
- **Expression layer:** Builder's-Parts-style pure-cosmetic slots (horns, spikes,
  plating, decals) + per-part paint/weathering. Zero balance cost, infinite identity.
- **Stats that matter:** per-part contributions to speed, handling, armor/durability,
  ram damage, boost capacity — and the numbers must *visibly* change how the mech
  drives/fights, or the customizer is decoration.

### B. Demolition-derby / racing gameplay

- **Core loop:** FlatOut's nitro-from-carnage — boost/ability meters fill from hits,
  airtime, and environmental destruction. Aggression is fuel.
- **Damage model:** per-part damage states (scratched → cracked → torn off) with
  **handling consequences by location** (Wreckfest's lesson, scoped down from full
  soft-body): damaged leg = worse turning, damaged arm = weaker melee, cracked torso
  armor reveals biomech tissue (the EVA-inspired money shot).
- **Event types:** circuit races, arena deathmatches, figure-8 (built for collisions),
  stunt events, and multi-win-condition events (race / wreck-the-field / objective —
  the Carmageddon format minus its problematic content).
- **AI rivals:** named personalities with grudges and driving styles (FlatOut 2's
  cheapest high-value feature).
- **Scope guardrails:** complete offline single-player first (career + customizer);
  treat online multiplayer as a stretch goal (the AllStars shutdown is the warning).

### C. The transformation mechanic (owner-confirmed core)

- **Design it as a combat verb with a cost:** transform-at-will like Fall of
  Cybertron, but every switch costs something — a momentum dip, a brief vulnerability
  window, or meter spend. Free switching with no tradeoff gets ignored or exploited.
- **Gate the best forms:** a Grimlock-style rage/power meter — deal/take derby damage
  to charge a **Berserk/Breach mode** (restraints-off, EVA-inspired: armor plates shift,
  tissue exposed, bestial movement, big power spike on a timer). This is the
  transformation fantasy the owner named.
- **Racer mode vs. derby mode roles:** racer = speed, handling, slipstream; derby =
  armor, ram damage, melee. Tracks and arenas must *demand* switching (tight
  technical circuit sections → derby-mode shortcuts through destructible barriers;
  open straights → racer mode). This directly answers Fall of Cybertron's critique.
- **Readability:** the switch must read instantly — stance change, unfolding panels,
  glow/color shift, distinct audio. Rivals and spectators know your mode at a glance.

### D. Documentation & production next steps (proposed)

1. Write the **customizer spec** (slots, constraints, economy, preview requirements)
   as theyard's next design doc — the research above is its source list.
2. Write the **transformation design** (triggers, costs, mode roles, Berserk gating)
   before any animation work — it drives rig and part requirements.
3. Build the **damage-state art** (armor crack/tissue reveal) early — it's the game's
   signature visual and validates the biomech direction.
4. Prototype **derby contact feel** (per-part hit response + handling effects) before
   content scale — physics quality is the genre's identity (FlatOut 3 lesson).
5. Keep a **part-library content plan**: every part = loot + shop item + expression
   tool. The library is the content moat.

---

## 12. Gaps / could not verify

- Exact per-car part counts for FlatOut 1 (only Ultimate Carnage's "~40 parts" was
  verified via the Bugbear Q&A); FlatOut 1 specifics were not deeply researched.
- Bionicle and Kamen Rider *game* implementations of modular/form-change mechanics
  were not researched this pass — the customizer drew on Gunpla (Gundam Breaker) and
  the form-change drew on Transformers/Evangelion instead.
- Power Rangers / Zord-combiner game mechanics were not researched; noted as a future
  lane if combination mechanics enter the design.
- Wreckfest 2 (Early Access, March 2025) exists but was not deeply covered; its soft-
  body and engine-damage details (coolant/oil leaks affecting traction) come from
  community discussion, not verified reviews.

---

## Sources

All claims above are summarized from these pages (fetched 2026-10-09; summaries are my
own — no website was "visited" in a browser, only text fetched):

**FlatOut:**
- https://en.wikipedia.org/wiki/FlatOut_2
- https://www.gamespot.com/articles/flatout-ultimate-carnage-qanda/1100-6178022/
- https://www.eurogamer.net/flatout-ultimate-carnage-first-impressions
- http://slayerpit.blogspot.com/2025/02/flatout-2-ultimate-carnage-review.html
- https://gamingpastime.com/flatout-ultimate-carnage-pc-review/
- https://en.wikipedia.org/wiki/FlatOut
- https://www.eurogamer.net/flatout-4-total-insanity-is-a-welcome-return-to-form-for-the-series-but-stalls-on-innovation
- https://www.teamvvv.com/reviews/flatout-4-total-insanity-review/
- https://gamingbolt.com/flatout-4-total-insanity-review

**Wreckfest:**
- https://www.eurogamer.net/wreckfest-review-a-true-successor-to-the-brilliant-destruction-derby
- https://www.teamvvv.com/news/bugbear-demonstrate-next-car-games-soft-body-deformation-in-damage-test-video/
- https://racinggames.gg/article/the-real-reason-racing-games-ditch-licensed-cars-for-fictional-brands
- https://www.slideshare.net/slideshow/wreckfest-by-bugbear-entertainment/228718840

**Other derby/combat racing:**
- https://www.rockpapershotgun.com/gaming-made-me-carmageddon
- https://en.wikipedia.org/wiki/Carmageddon
- https://www.gamespot.com/reviews/demolition-racer-review/1900-2538586/
- https://en.wikipedia.org/wiki/Destruction_AllStars
- https://www.destructoid.com/destruction-allstars-got-a-state-of-play-breakdown-one-week-before-launch/
- https://egmnow.com/destruction-allstars-gameplay-video-shows-off-vehicle-and-hero-abilities/

**Mecha customization & combat:**
- https://worthplaying.com/article/2024/8/28/reviews/143385-ps5-review-gundam-breaker-4/
- https://www.animenewsnetwork.com/advertorial/2024-08-28/how-to-create-over-a-quintillion-uniquely-customized-gunpla-in-gundam-breaker-4/.214879
- https://finalweapon.net/2024/08/27/gundam-breaker-4-review/
- https://dotesports.com/armored-core/news/armored-core-6-hands-on-preview-some-assembly-required
- https://www.ungeek.ph/2023/07/armored-core-vi-no-penalties-for-buying-and-selling-parts-says-fromsoftware/
- https://screenrant.com/armored-core-6-best-external-parts-build/
- https://mwomercs.com/forums/topic/20696-how-exactly-do-hardpoints-work-in-mwo/
- https://worthplaying.com/article/2018/10/9/reviews/111200-ps4-review-zone-of-the-enders-the-2nd-runner-mars/
- https://www.fraggincivie.com/2009/05/essentials-30-zone-of-enders-2nd-runner.html

**Transformers:**
- https://www.polygon.com/2012/10/9/3478666/transformers-fall-of-cybertron-review-wheels-of-steel/
- https://www.eurogamer.net/transformers-fall-of-cybertron-review
- http://pc.gamespy.com/pc/transformers-fall-of-cybertron/1225819p1.html
- https://www.empireonline.com/gaming/reviews/transformers-fall-cybertron-review/

**Biomech / Evangelion:**
- https://www.pcgamer.com/behind-the-beautifully-grotesque-art-of-scorn/?ns_campaign=article-feed&
- https://screenrant.com/neon-genesis-evangelion-every-eva-unit-explained
- https://gamerant.Com/evangelion-eva-units-mechs/
- https://en.wikipedia.org/wiki/Evangelion_(mecha)
- https://vectree.io/pdf/c/evangelion-unit-01
- https://www.cbr.com/evangelion-eva-unit-anatomy/
