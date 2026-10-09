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
- **Delta check (from §13c):** racer mode must be *dramatically* faster and more
  agile; derby mode *dramatically* tougher and harder-hitting. Rise of the Dark
  Spark's "slightly faster, less mobile" car mode got ignored 80% of the time. If a
  mode isn't obviously the best tool for a situation, the mechanic dies.

### E. Transformation — per-mode customizer, triggers/costs/balancing, technical approach (owner core mechanic)

> Everything in subsection E is **recommendation** (built on the researched patterns
> in §13), not researched fact. Original designs only — inspired by, never copies.

**E1. Per-mode configurations in the modular customizer**
- Data model: each mech carries **2+ mode configs** — `mech.modes.racer.slots`,
  `mech.modes.derby.slots` — every slot (head, torso/core, right arm, left arm,
  legs, backpack, armor plates, ranged weapon, melee weapon) takes a part assignment
  **per mode**. Validate each mode independently: tonnage/weight budget and
  hardpoint typing are checked per mode, so a racer config can't smuggle derby-only
  armor in, and vice versa.
- Mode-exclusive part tags: parts are tagged `racer | derby | both`; e.g., plow/blade
  parts are derby-only, slipstream fairings racer-only. This keeps both modes
  visually and statistically distinct and gives the part library a reason to be
  twice as deep.
- The customizer's live 3D preview **animates the full transformation between the
  player's two configs** (owner requirement) — scrubable, so the player can check
  panel clearance, silhouette change, and readability before committing.
- New Gundam Breaker community tension (§13g) is the warning: free part mixing
  breaks per-part transformation logic. Solve it the way the community suggested —
  **the chassis defines the transformation animation**; parts attach to named
  hardpoints that the animation already moves. No per-part custom transforms.

**E2. Transformation triggers, costs, and balancing (derby/racing)**
- **Input:** single dedicated button (WfC's thumbstick-click proved frictionless),
  transform-at-will.
- **Cost — the mode-switch meter:** every switch costs meter, which refills from
  the nitro-from-carnage loop (§7.1: hits, airtime, destruction). This ties the
  core mechanic into the aggression economy — you transform more by fighting more.
  Meter prevents spam-switching and gives rivals a readable window to punish.
- **Commitment — transition vulnerability:** the switch takes ~0.6–1s (pre-baked
  animation; technical note below). During transition the mech can't attack — it's a
  commitment, not an escape freebie. (Optional later: Devastation-style combo-end
  "attack-transform" with a tight input window for skilled players.)
- **Berserk/Breach mode:** a third, rage-gated form per mech — Grimlock-style rage
  meter built by dealing/taking derby damage; AC-VI-style limited use, ~10s
  duration; restraints-off EVA aesthetics (armor plates shift, tissue exposed,
  bestial movement). Build-chosen, not loadout-chosen: each chassis has exactly one
  Breach configuration.
- **When transformation is tactically useful (design spec, not vibes):**
  - *Derby mode → racer mode:* escape a gang-up, chase a fleeing rival, hit boost
    pads / straight sections, cross the arena faster.
  - *Racer mode → derby mode:* ram through destructible barriers/shortcuts, tank
    a hit, grapple-melee range, shove rivals into walls for style points.
  - *Breach mode:* behind on damage, outnumbered, or final-lap desperation — a
    comeback tool on a timer, never a win button.
- **Level design must demand it (§13h net rule):** every track/arena ships with
  mode-gated opportunities — destructible barrier shortcuts only ram-through in
  derby mode, long straights where racer mode is strictly faster, pickup lanes that
  reward either mode choice. Multi-win-condition events (§7.8) multiply the reasons
  to switch.
- **Anti-patterns, codified:** (1) never script-lock transformation mid-event
  (Dark Spark fury); (2) never reduce combining to QTEs (Mega Battle); (3) never
  let the racer↔derby delta shrink to "slightly faster" (Dark Spark); (4) don't
  story-lock core forms — both modes are available from the first race.

**E3. Technical approach for a small-team build**
- **Transformation = state machine, not simulation.** Two validated configs per
  chassis; one pre-baked transition animation per chassis (0.6–1s), authored once
  and reused for every part loadout — parts ride the chassis's named hardpoints.
  On switch: play animation (masked with flash/particles/audio like Devastation's
  cue), then hot-swap collision volumes, stat profiles, and control scheme.
  This is a **rig + animation** task, affordable for a small team; it is not a
  procedural-mesh-morphing task.
- **Parts only swap in the garage (Armored Core rule):** mid-event "reconfiguration"
  is the transformation state machine only. This keeps balance tractable and the
  animation budget bounded — N chassis × 1 transition animation, not N×M parts ×
  animations.
- **Prototype order:** (1) two configs + instant switch with stat delta, tune the
  delta until each mode is strictly best at its job; (2) add meter cost + transition
  vulnerability; (3) then author the transition animation; (4) Breach mode last.
  Never prototype the animation before the gameplay delta — a beautiful transform
  into a useless mode is the FoC outcome.

### D. Documentation & production next steps (proposed)
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
- Kamen Rider *Battride War* series form-change mechanics were not deeply researched
  this pass — Memory of Heroez (§13e) was used instead.
- Bionicle *game* implementations of modular mechanics (e.g., Bionicle: The Game
  2003) were not researched this pass — Bionicle coverage came from the brand's
  physical/build-system side only.
- The New Gundam Breaker transformation-vs-customization tension is **unverified
  community discussion** (a Steam forum thread), not a developer statement.
- Wreckfest 2 (Early Access, March 2025) exists but was not deeply covered; its soft-
  body and engine-damage details (coolant/oil leaks affecting traction) come from
  community discussion, not verified reviews.

## 13. Transformation mechanics in mecha games — researched

> Everything in §13 is **researched fact** (summarized from the sources listed at the
> end), distinct from the recommendations in §11. IP rule: these are design
> *patterns* to learn from, not designs to copy — theyard's mechs and forms must be
> original.

### 13a. Transformers: War for Cybertron (2010) — transform-at-will done right

- **Input:** a single thumbstick click switches between robot and vehicle modes
  near-instantly; reviewers report flipping back and forth *multiple times within the
  same fight* because the switch was fast and frictionless (Escapist review).
- **Mode roles differed by character class** (WorthPlaying review): slower
  characters' vehicle form carried a **backup reserve of more powerful ammunition**
  (robot ammo runs dry → vehicle gun takes over); fast characters used vehicle form
  as a run/mobility replacement; flying vehicles were tactical only in open spaces.
- **Vehicle trade-offs:** smaller target profile, speed, heavy weaponry — but lower
  firing rate and damage than robot mode in the sequel (GameSpy, Capsule Computers).
- **Ammo economy link:** vehicle weapons served as a fallback when robot-mode ammo
  ran out, giving transformation a concrete tactical purpose (GameFAQs/GameSpy
  reviews).
- Takeaway: near-instant switching + per-mode asymmetric roles + ammo/energy economy
  coupling made transformation a real decision, not decoration.

### 13b. Transformers: Fall of Cybertron (2012) — the bolted-on warning, deepened

- Vehicle mode dealt reduced damage at a lower firing rate; reviewers estimated
  ~80% of playtime stayed in robot mode (Capsule Computers, Nintendo Life coverage
  of the same formula in the sequel).
- Vortex was the standout exception: **three forms** (robot / helicopter / jet),
  each with a clear job — helicopter hovers and strafes, jet repositions fast,
  robot clears rooms on foot (GameSpot's D.I.C.E. demo coverage).
- The Eurogamer critique (§3) stands: transformation was bolted-on where levels
  were tight corridors; only the rare open/flying segments demanded it.

### 13c. Transformers: Rise of the Dark Spark (2014) — anti-patterns to avoid

- Nintendo Life review: ~80% of the campaign spent in robot mode; ground vehicles
  were "a slightly-faster, less mobile version of their robot form" — **the mode
  delta was too small to matter**.
- Some scripted segments **forbade transformation entirely** ("the game will inform
  you that you're not allowed to"), which reviewers found infuriating in a game
  titled *Transformers*. Anti-pattern: never arbitrarily hard-lock the core verb.
- FutureFive review: levels were "claustrophobic" with "no room for you to be in
  vehicle mode" — level geometry actively denied the mechanic.
- Lesson for theyard: (1) make the racer↔derby stat delta *large and asymmetric*,
  never "slightly faster"; (2) never script-lock transformation mid-event; (3)
  arenas must physically fit both modes (the FoC warning again).

### 13d. Transformers: Devastation (PlatinumGames, 2015) — transformation as combo verb

This is the best implementation found for transformation *inside combat*:

- **Vehicle Attacks:** at the end of a successfully executed combo, a timed prompt
  (roughly a one-second window) invites you to press the button — the character
  transforms, hurls its vehicle form at the enemy for big damage, then snaps back to
  robot mode to continue the combo (Escapist, GameSpot, GameReactor, Daily Gamepad).
- **Risk/reward with real teeth:** miss the window and you just dodge while the
  combo breaks — opponents punish you. Game cues with audio + popup; "timing has to
  be absolutely spot on" (NukingTheCat review). Deliberate play is rewarded,
  button-mashing is not.
- Vehicle mode also free for traversal at will, and top-speed vehicle attacks could
  break enemy shields (3rd-Strike review).
- Character-specific signature moves on a second power gauge (Optimus manifests his
  trailer as a weapon, Sideswipe flash-steps) show how alternate forms double as
  character identity.
- Takeaway: a tight timing window + a fail penalty + big payoff turns transformation
  into a *skill mechanic* rather than a menu choice.

### 13e. Kamen Rider: Memory of Heroez (2020) — form-change as resource

- **Form Chain System:** pick the form AND the follow-up attack simultaneously —
  changing forms mid-combat and chaining combos through them is the game's whole
  identity ("the form change is a synonym for Kamen Rider," official site via
  Nintendo Life).
- **Stamina cost:** Rider Power (RP) is spent by attacks, dodging, flying, *and*
  changing forms; fully exhausted RP forces a recharge. Perfectly dodging then
  countering instantly refills RP (Kamen Rider fandom wiki).
- **Form change as matchup answer:** boss fights required it — e.g., Kamen Rider
  Double's CycloneMetal form twirls the Metal Shaft to repel a fireball boss attack
  (Siliconera gameplay coverage).
- **Unique attack on change:** performing an attack at the moment of transformation
  costs extra RP but triggers a form-specific move — the "attack-transform" input
  (fandom wiki).
- Cautionary: non-default forms were story-locked (fandom wiki) — fine for a
  narrative game, wrong for theyard where both modes must be available from the
  start.
- Takeaway: charge a stamina-like resource for switching; let a perfect dodge /
  aggressive hit refill it; allow attack-on-transform inputs.

### 13f. Power Rangers games — combining as earned spectacle or gated assist

Two proven templates, from two different games:

- **Earned set-piece (Mighty Morphin Power Rangers: Rita's Rewind, 2024):**
  Dinozords combine into the Megazord as the stage finale, flipping the game into a
  first-person Punch-Out-style boss battle (Game8, Co-Optimus reviews). In co-op,
  players *take turns piloting* the combined form — combining as a team resource.
  Zord segments beforehand are Star Fox-style rail shooters, each Zord with distinct
  abilities.
- **Meter-gated assist (Power Rangers: Battle for the Grid, 2019):** summon the
  Megazord mid-combo as an assist super (press both assist buttons) without
  disrupting the fighting flow (Seafoam Gaming, Nintendo Insider reviews).
- **Anti-pattern (Power Rangers: Mega Battle, 2017):** combining sequences reduced
  to weak-point mashing and timed button prompts — reviewers called them
  underwhelming, a "missed opportunity" (BioGamerGirl).
- Takeaway: combining either *is* a mode you play (earned, climactic) or *is* a
  metered super that punches into a combo — never a QTE sideshow.

### 13g. Gundam / Armored Core — mid-battle reconfiguration

- **Transformable suits in Gundam vs. titles:** suits like the Zeta Gundam switch to
  Wave Rider flight form via a boost+direction input; transformation is a *per-suit
  capability*, not universal (GameFAQs Q&A; GameSpot user review). In these arena
  fighters it's pure mobility/repositioning, with combat still fought in suit form.
- **The customization-transformation tension (community, unverified):** New Gundam
  Breaker forum discussion flagged that full part-swap customization clashes with
  per-suit transformation — transformation requires "a lot of rules," and only a
  minority of designs are transformable. One proposed solution: pre-baked
  transformation animations keyed off a transform-capable backpack part. Treat as
  *unverified community opinion*, but the design tension is real: free mixing breaks
  per-part transformation logic.
- **Armored Core VI — gated burst forms:** AC VI has no mid-mission part swaps;
  mid-battle "reconfiguration" comes from **Core Expansions** (Assault, Pulse,
  Protection, Terminal): limited-use abilities with a **10-second duration** that
  swing a fight's momentum, unlocked via OST chips from Arena missions
  (GamerJournalist, TechStory guides). Direct parallel to theyard's planned
  Berserk/Breach mode: a build-chosen, limited-use, timed power form.

### 13h. Balance patterns that recurred across titles

| Pattern | Where seen | How it worked |
|---|---|---|
| Timed window + fail penalty | Transformers: Devastation | ~1s prompt at combo end; miss it = combo breaks, you eat hits |
| Stamina/resource cost per switch | Kamen Rider: Memory of Heroez | RP spent on form change; recharges; perfect dodge refills |
| Big asymmetric mode roles | WfC / Devastation | speed + fallback ammo vs. full gunplay/melee; big damage in timed window |
| Delta too small = ignored mode | Dark Spark | ground vehicle only "slightly faster" → 80% robot time |
| Hard script locks | Dark Spark | transformation forbidden in scripted segments → reviewer fury |
| Limited-use timed burst form | Armored Core VI Core Expansions | 10s duration, limited uses, chosen per build |
| Rage-gated form | FoC Grimlock | deal melee damage → charge → unleash alt form |
| Meter-gated assist form | Battle for the Grid | Megazord assist on meter, woven into combos |
| Earned set-piece form | Rita's Rewind | combining as stage finale with genre switch |

**Net rule:** a transformation survives as a core mechanic only when every switch
has a *cost or commitment* (window, meter, stamina, vulnerability), a *clear payoff*
(roles big enough to feel different), and *level design that demands it*.
Free-and-painless switching produces the Fall of Cybertron outcome.

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
- https://www.escapistmagazine.com/review-transformers-war-for-cybertron/
- https://worthplaying.com/article/2010/7/9/reviews/75463-ps3x360-review-transformers-war-for-cybertron/
- https://www.capsulecomputers.com.au/2012/09/transformers-fall-of-cybertron-review/
- https://www.escapistmagazine.com/transformers-devastation-review-platinum-robots-in-disguise/
- https://www.gamespot.com/reviews/transformers-devastation-review/1900-6416275/
- https://www.nukingthecat.com/post/2015/10/13/video-game-review-transformers-devastation
- https://www.gamereactor.eu/transformers-devastation-review/
- https://www.gamesxtreme.com/article/4206/transformers-devastation-review
- https://thedailygamepad.net/transformers-devastation-review/
- http://www.nintendolife.com/reviews/wiiu/transformers_rise_of_the_dark_spark

**Kamen Rider:**
- https://kamenrider.fandom.com/wiki/KAMEN_RIDER:_memory_of_heroez
- https://www.nintendolife.com/games/nintendo-switch/kamen_rider_memory_of_heroez
- https://www.siliconera.com/kamen-rider-memory-of-heroez-early-gameplay-video/

**Power Rangers:**
- https://www.co-optimus.com/review/2511/mighty-morphin-power-rangers-rita-s-rewind-co-op-review.html
- https://game8.co/reviews/mighty-morphin-power-rangers-rita-s-rewind/mighty-morphin-power-rangers-ritas-rewind-review
- http://seafoamgaming.com/2019/04/15/power-rangers-battle-for-the-grid-switch-eshop-review/
- https://www.nintendo-insider.com/power-rangers-battle-for-the-grid-review/
- http://www.biogamergirl.com/2017/02/mighty-morphin-power-rangers-mega.html

**Gundam / Armored Core mid-battle systems:**
- https://Gamefaqs.gamespot.com/psp/975136-kidou-senshi-gundam-gundam-vs-gundam-next-plus/answers/149967-how-to-transform-into-planes
- https://www.gamespot.com/mobile-suit-gundam-gundam-vs-zeta-gundam/user-reviews/2200-571161/
- https://gamerjournalist.com/how-to-use-core-expansion-in-armored-core-6-best-core-expansion/
- https://steamcommunity.com/app/738530/discussions/0/2747650363466018325/ (New Gundam
  Breaker community discussion — unverified opinion, not a developer statement)

**Biomech / Evangelion:**
- https://www.pcgamer.com/behind-the-beautifully-grotesque-art-of-scorn/?ns_campaign=article-feed&
- https://screenrant.com/neon-genesis-evangelion-every-eva-unit-explained
- https://gamerant.Com/evangelion-eva-units-mechs/
- https://en.wikipedia.org/wiki/Evangelion_(mecha)
- https://vectree.io/pdf/c/evangelion-unit-01
- https://www.cbr.com/evangelion-eva-unit-anatomy/
