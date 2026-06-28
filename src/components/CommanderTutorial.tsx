import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProfile, ColonyPlanet, ResourceType } from '../types';

interface CommanderTutorialProps {
  player: PlayerProfile;
  activePlanet: ColonyPlanet;
  fleets: any[];
  onRefreshState: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setActiveTab: (tab: 'explore' | 'army' | 'galaxy' | 'research' | 'settings') => void;
  chatMessages?: any[];
  customTasks?: Record<string, any>;
}

export interface TutorialTask {
  id: number;
  title: string;
  shortDesc: string;
  requirementHtml: string;
  hint: string;
  howToGetThere: string;
  commanderTip: string;
  congratsMessage: string;
  encouragementQuote: string;
  targetTab: 'explore' | 'army' | 'galaxy' | 'research' | 'settings';
  rewards: {
    resources: { [key in ResourceType]?: number };
    credits: number;
  };
}

export let DEFAULT_TUTORIAL_TASKS: TutorialTask[] = [];

export const CommanderTutorial: React.FC<CommanderTutorialProps> = ({
  player,
  activePlanet,
  fleets,
  onRefreshState,
  showToast,
  setActiveTab,
  chatMessages = [],
  customTasks = {},
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [allowOverflow, setAllowOverflow] = useState(false);
  const [isWelcomeClosed, setIsWelcomeClosed] = useState(() => {
    return localStorage.getItem(`moonbase_welcome_closed_${player.id}`) === 'true';
  });
  const [isPermanentlyClosed, setIsPermanentlyClosed] = useState(() => {
    return localStorage.getItem(`moonbase_tutorial_permanently_closed_${player.id}`) === 'true';
  });

  const handleCloseWelcome = () => {
    localStorage.setItem(`moonbase_welcome_closed_${player.id}`, 'true');
    setIsWelcomeClosed(true);
  };

  const handlePermanentClose = () => {
    localStorage.setItem(`moonbase_tutorial_permanently_closed_${player.id}`, 'true');
    setIsPermanentlyClosed(true);
    showToast('Star Admiral Academy training campaign completed and permanently closed!', 'success');
  };

  // Completed tasks array retrieved from server (or defaults to empty)
  const completedList = player.completedTutorialTasks || [];

  if (isPermanentlyClosed) {
    return null;
  }

  const repositoryLevel = activePlanet?.buildings?.repository?.level || 1;
  const siloCapacity = Math.round(10000 * Math.pow(500, (repositoryLevel - 1) / 44));

  // Tutorial Quest definitions (total 30 progressive tasks with customized step-by-step instructions)
  const rawTasks: TutorialTask[] = [
    {
      id: 1,
      title: '🚀 Voyage of Discovery: Colonize your 2nd Station',
      shortDesc: 'Launch a Settlement Ship to habitable planetary coordinates and authorize settlement. Welcome, Commander!',
      requirementHtml: 'Acquire <strong>at least 2 colony stations</strong> under your Royal Command.',
      hint: 'First, build a Settlement Ship in your War Room (CMD tab). Then open the RDR tab to locate a green dot marked "Habitable Planet", select it, adjust your fleet deployment to include the Settlement Ship, and click "Confirm & Dispatch"! Once arrived at destination, load that planet to materialize your new colony!',
      howToGetThere: '1. Navigate to the <strong>CMD (War Room)</strong> tab.<br/>2. Locate the <strong>Settlement Ship</strong> unit and recruit 1 of them.<br/>3. Navigate to the <strong>RDR (Galaxy)</strong> view scanner.<br/>4. Locate any free green-colored <strong>Habitable Planet</strong> inside the sector.<br/>5. Click coordinate action, select <strong>"Settle on Planet"</strong>, type 1 in Settlement Ship and dispatch cargo flight!',
      commanderTip: 'Inside RDR (Galaxy) Scanner View (look for green nodes marked Habitable Planet).',
      congratsMessage: '🌟 OUTSTANDING FLIGHT TRAJECTORY, COMMANDER! You colonized a brand new sector world, establishing your secondary station and expanding your galactic footprint!',
      encouragementQuote: 'Elite stride, Admiral! Having a dual-station outpost prepares your empire for massive economy scaling and fleet deployments!',
      targetTab: 'galaxy',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 15000,
      },
    },
    {
      id: 2,
      title: '🏷️ Sovereignty Station Designation',
      shortDesc: 'Establish your grand brand across the cosmos by customizing your new station designation.',
      requirementHtml: 'Rename your colony station <strong>anything other than the default names</strong> (Colony Station, Default Base, etc.)',
      hint: 'Under the XPL (Explore) Tab, click on your station name at the top page or the "Rename Planet" button, type a majestic sovereign name of your choice, and confirm your choice design.',
      howToGetThere: '1. Navigate to the <strong>XPL (Explore)</strong> tab.<br/>2. Look closely at the top of the interface next to your station overview stats where the planet name is displayed.<br/>3. Click the <strong>pencil/edit icon</strong> or <strong>"Rename Station"</strong> button.<br/>4. Type any awesome custom name and click <strong>"Save Name"</strong>.',
      commanderTip: 'Look at the very top of the Station Overview on the XPL (Explore) Tab.',
      congratsMessage: '🏷️ MAGNIFICENT DESIGNATION CHOSEN! Your space colony station is now officially chartered under a majestic galactic name! Sovereign power represents reputation!',
      encouragementQuote: 'Brilliant! A space empire represents its leader - choose a label that sends shivers of glory down the spines of rogue pirate syndicates!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10280, plasma: 10180, fuel: 10180, food: 10180, respirant: 10180 },
        credits: 3000,
      },
    },
    {
      id: 3,
      title: '💧 Hydrothermal Water Extractor Level 2',
      shortDesc: 'Secure vital water resources to feed your station synthesis assemblies.',
      requirementHtml: 'Upgrade <strong>at least one Hydrothermal Water Pump to Level 2 or higher</strong> on your colony.',
      hint: 'Open the Explore Tab, check the list of Active Extractor Pumps, find the Hydrothermal Water Pump, and click "Upgrade Extractor" to level up!',
      howToGetThere: '1. Navigate to the <strong>Explore</strong> Tab.<br/>2. Scroll down below the active building slots list to the <strong>"RESOURCE EXTRACTOR OUTPOSTS"</strong> grid.<br/>3. Identify the <strong>💧 Hydrothermal Water Pumps</strong> section.<br/>4. Click the yellow <strong>"Upgrade Extractor"</strong> button under your first pump unit.',
      commanderTip: 'Under the Explore Tab -> Resource Extractor Outposts section.',
      congratsMessage: '💧 SPLENDID HYDRATION LOGISTICS! Your hydrothermal pumps are working beautifully, channeling vital chemical liquids straight into the reservation tanks!',
      encouragementQuote: 'Excellent design! Keeping your fluid water production on point is essential for colonist health and troop training assembly lines!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10180, plasma: 10180, fuel: 10180, food: 10180, respirant: 10280 },
        credits: 5000,
      },
    },
    {
      id: 4,
      title: '💨 Air Scrubber Oxygen Generation',
      shortDesc: 'Provide atmospheric respirant gases to enable troop quarter logistics.',
      requirementHtml: 'Upgrade <strong>at least one Air Scrubber (Respirant Siphon) to Level 2 or higher</strong>.',
      hint: 'Under the Explore Tab extractor list, scroll to finding the Air Scrubber Siphons and trigger the Level 2 constructor upgrade sequence.',
      howToGetThere: '1. Navigate to the <strong>Explore</strong> tab.<br/>2. Find the <strong>💨 Air Scrubber / Oxygen Generators</strong> under the extractor posts section.<br/>3. Confirm you have sufficient resources and click <strong>"Upgrade Extractor"</strong> on pump index 1.',
      commanderTip: 'Under the Explore Tab -> Resource Extractor Outposts grid.',
      congratsMessage: '💨 PURE OXYGEN FLOW ENHANCED! Healthy oxygen concentration levels guarantee your fabrication teams can work without heavy vacuum masks!',
      encouragementQuote: 'Marvelous efficiency, Commander! Fresh atmosphere boosts engineering productivity tenfold across your entire planetary base!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10180, plasma: 10180, fuel: 10180, food: 10280, respirant: 10180 },
        credits: 4000,
      },
    },
    {
      id: 5,
      title: '🥗 Quantum Food Bio-Synthesizer Lvl 2',
      shortDesc: 'Acknowledge nutrition requisitions by upgrading biological food harvesters.',
      requirementHtml: 'Upgrade <strong>at least one Quantum Food Synthesizer mine to Level 2 or higher</strong>.',
      hint: 'Find the Bio-Synthesizer harvester in your extractor siphons list on the Explore Tab, and click the Upgrade option.',
      howToGetThere: '1. Navigate to the <strong>Explore</strong> tab.<br/>2. Scroll down to the extractor outposts grid.<br/>3. Identify the <strong>🥗 Quantum Food Bio-Synthesizers</strong>.<br/>4. Click the yellow button marked <strong>"Upgrade Extractor"</strong>.',
      commanderTip: 'Under the Explore Tab -> Resource Extractor Outposts panel.',
      congratsMessage: '🥗 MASTER BIOLOGICAL PRODUCTION! Your organic bio-synthesizers are generating high-calorie proteic nutrients for your growing space army!',
      encouragementQuote: 'Astounding logic, Admiral! High-tier armies move on their stomachs - ensuring balanced organic rations is the mark of a master strategist!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10180, plasma: 10280, fuel: 10180, food: 10180, respirant: 10180 },
        credits: 4000,
      },
    },
    {
      id: 6,
      title: '⚡ Thermal Plasma Refinery Level 2',
      shortDesc: 'Aquire highly energetic reactors to power up defensive particle energy shields.',
      requirementHtml: 'Upgrade <strong>at least one Thermal Plasma Refinery to Level 2 or higher</strong>.',
      hint: 'Locate the Plasma Refinery extractor in your Explore Tab list and upgrade it to secure reactor fuel supplies.',
      howToGetThere: '1. Open the <strong>Explore</strong> tab.<br/>2. Look for the <strong>⚡ Thermal Plasma Refineries</strong> row in your siphons grid.<br/>3. Trigger the <strong>"Upgrade Extractor"</strong> sequence using your active resources.',
      commanderTip: 'Under the Explore Tab -> Resource Extractor Outposts.',
      congratsMessage: '⚡ THERMAL FISSION COMPLETED! High energetic reactors are successfully humming, storing concentrated plasma fuel inside core canisters!',
      encouragementQuote: 'Stellar! Plasma fuel is highly critical for running science scanners, hyperdrive thruster upgrades, and high-tech energy shield nodes!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10150, plasma: 10000, fuel: 10000, food: 10200, respirant: 10100 },
        credits: 4000,
      },
    },
    {
      id: 7,
      title: '📡 Comms Hub Activation',
      shortDesc: 'Establish orbital communications arrays to relay incoming subspace trade frequencies.',
      requirementHtml: 'Upgrade active station <strong>Comms Hub to Level 1 or higher</strong>.',
      hint: 'Upgrade Comms Hub under Base Infrastructure Buildings inside the Explore (XPL) Tab.',
      howToGetThere: '1. Navigate to the <strong>Explore</strong> tab.<br/>2. Scroll down below construction lists to find <strong>Comms Hub</strong> under infrastructure.<br/>3. Click the yellow <strong>"Upgrade Building"</strong> button to establish Level 1 relay links.',
      commanderTip: 'Explore Tab -> Base Infrastructure Buildings -> Comms Hub slot.',
      congratsMessage: '📡 COMMUNICATIONS ROUTER ACTIVE! Sub-space arrays are fully humming, tracking incoming trade and message frequencies!',
      encouragementQuote: 'Superb! An active communications hub acts as the main node for diplomatic transactions, coordinate scanning, and alliance communication portals.',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 5000,
      },
    },
    {
      id: 8,
      title: '🏦 Expand Materials Repository',
      shortDesc: 'Extend local warehouse capacities to safely store large resource reserves.',
      requirementHtml: 'Upgrade <strong>Materials Repository to Level 10 or higher</strong> on your planetary starbase.',
      hint: 'Upgrade the Materials Repository building under your Explore Tab infrastructure list.',
      howToGetThere: '1. Open the <strong>Explore</strong> tab.<br/>2. Locate the <strong>Materials Repository</strong> building slot in infrastructure grid.<br/>3. Upgrade it to Level 10 or higher (use Speed Credits to complete instantly if desired).',
      commanderTip: 'Explore Tab -> Base Infrastructure Buildings -> Materials Repository.',
      congratsMessage: '🏦 STORAGE CAPACITY EXTENDED! Heavy-duty vaults are successfully reinforced to contain massive fluid reserves without pressure failure risks!',
      encouragementQuote: 'Incredible early infrastructure development, Admiral! Larger repositories ensure you never lose passive yields during long offline cycles.',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 6000,
      },
    },
    {
      id: 9,
      title: '🤝 Dispatch Interstellar Resources',
      shortDesc: 'Transmit vital fluids directly to another commander to establish safe commerce relations.',
      requirementHtml: 'Successfully <strong>transmit resources to any other player station</strong> using the Cargo Warp Link.',
      hint: 'Under Galaxy (RDR) Tab select another player coordinates on map, click "Transmit Resources", select any amount and dispatch.',
      howToGetThere: '1. Open the <strong>Galaxy</strong> tab.<br/>2. Select another commander station node from leaderboards or coordinate scanner.<br/>3. Click <strong>"Transmit Resources"</strong> or load Cargo link.<br/>4. Select at least 1 unit of resource and click <strong>"Transmit Resource Shipment"</strong>.',
      commanderTip: 'Galaxy Tab map coordinates -> Click Player node -> Transmit Resources.',
      congratsMessage: '🤝 CARGO PORTAL ENGAGED! Resource capsules successfully warped through deep coordinates, depositing cargo straight to target reserves!',
      encouragementQuote: 'Marvelous diplomacy! Trading and cooperating with other commanders builds undying trust, ensuring mutual defensive pact support during border wars.',
      targetTab: 'galaxy',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 5000,
      },
    },
    {
      id: 10,
      title: '🛰️ Deep Space Recon Scout',
      shortDesc: 'Deploy stealth scanner drones to explore surrounding sectors and map uncharted solar anomalies.',
      requirementHtml: 'Dispatch a <strong>Recon scout mission fleet</strong> to any sector coordinate node.',
      hint: 'Train a fleet unit under CMD (Army), open Galaxy Tab scanner grid, select action on a coordinate node, set mission type to "Recon", and dispatch.',
      howToGetThere: '1. Draft a scout drone or fighter in the <strong>Army</strong> tab.<br/>2. Navigate to <strong>Galaxy</strong> view scanner.<br/>3. Click any coordinate, pick <strong>"Deploy Fleet / Settle"</strong>, change mission type to <strong>"Recon"</strong>, allocate a ship, and click Deploy.',
      commanderTip: 'Galaxy Tab -> Sector Node Coordinates -> Deploy Fleet (Set Mission: RECON).',
      congratsMessage: '🛰️ SCOUT PROBES LAUNCHED! Cloaked scouting wings successfully breached orbit, mapping coordinate structures without triggering defensive arrays!',
      encouragementQuote: 'Superb tactical wisdom! Recon scout flights reveal precise troop composition, cargo loads, and structures of foreign hostiles without triggering alert sensors!',
      targetTab: 'galaxy',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 5000,
      },
    },
    {
      id: 11,
      title: '🎯 Launch a Strike Fleet Attack',
      shortDesc: 'Launch an attack from your radar or galaxy menu on rebel pirate outposts to test weapon systems.',
      requirementHtml: 'Dispatch a <strong>strike attack fleet</strong> towards any target coordinate on the deep space radar.',
      hint: 'Under the Galaxy Tab map, seek any foreign rogue planet coordinate (or input a coordinate). Choose "Attack Planet", select at least 1 combat fighter drone, and dispatch flight travel.',
      howToGetThere: '1. Navigate to the <strong>Galaxy</strong> view tab.<br/>2. Choose any coordinate or space outpost on the map view (or input grid coordinates like X:25, Y:30).<br/>3. Click <strong>"Deploy Fleet / Attack Planet"</strong>.<br/>4. Set military action type to <strong>"Attack"</strong>, allocate combat troops (at least 1 Defender, Attacker, or Drone), and click <strong>"Confirm & Dispatch"</strong>.',
      commanderTip: 'Galaxy Tab -> Click on Sector Nodes -> Settle / Deploy Fleet command overlay.',
      congratsMessage: '🎯 TACTICAL SQUADRONS AWAY! Telemetry sensors verify military flight transponders are live en-route to their target destination coordinates!',
      encouragementQuote: 'Spectacular military initiative, General! Letting the rogue syndicates know who commands this sector is critical for border security!',
      targetTab: 'galaxy',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 7500,
      },
    },
    {
      id: 12,
      title: '🔋 Extractor Production Overdrive',
      shortDesc: 'Use your accumulated Space Gold credits to boost planetary extraction pump outputs.',
      requirementHtml: 'Activate a <strong>Production Boost overdrive</strong> on any active extractor category.',
      hint: 'Go to the Explore Tab, find the yellow button marked "BOOST PRODUCTION" above your resources list, select 1-day duration and activate the booster.',
      howToGetThere: '1. Click open the <strong>Explore</strong> tab.<br/>2. Find the yellow <strong>"BOOST PRODUCTION"</strong> button next to Resource Extractor Outposts header.<br/>3. Pick boost target (e.g. "Overdrive ALL Extractors" or a specific fluid type), select 1 Day duration, and click <strong>"Activate Boost Overdrive"</strong>.',
      commanderTip: 'Explore Tab -> "BOOST PRODUCTION" yellow button on right column.',
      congratsMessage: '🔋 OVERDRIVE SEQUENCE AUTHORIZED! Extractors are working at +14% overclocked efficiency, flooding storage vaults with resources!',
      encouragementQuote: 'Outstanding productivity tactics! Speed credits booster allows you to fast-lane resource collection for heavy shipbuilding or complex physics researches!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10291, plasma: 10302, fuel: 10302, food: 10302, respirant: 10302 },
        credits: 5000,
      },
    },
    {
      id: 13,
      title: '⚡ Dual Overdrive Mechanics',
      shortDesc: 'Activate concurrent energy boosters across multiple mine types to maximize industrial yields.',
      requirementHtml: 'Have <strong>at least two extractor types running production boosts simultaneously</strong> on your starbase.',
      hint: 'In the Explore Tab, click "Boost Production" and purchase overdrive boosts on multiple different resource types.',
      howToGetThere: '1. Navigate to the <strong>Explore</strong> tab.<br/>2. Click the yellow <strong>"BOOST PRODUCTION"</strong> console.<br/>3. Enable active overdrives on a second distinct fluid class (like Fuel, Plasma, or Respirant).',
      commanderTip: 'Explore Tab -> Boost Production -> Activate multiple concurrent category siphons.',
      congratsMessage: '⚡ DUAL SYNERGETIC BOOST ENGINES HUMMING! Multiple extractor pipelines are successfully operating at overclocked parameters!',
      encouragementQuote: 'Brilliant economics initiative, Admiral! Stacking boosters on both fuel and water guarantees heavy industry assembly lines never run dry!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 11000, plasma: 11000, fuel: 11000, food: 11000, respirant: 11000 },
        credits: 6000,
      },
    },
    {
      id: 14,
      title: '🏭 Molecular Nano-yard Assembly Upgrade',
      shortDesc: 'Upgrade your core station Fabricator building to reduce general construction times.',
      requirementHtml: 'Upgrade the <strong>Fabricator building to Level 2 or higher</strong>.',
      hint: 'Inside the Explore Tab building list, locate the Fabricator, and upgrade it to Level 2.',
      howToGetThere: '1. Navigate to the <strong>Explore</strong> tab.<br/>2. Scroll to the <strong>"BASE INFRASTRUCTURE BUILDINGS"</strong> list.<br/>3. Identify the <strong>Fabricator</strong> structure.<br/>4. Click the yellow <strong>"Upgrade Building"</strong> button (or click "Instant Complete" once queued).',
      commanderTip: 'Explore Tab -> Base Infrastructure Buildings -> Fabricator slot.',
      congratsMessage: '🏭 NANO-YARD UPGRADED! Your station Fabricator now boasts dual-assembly assembly lanes, slashing all structure upgrade times significantly!',
      encouragementQuote: 'Fabulous! Physical construction efficiency is the bedrock of rapid base development - higher fabricator levels let you expand in a flash!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10145, plasma: 10151, fuel: 10151, food: 10151, respirant: 10151 },
        credits: 6000,
      },
    },
    {
      id: 15,
      title: '📡 Construct deep-space Radar Array',
      shortDesc: 'Construct a space Radar Array to sweep surrounding lightyears for rogue pirate signals.',
      requirementHtml: 'Upgrade the <strong>Radar Array building to Level 1 or higher</strong>.',
      hint: 'In the Explore Tab buildings list, locate the Radar Array, and click Upgrade/Build.',
      howToGetThere: '1. Navigate to the <strong>Explore</strong> tab.<br/>2. Find the <strong>Radar Array</strong> building row (under base buildings grid).<br/>3. Click <strong>"Upgrade Building"</strong> to start building level 1. If queued, click ' +
        '"Instant Upgrade" using credits to finish instantly!',
      commanderTip: 'Explore Tab -> Base Infrastructure Buildings -> Radar Array.',
      congratsMessage: '📡 RADAR ARRAY OPERATIONAL! Deep-space radar scanner frequencies are active, tracking passing ships and neighboring solar grids!',
      encouragementQuote: 'Incredible early warning system! A sovereign admiral is never caught blind - keeping your radar level high maps out incoming pirate hostiles!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 5005,
      },
    },
    {
      id: 16,
      title: '🛰️ Deep Space Scan Execution',
      shortDesc: 'Use your operational Radar scanner to sweep galaxy coordinates in quest of resources.',
      requirementHtml: 'Perform a <strong>sector grid scanner scan</strong> under the Galaxy Tab.',
      hint: 'Navigate to the Galaxy Tab, check your scan coordinates, and click on scan node or search to run telemetry diagnostics.',
      howToGetThere: '1. Open the <strong>Galaxy</strong> view tab.<br/>2. Look at the **Galaxy Grid Sector Scanner** card.<br/>3. Input target coordinates or leave default, and click the blue <strong>"EXECUTE GALAXY RADAR SCAN"</strong> button.',
      commanderTip: 'Galaxy Tab -> "Galaxy Grid Sector Scanner" widget.',
      congratsMessage: '🛰️ telemetry sweep success! Scanner return file shows spatial coordinate structures mapped. anomalies are indexed!',
      encouragementQuote: 'Excellent reconnaissance! Sweeping coordinates lists let you find rogue pirate hubs, rich mineral asteroid deposits, and cargo supply drops!',
      targetTab: 'galaxy',
      rewards: {
        resources: { water: 10145, plasma: 10151, fuel: 10151, food: 10151, respirant: 10151 },
        credits: 4000,
      },
    },
    {
      id: 17,
      title: '🧪 Establish Academy Research Center',
      shortDesc: 'Build a high-energy physics Science Lab to research advanced planetary tech.',
      requirementHtml: 'Upgrade active station <strong>Research Center building to Level 1 or higher</strong>.',
      hint: 'Under the Explore Tab building slots list, locate the Research Center and upgrade/build it to level 1.',
      howToGetThere: '1. Open the <strong>Explore</strong> tab.<br/>2. Find the <strong>Research Center</strong> building card under slots array.<br/>3. Click <strong>"Upgrade Building"</strong> to establish level 1 capacity.',
      commanderTip: 'Explore Tab -> Base Infrastructure Buildings -> Research Center slot.',
      congratsMessage: '🧪 SCIENCE HUB ESTABLISHED! Physical laboratory particles are colliding nicely, ready to authorized heavy spaceship construction technology schemas!',
      encouragementQuote: 'Glorious, Admiral! A civilization without scientific research remains stuck in the stone age. Let us research higher physics next!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 13000, plasma: 14000, fuel: 15000, food: 12000, respirant: 12000 },
        credits: 8000,
      },
    },
    {
      id: 18,
      title: '🧬 Advanced Metallurgy Sciences',
      shortDesc: 'Enhance structural integrity or harvester siphons to Level 2 inside science labs.',
      requirementHtml: 'Upgrade <strong>any research technology node to Level 2 or higher</strong>.',
      hint: 'Inside the Research Tab, find any technology project you have already started and upgrade it to Level 2 or higher.',
      howToGetThere: '1. Navigate to the <strong>Research</strong> tab.<br/>2. Review started projects (e.g., Mineral Siphons, Defence Shields, Speed Thrusters).<br/>3. Ensure you have the materials and trigger <strong>"Start Quantum Research"</strong> to reach Level 2.',
      commanderTip: 'Research Tab -> Science Project Upgrades List.',
      congratsMessage: '🧬 PHYSICAL BLUEPRINTS OPTIMIZED! Permanent global technology upgrades successfully calibrated to Level 2!',
      encouragementQuote: 'Magnificent intellect! Technology upgrades offer static multipliers that make all your fleets and buildings perform better on every world.',
      targetTab: 'research',
      rewards: {
        resources: { water: 12000, plasma: 12000, fuel: 12000, food: 12000, respirant: 12000 },
        credits: 6000,
      },
    },
    {
      id: 19,
      title: '🔬 Quantum Microchips Research',
      shortDesc: 'Perform active tech development inside your science Research Center tab.',
      requirementHtml: 'Start or complete <strong>any quantum scientific technology research project</strong> inside the Research Tab.',
      hint: 'Go to Research Tab, ensure your Research Center space building is built, and authorize a technology project like "Manufacturing Speed Upgrade" or "Defense Shields".',
      howToGetThere: '1. Open the <strong>Research</strong> tab.<br/>2. Identify available techs like <strong>Defense Shields</strong> or <strong>Manufacturing Speed Upgrade</strong>.<br/>3. Click the cyan <strong>"START QUANTUM RESEARCH"</strong> button corresponding to your choice.',
      commanderTip: 'Research Tab -> Tech Nodes Grid under Research Center stats.',
      congratsMessage: '🔬 RESEARCH BLUEPRINTS LOADED! Scientists verify telemetry files are successfully running simulation algorithms inside the labs!',
      encouragementQuote: 'Truly magnificent! Science yields passive permanent boosts that affect all troop movement, defenses, and building production throughout your journey!',
      targetTab: 'research',
      rewards: {
        resources: { water: 10145, plasma: 10151, fuel: 10151, food: 10151, respirant: 10151 },
        credits: 5000,
      },
    },
    {
      id: 20,
      title: '🛡️ Army Base War Room Command',
      shortDesc: 'Set up barracks and launch coordinates decks for military defenses.',
      requirementHtml: 'Upgrade <strong>Army Base building to Level 1 or higher</strong> on your station.',
      hint: 'Locate the Army Base row in your Explore Tab buildings array, and click Upgrade/Build.',
      howToGetThere: '1. Navigate to <strong>Explore</strong> tab.<br/>2. Find the <strong>Army Base</strong> (War Room Command) slot in base buildings grid.<br/>3. Trigger the <strong>"Upgrade Building"</strong> sequence to build Level 1 barracks.',
      commanderTip: 'Explore Tab -> Base Infrastructure Buildings -> Army Base card.',
      congratsMessage: '🛡️ BARRACKS SECURED! The war command deck is fully operational, establishing local training centers for heavy interceptor troopers!',
      encouragementQuote: 'Magnificent tactical wisdom! Space is a hostile abyss - having a robust local defensive army base protects your logistics caches from raiders!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 12250, plasma: 10000, fuel: 10000, food: 13000, respirant: 11500 },
        credits: 6000,
      },
    },
    {
      id: 21,
      title: '⚔️ Mobilize local combat troops',
      shortDesc: 'Recruit at least 15 combat troops to garrison your colony shield walls.',
      requirementHtml: 'Raise a total <strong>combat troop garrison count of at least 15 units</strong> on your planet station.',
      hint: 'Open the Army Tab (must have level 1 Army Base), choose any troop types such as Interceptors or Assault Fighters, enter recruiting amounts, and click train.',
      howToGetThere: '1. Navigate to the <strong>Army</strong> tab.<br/>2. Scroll to the <strong>Troop Recruiter</strong> rows.<br/>3. Select <strong>"Interceptor Drone"</strong>, enter "15" in the quantity recruitment box, and click <strong>"Train Military Troops"</strong>.',
      commanderTip: 'Army Base Tab -> Recruit Troop Garrison console panel.',
      congratsMessage: '⚔️ TO ARMS, TROOPERS! Core garrison is fully mobilized, taking up defensive battle lines along the station hangar walls! Let them try to raid us!',
      encouragementQuote: 'Elite tactical defense, Commander! A robust standing army prevents other raiding emperors from stealing your plasma and water siphons!',
      targetTab: 'army',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 5000,
      },
    },
    {
      id: 22,
      title: '✈️ Assemble Interceptor Escorts',
      shortDesc: 'Recruit specialized atmospheric robotic fighters to guard airspace quadrants.',
      requirementHtml: 'Maintain a garrison of <strong>at least 5 Interceptor Drones (Defenders)</strong> on your active starbase.',
      hint: 'Ensure your War Room (Army Base) is Level 1, navigate to CMD (Army), input 5 or higher in the Interceptor block and click Train.',
      howToGetThere: '1. Navigate to the <strong>Army</strong> tab.<br/>2. Identify the **Interceptor Drone (Defender)** troop recruiter row.<br/>3. Input **5** or higher and select **Train Military Troops**.',
      commanderTip: 'Army Tab -> Recruit Interceptor Drones.',
      congratsMessage: '✈️ SKY DEFENSE PATROL ESTABLISHED! Robotic Interceptor systems are successfully cycling orbit grids, ready to lock onto incoming payloads!',
      encouragementQuote: 'Spectacular military safety measures, Admiral! Interceptor escorts soak up tremendous pressure, countering enemy orbital bomber strikes.',
      targetTab: 'army',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 5000,
      },
    },
    {
      id: 23,
      title: '🛸 Establish Heavy Assault Bombers',
      shortDesc: 'Assemble high-yield tactical bombers to pierce alien planetary shielding fields during sector raids.',
      requirementHtml: 'Recruit and maintain <strong>at least 2 Assault Fighters (Attackers)</strong> inside your hangar.',
      hint: 'Go to CMD (Army) Tab, look for Assault Fighter (Attacker) and initiate training of at least 2 military starfighters.',
      howToGetThere: '1. Navigate to the <strong>Army</strong> tab.<br/>2. Find the <strong>Assault Fighter (Attacker)</strong> recruit slot.<br/>3. Order a batch of **2** or more starships.',
      commanderTip: 'Army Tab -> Recruit Assault Fighters.',
      congratsMessage: '🛸 ATTACK PAYLOADS SECURED! Heavy assault bombers are fully fueled and stationed in launch bays, awaiting destination warp coordinates!',
      encouragementQuote: 'Brilliant expansion! Assault Fighters deal immense structural damage to target planetary shield grids, maximizing raider loot coefficients!',
      targetTab: 'army',
      rewards: {
        resources: { water: 12000, plasma: 12000, fuel: 12000, food: 12000, respirant: 12000 },
        credits: 6000,
      },
    },
    {
      id: 24,
      title: '💬 Interstellar Secure Private Comms',
      shortDesc: 'Send a private secure holographic message transmission directly to another player station.',
      requirementHtml: 'Send <strong>at least 1 direct PM message/transmission</strong> to any other commander.',
      hint: 'Navigate to the Sovereignty Leaderboard or Radar profiles overlay, select any commander profile name, type a message in the private text transmitter desk and click dispatch PM.',
      howToGetThere: '1. Click open the <strong>Settings (or Leaderboard)</strong> tab.<br/>2. Open the <strong>"GLOBAL COMMANDER LEADERBOARDS"</strong>.<br/>3. Click on <strong>any player\'s profile row</strong> to open HUD details.<br/>4. Type a nice greeting in the <strong>"Secure Transmission Box"</strong>, and click <strong>"SEND PRIVATE TRANSMISSION"</strong>.',
      commanderTip: 'Leaderboards / Settings Tab -> Click any Player Profile name -> Send Private PM.',
      congratsMessage: '💬 DECRPYTED MESSAGE ROUTED SUCCESSFULLY! Your holographic transmission has been successfully fired across the lightyear array to neighboring stations!',
      encouragementQuote: 'Fabulous diplomatic skill, Commander! Space communication networks let you negotiate truce pacts, commerce transactions or alliances!',
      targetTab: 'settings',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 3000,
      },
    },
    {
      id: 25,
      title: '📦 Cargo Supply Nexus Salvage Claim',
      shortDesc: 'Summon galactic logistics transport ships or unlock daily payroll supply packages.',
      requirementHtml: 'Harvest resources by calling a <strong>Supply Nexus Cargo dispatch</strong> OR claiming <strong>Daily Rewards Crates</strong>.',
      hint: 'In the Explore Tab, click on daily reward crates on your top station hub panel, or trigger a Supply Nexus cargo claim shipment (if built).',
      howToGetThere: '1. Go to the <strong>Explore</strong> tab.<br/>2. Look at the top overview card next to server hours.<br/>3. If your daily claims cooldown has ended, click <strong>"Claim Free Daily Crates"</strong>. Alternatively, find and click "Request Quantum Shipment" under your <strong>Supply Nexus</strong> building slot if level >= 1.',
      commanderTip: 'Explore Tab -> Top station hub Daily claims OR Supply Nexus row.',
      congratsMessage: '📦 CARGO DISPATCH SECURED! Logistics freighters successfully docked in the bays, delivering valuable mineral fluids to your processors!',
      encouragementQuote: 'Outstanding administrative management, Admiral! Consistently harvesting nexus drops boosts your economic upgrade rates exponentially!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 5000,
      },
    },
    {
      id: 26,
      title: '🤝 Interstellar Star Alliance Foundation',
      shortDesc: 'Unite together with other commanders by joining or creating a sovereign star alliance.',
      requirementHtml: 'Become a <strong>registered member of an Alliance sector pack</strong> (Join or Create an Alliance).',
      hint: 'Go to Leaderboards or Settings tab, find "Star Alliances Hub", pick any active alliance to apply to or create your custom alliance brand name and symbol tag.',
      howToGetThere: '1. Navigate to the <strong>Settings</strong> tab (or scroll to the bottom of the Leaderboard).<br/>2. Locate the <strong>"STAR ALLIANCES SECTOR PORTAL"</strong>.<br/>3. To join: review the list of alliances and click <strong>"Join Alliance Room"</strong>.<br/>4. To create: fill out Name, unique 3-letter Tag, Banner colors, and launch your own Alliance pact!',
      commanderTip: 'Settings Tab -> "STAR ALLIANCES SECTOR PORTAL".',
      congratsMessage: '🤝 COALITION CHARTERED! You now stand united with galactic brothers! Safe defense corridors are officially established!',
      encouragementQuote: 'Brilliant strategic move! A single twig snaps easily, but a bundle of space oak remains unbreakable. Your alliances will secure your frontiers!',
      targetTab: 'settings',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 7000,
      },
    },
    {
      id: 27,
      title: '📣 Public Holo-Chat Broadcast',
      shortDesc: 'Broadcast a friendly transmission in the public sector general channel radio chat.',
      requirementHtml: 'Type and publish <strong>at least 1 message in the public General chat</strong>.',
      hint: 'On the main general dashboard (bottom row or right sidebar of the screen), find the general Holo-Chat feed, type a nice greeting message and click Send.',
      howToGetThere: '1. Scroll to the bottom of the active game tab (the <strong>Holographic General Chat Portal</strong> is persistently loaded at the base of most screens).<br/>2. Locate the input chat box.<br/>3. Type an exciting message (e.g. "Salutations galactic commanders!") and hit the <strong>"Send Message"</strong> button.',
      commanderTip: 'Persistently loaded General Chat Portal widget at the bottom of the active screen layout.',
      congratsMessage: '📣 DEEP SPACE BROADCAST TRANSMITTED! Your planetary voice has successfully echoed across public sector radio channels!',
      encouragementQuote: 'Perfect sector social interaction! Networking with neighbors can establish peace agreements or reveal secret cooperative opportunities!',
      targetTab: 'explore',
      rewards: {
        resources: { water: 13000, plasma: 14000, fuel: 15000, food: 12000, respirant: 12000 },
        credits: 3000,
      },
    },
    {
      id: 28,
      title: '🛰️ Engine Warp Thruster Research',
      shortDesc: 'Increase thruster acceleration curves to speed up travel and strike times.',
      requirementHtml: 'Upgrade the <strong>Warp Thruster technology node</strong> to Level 1 or higher.',
      hint: 'Warp Thrusters are researched in the Research Tab. Upgrade your research building, then scroll to researchers list and click authorize on Warp cores.',
      howToGetThere: '1. Open the <strong>Research</strong> tab.<br/>2. Identify <strong>Troop & Fleet Speed Upgrade (Warp Thrusters)</strong> tech.<br/>3. Confirm you have sufficient resources and click the blue <strong>"START QUANTUM RESEARCH"</strong> button corresponding to it.',
      commanderTip: 'Research Tab -> Troops Speed & Warp Thrusters tech row.',
      congratsMessage: '🛰️ HYPER-ACCELERATION ACHIEVED! Warp cores are successfully burning, speeding up overall fleet travel and reconnaissance times across sectors!',
      encouragementQuote: 'Astonishing development, Admiral! Moving fleets at hyper-speeds ensures you catch rebels off guard and escape dangerous sector threats!',
      targetTab: 'research',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 8000,
      },
    },
    {
      id: 29,
      title: '📊 Daily Galactic Payroll Audit',
      shortDesc: 'Inspect rankings, leader positions, and Space gold logs to keep books tidy.',
      requirementHtml: 'Review your <strong>Commander summary scores</strong> on the global Leaderboard stats roster.',
      hint: 'Navigate to Settings (or Leaderboard Tab), click open Leaderboard stats, find your name, and examine your current global score, population rank, and currency.',
      howToGetThere: '1. Open the <strong>Settings</strong> tab.<br/>2. Locate the <strong>Commander Statistics Summary</strong> card.<br/>3. Review your population score (from mine upgrades), defense ratings, and space credit allocations.',
      commanderTip: 'Settings Tab or Leaderboard Profile overview section.',
      congratsMessage: '📊 SOVEREIGNDOM STATS VERIFIED! Sector audits are green, marking you as a legitimate certified emperor of space command ledger boards!',
      encouragementQuote: 'Terrific ledger discipline! A master commander must constantly calculate population sizes and credits reserves to stay ahead of the pack!',
      targetTab: 'settings',
      rewards: {
        resources: { water: 11500, plasma: 11000, fuel: 12000, food: 11500, respirant: 11000 },
        credits: 4000,
      },
    },
    {
      id: 30,
      title: '👑 Grand Sovereign Emperor System',
      shortDesc: 'Colonize your 3rd distinct planetary outpost to secure an official 3-planet cosmic system!',
      requirementHtml: 'Acquire <strong>at least 3 colonized starbase stations</strong> under your royal empire command.',
      hint: 'Produce a second Settlement Ship inside your Army barracks. Sweep the Sector radar grid inside Galaxy tab to discover a habitable star coordinate, dispatch settlement, and authorize colony designation!',
      howToGetThere: '1. Earn resources and go to <strong>Army</strong> tab.<br/>2. Draft another <strong>Settlement Ship</strong>.<br/>3. Navigate to <strong>Galaxy Tab</strong> map scan.<br/>4. Locate another green <strong>Habitable Planet</strong>, click coordinates, select <strong>"Settle on Planet"</strong>, allocate the settlement unit, and dispatch flight travel.<br/>5. Once arrived, authorize station designation!',
      commanderTip: 'Galaxy Tab -> locate a third green habitable node coordinate and settle!',
      congratsMessage: '👑 HAIL VICTORIOUS GRAND SOVEREIGN EMPEROR! You have colonized 3 unique star systems and successfully finished all aspects of space command! This sector is officially yours!',
      encouragementQuote: 'Outstanding galactic mastery, Supreme Admiral! You have successfully mastered space building, science, military troops recruitment, chat broadcasts, and alliances! Go on and rule the stars!',
      targetTab: 'galaxy',
      rewards: {
        resources: { water: 10000, plasma: 10000, fuel: 10000, food: 10000, respirant: 10000 },
        credits: 30000,
      },
    },
  ];

  const tasks: TutorialTask[] = rawTasks.map(t => {
    const custom = customTasks?.[t.id] || customTasks?.[String(t.id)];
    if (custom) {
      return {
        ...t,
        title: custom.title || t.title,
        shortDesc: custom.shortDesc || t.shortDesc,
        requirementHtml: custom.requirementHtml || t.requirementHtml,
        hint: custom.hint || t.hint,
        howToGetThere: custom.howToGetThere || t.howToGetThere,
        commanderTip: custom.commanderTip || t.commanderTip,
        congratsMessage: custom.congratsMessage || t.congratsMessage,
        encouragementQuote: custom.encouragementQuote || t.encouragementQuote,
      };
    }
    return t;
  });

  if (DEFAULT_TUTORIAL_TASKS.length === 0 && rawTasks.length > 0) {
    DEFAULT_TUTORIAL_TASKS = rawTasks;
  }

  // Tasks must be done on the player's latest planet (the last one in the planets array) and not any earlier planet
  const checkTargetPlanet = player.planets[player.planets.length - 1] || activePlanet;

  // Logic to determine if task objective is met
  const checkObjectiveMet = (task: TutorialTask): boolean => {

    switch (task.id) {
      case 1:
        return player.planets.length >= 2;
      case 2:
        const curName = checkTargetPlanet.name ? checkTargetPlanet.name.trim() : '';
        return (
          curName.length > 0 &&
          curName !== 'Colony Station' &&
          curName !== 'Default Base' &&
          curName !== 'My Home Base' &&
          curName !== 'Colony Station 1' &&
          curName !== 'Colony Station 2' &&
          curName !== 'Colony Station 3' &&
          !curName.toLowerCase().includes('new outpost')
        );
      case 3:
        return checkTargetPlanet.mines.water.some((m) => m.level >= 2);
      case 4:
        return checkTargetPlanet.mines.respirant.some((m) => m.level >= 2);
      case 5:
        return checkTargetPlanet.mines.food.some((m) => m.level >= 2);
      case 6:
        return checkTargetPlanet.mines.plasma.some((m) => m.level >= 2);
      case 7:
        return (checkTargetPlanet.buildings.commsHub?.level || 0) >= 1;
      case 8:
        return (checkTargetPlanet.buildings.repository?.level || 0) >= 10;
      case 9:
        return (
          localStorage.getItem(`moonbase_resources_sent_${player.id}`) === 'true' ||
          completedList.includes(9)
        );
      case 10:
        return (
          localStorage.getItem(`moonbase_recon_dispatched_${player.id}`) === 'true' ||
          completedList.includes(10)
        );
      case 11:
        return (
          fleets.some((f) => f.senderId === player.id && f.missionType === 'attack') ||
          localStorage.getItem(`moonbase_attack_dispatched_${player.id}`) === 'true' ||
          completedList.includes(11)
        );
      case 12:
        const isMineBoosted = Object.values(checkTargetPlanet.mines).some((minesList: any) =>
          minesList.some((m: any) => m.boostedUntil && Number(m.boostedUntil) > Date.now())
        );
        return (
          isMineBoosted ||
          localStorage.getItem(`moonbase_boosted_${player.id}`) === 'true' ||
          completedList.includes(12)
        );
      case 13:
        // Dual boosted overdrive
        const boostedCount = Object.values(checkTargetPlanet.mines).filter((minesList: any) =>
          minesList.some((m: any) => m.boostedUntil && Number(m.boostedUntil) > Date.now())
        ).length;
        return (
          boostedCount >= 2 ||
          localStorage.getItem(`moonbase_dual_boosted_${player.id}`) === 'true' ||
          completedList.includes(13)
        );
      case 14:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 2;
      case 15:
        return (checkTargetPlanet.buildings.radar?.level || 0) >= 1;
      case 16:
        return (
          localStorage.getItem(`moonbase_scan_${player.id}`) === 'true' ||
          completedList.includes(16)
        );
      case 17:
        return (checkTargetPlanet.buildings.researchCenter?.level || 0) >= 1;
      case 18:
        // Any research node level >= 2
        const hasTechLvl2Globally = player.planets.some(pl => {
          const techData = localStorage.getItem(`moonbase_tech_${player.id}_${pl.id}`);
          if (!techData) return false;
          try {
            const parsed = JSON.parse(techData);
            return Object.values(parsed).some((lvl: any) => lvl >= 2);
          } catch {
            return false;
          }
        });
        return (
          hasTechLvl2Globally ||
          localStorage.getItem(`tech_lvl2_${player.id}`) === 'true' ||
          completedList.includes(18)
        );
      case 19:
        const hasStartedResGlobally = player.planets.some(pl => localStorage.getItem(`moonbase_activeres_${player.id}_${pl.id}`) !== null);
        const hasTechResearchedGlobally = player.planets.some(pl => {
          const techData = localStorage.getItem(`moonbase_tech_${player.id}_${pl.id}`);
          if (!techData) return false;
          try {
            const parsed = JSON.parse(techData);
            return Object.values(parsed).some((lvl: any) => lvl > 0);
          } catch {
            return false;
          }
        });
        const hasResearchCenterGlobally = player.planets.some(pl => (pl.buildings.researchCenter?.level || 0) >= 1);
        return (
          hasStartedResGlobally ||
          hasTechResearchedGlobally ||
          hasResearchCenterGlobally ||
          localStorage.getItem(`moonbase_activeres_${player.id}`) === 'true' ||
          localStorage.getItem(`tech_researched_${player.id}`) === 'true' ||
          completedList.includes(19)
        );
      case 20:
        return (checkTargetPlanet.buildings.armyBase?.level || 0) >= 1;
      case 21:
        const totalCombatSquads = (player.planets || []).reduce((sum, pl) => {
          const t = pl.troops || {};
          return sum + (t.defender || 0) + (t.attacker || 0) + (t.tank || 0) + (t.looter || 0) + (t.drone || 0);
        }, 0) || (
          (activePlanet.troops?.defender || 0) +
          (activePlanet.troops?.attacker || 0) +
          (activePlanet.troops?.tank || 0) +
          (activePlanet.troops?.looter || 0) +
          (activePlanet.troops?.drone || 0)
        );
        return totalCombatSquads >= 15;
      case 22:
        return (player.planets || []).some(pl => (pl.troops?.defender || 0) >= 5) || (activePlanet.troops?.defender || 0) >= 5;
      case 23:
        return (player.planets || []).some(pl => (pl.troops?.attacker || 0) >= 2) || (activePlanet.troops?.attacker || 0) >= 2;
      case 24:
        const sentMsgLog =
          (player.commandMessages && player.commandMessages.some((m) => m.senderId === player.id)) ||
          localStorage.getItem(`moonbase_msg_sent_${player.id}`) === 'true';
        return sentMsgLog || completedList.includes(24);
      case 25:
        return (
          localStorage.getItem(`moonbase_nexus_claimed_${player.id}`) === 'true' ||
          completedList.includes(25)
        );
      case 26:
        return (
          (player.allianceId !== null && player.allianceId !== '') ||
          localStorage.getItem(`moonbase_alliance_joined_${player.id}`) === 'true' ||
          completedList.includes(26)
        );
      case 27:
        const hasChattedLog =
          chatMessages.some((msg: any) => msg.senderId === player.id) ||
          localStorage.getItem(`moonbase_chatted_${player.id}`) === 'true';
        return hasChattedLog || completedList.includes(27);
      case 28:
        return (
          localStorage.getItem(`moonbase_activeres_${player.id}`) !== null ||
          completedList.includes(28)
        );
      case 29:
        return (
          localStorage.getItem(`moonbase_payroll_checked_${player.id}`) === 'true' ||
          player.lastDailyRewardClaim !== undefined ||
          completedList.includes(29)
        );
      case 30:
        return player.planets.length >= 3;
      default:
        return false;
    }
  };

  // Find the user's current ACTIVE tutorial task (first incomplete task)
  const activeTask = tasks.find((t) => !completedList.includes(t.id));

  const maxResourceReward = activeTask 
    ? Math.max(...Object.values(activeTask.rewards.resources).map((v) => v || 0)) 
    : 0;
  const hasSiloStorageIssue = activeTask 
    ? siloCapacity < maxResourceReward 
    : false;

  // If all claims finished, proudly show completed state
  if (!activeTask) {
    return (
      <div className="bg-gradient-to-r from-emerald-950/40 to-cyan-950/30 border border-emerald-500/30 rounded-xl p-5 text-center font-mono text-slate-200 shadow-lg relative overflow-hidden transition-all duration-300 mb-6">
        <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none animate-pulse" />
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl animate-bounce">🏆</span>
          <h3 className="text-base font-black text-emerald-400 uppercase tracking-widest">
            STAR ADMIRAL ACADEMY - ALL CAMPAIGN TASKS COMPLETED!
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-1 font-sans font-normal">
            Absolute Sovereign Command established! You have mastered the star building, physics sciences, battle troop recruitment, messaging, alliances, public radio communications, and interstellar coordinate colonizations. The high command stands in total awe of your grand space empire!
          </p>
          <div className="mt-4 p-4 border border-cyan-500/30 bg-[#060B14]/80 rounded-xl space-y-4 max-w-xl text-center">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">👑 CONGRATULATIONS, GRAND COMMANDER!</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans font-normal">
              You have successfully completed all academy requirements and established absolute stellar coordination! With your defensive grid fully optimized and warp conduits operational, your dominion over the stars is sealed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button 
                type="button"
                onClick={() => setActiveTab('settings')}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold uppercase text-[10px] tracking-widest rounded-lg cursor-pointer transition duration-150 block mx-auto hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] border-0"
              >
                Open Settings & Feedback ⚡
              </button>
              <button 
                type="button"
                onClick={handlePermanentClose}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold uppercase text-[10px] tracking-widest rounded-lg cursor-pointer transition duration-150 block mx-auto hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] border-0"
              >
                Complete & Permanently Close ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMet = checkObjectiveMet(activeTask);

  const handleClaimReward = async (taskId: number) => {
    setClaimingId(taskId);
    try {
      const res = await fetch('/api/tutorial/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id,
        },
        body: JSON.stringify({ taskId, planetId: activePlanet.id, allowOverflow }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Academy campaign tasks rewards claimed!', 'success');
        setIsHowToOpen(false); // reset expandable accordion
        onRefreshState();
      } else {
        showToast(data.error || 'Failed to claim reward.', 'error');
      }
    } catch (err) {
      showToast('Quantum network latency detected. Try again.', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const getRewardLabel = (resType: ResourceType) => {
    switch (resType) {
      case 'water':
        return '💧 Ice Water';
      case 'plasma':
        return '⚡ Plasma Core';
      case 'fuel':
        return '🔥 Deuterium Fuel';
      case 'food':
        return '🥗 Proteic Food';
      case 'respirant':
        return '💨 Oxygen O2';
      default:
        return resType;
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#0F172A] to-[#020617] border border-cyan-500/20 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.05)] overflow-hidden font-mono mb-6 transition-all duration-300">
      {/* Header bar */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-5 py-4 bg-[#0A0F1D]/80 backdrop-blur-md flex justify-between items-center bg-black/30 border-b border-[#1E293B]/60 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <span className="text-base animate-pulse">🎓</span>
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-[#5bc0be] uppercase tracking-wider block">
              STATION ROADMAP & CAMPAIGN
            </span>
            <h2 className="text-xs font-bold text-slate-150 uppercase tracking-tight flex items-center gap-1.5 leading-none mt-0.5">
              Commander Academy: Task {activeTask.id}
            </h2>
          </div>
        </div>

        {/* ProgressBar */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <div className="text-right text-[10px] text-slate-400">
            {completedList.length} Claims Complete
          </div>
          <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_6px_#06b6d4] transition-all duration-300"
              style={{ width: `${(completedList.length / tasks.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Collapsible Trigger */}
        <div
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all duration-200 rounded-lg cursor-pointer flex items-center ml-4 ${
            isCollapsed
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-extrabold hover:shadow-[0_0_12px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95'
              : 'bg-gradient-to-r from-amber-500 to-rose-600 text-white font-extrabold hover:shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:scale-105 active:scale-95'
          }`}
        >
          {isCollapsed ? 'Expand Guide' : 'Minimize'}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-[#0A0F1D]/50"
          >
            <div className="p-5 flex flex-col md:flex-row gap-5">
              {/* Task Detail and Instructions */}
              <div className="flex-1 text-left space-y-3">
                
                {/* Optional Welcome Banner overlaying Task 1 */}
                {activeTask.id === 1 && !isWelcomeClosed && (
                  <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-cyan-950/70 to-indigo-950/50 border border-cyan-500/30 text-left relative pr-10">
                    <button
                      type="button"
                      onClick={handleCloseWelcome}
                      className="absolute top-3 right-3 text-slate-400 hover:text-white transition duration-150 text-xs font-bold cursor-pointer"
                      title="Dismiss welcome message"
                    >
                      ✕
                    </button>
                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                      <span>✨ WELCOME STATION COMMANDER!</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Rule the stars! We have configured an epic progressive training program to walk you through the core of your empire's assembly lines, science labs, fleet transponders, text DMs, public chat, and outer coordinate expansions. Grab materials and free **Speed Credits** for each task claim!
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 rounded-full p-0.5 flex shrink-0 items-center justify-center ${isMet ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-300 animate-pulse'}`}>
                     <span className="text-sm">{isMet ? '✓' : '●'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-wider">ACTIVE MISSION STATUS:</span>
                    <h3 className="text-sm font-bold text-slate-200">
                      {activeTask.title}
                    </h3>
                    {activeTask.id > 1 && activeTask.id < 30 && (
                      <div className="my-1.5 px-2.5 py-1 text-[10px] bg-sky-500/15 text-sky-300 border border-sky-500/20 rounded-lg inline-flex items-center gap-1.5 font-bold uppercase tracking-wider animate-pulse">
                        <span>📡 TARGET STATION: LATEST COLONY ({checkTargetPlanet.name})</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      {activeTask.shortDesc}
                    </p>
                  </div>
                </div>

                {/* Requirement Met Banner */}
                {isMet ? (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-emerald-900/10 border border-emerald-500/40 text-left space-y-1 animate-pulse">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block">🌟 TASK TARGET MET SUCCESSFULLY!</span>
                    <p className="text-xs text-slate-100 leading-relaxed font-sans font-bold">
                      {activeTask.congratsMessage}
                    </p>
                    <p className="text-xs text-slate-350 italic text-[#a3f7bf]/80 mt-1">
                      "{activeTask.encouragementQuote}"
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#05070A] border border-[#1E293B]/80 text-[11.5px] leading-relaxed space-y-3">
                    <div className="mb-1 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/25">
                      <span className="text-[10.5px] font-black tracking-wider text-amber-400 block mb-1 uppercase bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20 w-fit">
                        🚨 OBJECTIVE REQUIREMENT:
                      </span>
                      <span className="font-bold text-white text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: activeTask.requirementHtml }} />
                    </div>
                    <div className="p-2.5 rounded-lg bg-pink-500/5 border border-pink-500/25">
                      <span className="text-[10.5px] font-black tracking-wider text-pink-400 block mb-1 uppercase bg-pink-400/10 px-2.5 py-0.5 rounded border border-pink-400/20 w-fit">
                        💡 HINT GUIDE:
                      </span>
                      <p className="font-semibold text-slate-200 text-xs leading-relaxed">{activeTask.hint}</p>
                    </div>
                  </div>
                )}

                {/* Expandable "how to get there" next to navigate button */}
                <div className="p-3.5 rounded-xl bg-[#030712] border border-slate-800/60 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab(activeTask.targetTab)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-950/90 to-cyan-900/80 hover:brightness-110 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5"
                    >
                      🚀 NAVIGATE TO {activeTask.targetTab === 'explore' ? 'XPL' : activeTask.targetTab === 'army' ? 'CMD' : activeTask.targetTab === 'galaxy' ? 'RDR' : activeTask.targetTab === 'research' ? 'Res' : 'SETTINGS'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsHowToOpen(!isHowToOpen)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-705 border-slate-700/80 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isHowToOpen ? '▼ HIDE INSTRUCTIONS' : '▶ HOW TO GET THERE'}
                    </button>
                  </div>

                  {/* Accordion panel for instructions */}
                  <AnimatePresence>
                    {isHowToOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-350 space-y-1.5 leading-relaxed text-left">
                          <span className="text-[9px] uppercase font-bold text-sky-400 block tracking-wider">Step-by-Step Instructions:</span>
                          <p dangerouslySetInnerHTML={{ __html: activeTask.howToGetThere }} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Commander TIP Area stating exact coordinates / how to locate */}
                <div className="p-3 rounded-lg bg-[#060813]/60 border border-slate-800/60 text-[10px] leading-relaxed">
                  <span className="text-[9px] uppercase font-bold text-amber-500/90 block mb-0.5 tracking-wide">COMMANDER TIP / LOCATION:</span>
                  <p className="text-slate-400">{activeTask.commanderTip}</p>
                </div>

              </div>

              {/* Rewards Box */}
              <div className="w-full md:w-64 bg-[#05070A] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shrink-0">
                <div className="text-left">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-2 tracking-widest">
                    MISSION REWARDS
                  </span>
                  
                  {/* Resource listing chips */}
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(activeTask.rewards.resources).map(([res, amount]) => (
                      <div key={res} className="flex justify-between items-center text-[10px] px-2 py-1 rounded bg-[#090D1A] border border-white/[0.02]">
                        <span className="text-slate-400">{getRewardLabel(res as ResourceType)}</span>
                        <span className="font-bold text-cyan-400">+{amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-[10px] px-2 py-1 rounded bg-[#090D1A] border border-[#06b6d4]/10">
                      <span className="text-amber-400">🪙 Speed Credits</span>
                      <span className="font-black text-amber-400">+{activeTask.rewards.credits.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                 {/* Silo Capacity warning */}
                {hasSiloStorageIssue && (
                  <div className="mt-3 p-3 rounded-lg bg-orange-950/20 border border-orange-500/30 text-left text-[10px] leading-relaxed animate-pulse">
                    <span className="font-extrabold text-orange-400 block uppercase tracking-wide">⚠️ STORAGE SATURATION CAUTION</span>
                    <p className="mt-1 text-slate-300 font-sans font-normal">
                      Your Silo capacity (<span className="font-mono font-bold text-white">{siloCapacity.toLocaleString()}</span> units) is lower than this task's maximum reward (<span className="font-mono font-bold text-white">{maxResourceReward.toLocaleString()}</span> units). Claiming now will top off resources to maximum limit.
                      Upgrade your <span className="font-bold text-amber-300">Silo (Repository)</span> inside your active colony to fully capture all spills without waste!
                    </p>
                    <label className="flex items-center gap-2 mt-2.5 p-2 bg-slate-950/60 border border-[#1E293B]/60 rounded-lg cursor-pointer text-[10px] select-none font-bold text-cyan-300">
                      <input 
                        type="checkbox" 
                        checked={allowOverflow} 
                        onChange={(e) => setAllowOverflow(e.target.checked)}
                        className="accent-cyan-500 rounded cursor-pointer"
                      />
                      <span>Let resources overflow (bypass Silo limits)</span>
                    </label>
                  </div>
                )}

                {/* Claim Button */}
                <div className="mt-4 pt-3 border-t border-[#1E293B]/60">
                  {isMet ? (
                    <button
                      type="button"
                      disabled={claimingId !== null}
                      onClick={() => handleClaimReward(activeTask.id)}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-98 text-slate-900 font-extrabold rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] border-0"
                    >
                      {claimingId ? 'CLAIMING CRATES...' : '🎁 CLAIM ACADEMY REWARD'}
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center rounded-lg bg-slate-900 border border-[#1E293B] text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      ● UNDERWAY
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
