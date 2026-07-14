const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'CommanderTutorial.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Identify start and end of rawTasks array
const startRawTasksMarker = '  const rawTasks: TutorialTask[] = [';
const endRawTasksMarker = '  ];\n\n  const tasks: TutorialTask[] = rawTasks.map(t => {';

const startIndex = content.indexOf(startRawTasksMarker);
if (startIndex === -1) {
  console.error("Could not find start rawTasks marker!");
  process.exit(1);
}

const endIndex = content.indexOf(endRawTasksMarker, startIndex);
if (endIndex === -1) {
  console.error("Could not find end rawTasks marker!");
  process.exit(1);
}

const newRawTasksContent = `  const rawTasks: TutorialTask[] = [
    {
      id: 1,
      title: '🏭 Upgrade Fabricator to Level 1',
      shortDesc: 'Construct or upgrade your main station Fabricator to Level 1 to unlock basic building operations.',
      requirementHtml: 'Have a <strong>Fabricator at Level 1 or higher</strong>.',
      hint: 'Go to the XPL tab, find the Fabricator under Base Infrastructure Buildings, and click Upgrade.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Find the <strong>Fabricator</strong> in the Base Infrastructure Buildings list.<br/>3. Click <strong>"Upgrade Building"</strong> to start construction.',
      commanderTip: 'The Fabricator is the only building you can build with Level 0 mines. Build it first!',
      congratsMessage: '🏭 FABRICATOR LEVEL 1 REINFORCED! Your assembly grid is online, unlocking more complex planetary infrastructure projects!',
      encouragementQuote: 'Excellent work, Admiral. The Fabricator is the cornerstone of all base constructions and heavy machinery setups.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 2,
      title: '🏗️ Construct All Resource Extractors',
      shortDesc: 'With a Level 1 Fabricator, you can now construct your resource extractors. Construct at least one of each type.',
      requirementHtml: 'Construct <strong>all 5 resource extractor outposts</strong> (Water, Plasma, Fuel, Food, and Respirant) to Level 1 or higher.',
      hint: 'Go to the XPL tab, scroll to Resource Extractor Outposts, and click Construct Extractor on every resource type with level 0.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Scroll down to <strong>"RESOURCE EXTRACTOR OUTPOSTS"</strong>.<br/>3. Click <strong>"Construct Extractor"</strong> on all 5 types of pumps (Water, Plasma, Fuel, Food, Respirant).',
      commanderTip: 'Ensure each resource type has at least one active, level 1 or higher extractor.',
      congratsMessage: '🏗️ EXTRACTOR ARRAYS ACTIVE! Your station is now continuously harvesting vital liquids, gases, and organic materials.',
      encouragementQuote: 'Brilliant! Now your station is self-sufficient with constant resource yields flowing directly into your silo reserves.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 3,
      title: '📡 Establish Communications Hub Level 1',
      shortDesc: 'Build a Communication Hub to interface with the galactic network.',
      requirementHtml: 'Construct or upgrade your <strong>Communications Hub to Level 1 or higher</strong>.',
      hint: 'Under the XPL tab, find the Communications Hub in the Infrastructure list and upgrade it.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Scroll to the Base Infrastructure Buildings list.<br/>3. Select <strong>Communications Hub</strong> and click <strong>"Upgrade Building"</strong>.',
      commanderTip: 'Connecting to orbital frequencies allows subspace coordinate analysis and chat communications.',
      congratsMessage: '📡 COMMUNICATION LINK ESTABLISHED! Subspace frequencies are online, scanning for signals and connection points.',
      encouragementQuote: 'A great commander knows communication is key. Your communications grid is now ready to receive external transmissions.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 4,
      title: '📦 Construct Repository (Silo) Level 1',
      shortDesc: 'Build a Repository to store raw materials harvested by extractor pumps.',
      requirementHtml: 'Construct or upgrade your <strong>Repository (Silo) to Level 1 or higher</strong>.',
      hint: 'Find the Repository building under Infrastructure inside the XPL tab and start construction.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Find the <strong>Repository (Silo)</strong> under Base Infrastructure Buildings.<br/>3. Click <strong>"Upgrade Building"</strong> to establish physical storage tanks.',
      commanderTip: 'Silos prevent passive extraction wastage by keeping high reserve caps.',
      congratsMessage: '📦 STORAGE VAULTS READY! Your Silo capacity has expanded, offering secure chambers for extra fluid yields.',
      encouragementQuote: 'Perfect! Always keep an eye on your storage limit so your extractor siphons don\\\'t saturate and waste energy.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 5,
      title: '🏭 Upgrade Fabricator to Level 2',
      shortDesc: 'Bring the Fabricator to Level 2 to unlock radar sensor blueprints.',
      requirementHtml: 'Upgrade active <strong>Fabricator to Level 2 or higher</strong>.',
      hint: 'Go to the XPL tab, find the Fabricator, and upgrade it to Level 2.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Find the <strong>Fabricator</strong> and trigger its Level 2 upgrade sequence.',
      commanderTip: 'Upgrading the Fabricator unlocks advanced facility options like the Radar Array!',
      congratsMessage: '🏭 FABRICATOR POWER UPGRADE! Level 2 nanite printers are online, allowing production of complex tactical sensors!',
      encouragementQuote: 'Superb! A level 2 Fabricator brings us one step closer to scanning deep space.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 6,
      title: '🛰️ Construct Radar Array Level 1',
      shortDesc: 'Construct a Radar Array to scan neighboring coordinates for habitable planets.',
      requirementHtml: 'Construct or upgrade your <strong>Radar Array to Level 1 or higher</strong>.',
      hint: 'Under the XPL tab infrastructure, locate the Radar Array and upgrade it.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Scroll down to Base Infrastructure Buildings.<br/>3. Locate the <strong>Radar Array</strong> and click <strong>"Upgrade Building"</strong>.',
      commanderTip: 'Radar scanning is necessary to locate other stations and uncharted habitable worlds.',
      congratsMessage: '🛰️ DEEP SPACE RADAR OPERATIONAL! High-gain antennae are active, sending sweeping beams across unexplored galaxy coordinates.',
      encouragementQuote: 'Excellent. Let\\\'s use our newly constructed radar arrays to map out the surrounding galaxy sector.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 7,
      title: '🌌 Execute Galaxy Radar Scan',
      shortDesc: 'Initiate a deep coordinate scan in the Galaxy tab to find viable travel destinations.',
      requirementHtml: 'Perform at least <strong>one Galaxy Radar Scan</strong>.',
      hint: 'Go to the GLXY tab, find the Radar Scan control panel on the right, and trigger a sector scan.',
      howToGetThere: '1. Go to the <strong>GLXY</strong> tab.<br/>2. Locate the <strong>"Deep Radar Sweep"</strong> dashboard panel.<br/>3. Click <strong>"Execute Sweep"</strong> to scan nearby space zones.',
      commanderTip: 'A radar sweep maps out the coordinates of active empires, habitable anomalies, and AI threats.',
      congratsMessage: '🌌 SCAN COMPLETED! Deep-space coordinates have been successfully synced with your navigational computers!',
      encouragementQuote: 'Magnificent scan resolution! We now have accurate telemetry data on surrounding sectors.',
      targetTab: 'galaxy',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 8,
      title: '📈 Upgrade All Resource Extractors to Level 2',
      shortDesc: 'Upgrade all 5 of your resource pumps to Level 2 to boost your base production.',
      requirementHtml: 'Have <strong>at least one Level 2 or higher extractor</strong> for all 5 resources.',
      hint: 'Go to XPL, find each pump type, and click Upgrade Extractor.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Look for Water, Plasma, Fuel, Food, and Respirant extractors.<br/>3. Click <strong>"Upgrade Extractor"</strong> on all 5 to level them up to Level 2.',
      commanderTip: 'Upgraded pumps scale passive income, fueling expensive infrastructure.',
      congratsMessage: '📈 SYSTEM-WIDE UPGRADE COMPLETE! Your extraction rate has doubled across all major resources.',
      encouragementQuote: 'Incredible development! Higher resource output keeps our expansion plans completely on schedule.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 9,
      title: '🏭 Upgrade Fabricator to Level 3',
      shortDesc: 'Bring the Fabricator to Level 3 to speed up construction processes.',
      requirementHtml: 'Upgrade active <strong>Fabricator to Level 3 or higher</strong>.',
      hint: 'Locate the Fabricator in XPL and trigger the upgrade.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Click <strong>"Upgrade Building"</strong> on the Fabricator to raise it to Level 3.',
      commanderTip: 'Each Fabricator level increases build speeds for all other facilities.',
      congratsMessage: '🏭 FABRICATOR LEVEL 3 SECURED! Nanite assembly speeds have increased across all projects!',
      encouragementQuote: 'Superb pacing! Fast builders mean we can establish our galactic footprint much faster.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 10,
      title: '🏭 Upgrade Fabricator to Level 4',
      shortDesc: 'Upgrade your Fabricator to Level 4 to unlock the Research Center.',
      requirementHtml: 'Upgrade active <strong>Fabricator to Level 4 or higher</strong>.',
      hint: 'Trigger the Level 4 upgrade on your Fabricator building.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Find the <strong>Fabricator</strong> under infrastructure.',
      commanderTip: 'Level 4 is the crucial threshold needed to construct advanced Science Laboratories!',
      congratsMessage: '🏭 FABRICATOR LEVEL 4 UNLOCKED! You can now print advanced scientific structures!',
      encouragementQuote: 'Outstanding! The path to advanced science and high-speed research projects is now officially open.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 11,
      title: '🔬 Construct Research Center Level 1',
      shortDesc: 'Build a Research Center to start developing advanced space technologies.',
      requirementHtml: 'Construct or upgrade your <strong>Research Center to Level 1 or higher</strong>.',
      hint: 'Now that Fabricator is Level 4, go to XPL and construct the Research Center.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Scroll down to infrastructure buildings.<br/>3. Select <strong>Research Center</strong> and click <strong>"Upgrade Building"</strong>.',
      commanderTip: 'Research Centers allow your scientists to work on shield tech, speed upgrades, and more!',
      congratsMessage: '🔬 RESEARCH LAB ACTIVE! Your scientific staff are now standing by for technology assignments.',
      encouragementQuote: 'Marvelous! Science is the ultimate equalizer in the deep void of space.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 12,
      title: '🧪 Start a Science Research Project',
      shortDesc: 'Direct your research staff to start any technology development in the Labs.',
      requirementHtml: 'Initialize at least <strong>one science research project</strong>.',
      hint: 'Go to the RES tab, choose any technology project (e.g., Warp Thrusters), and click Start Research.',
      howToGetThere: '1. Open the <strong>RES</strong> tab.<br/>2. Select any technology blueprint.<br/>3. Click <strong>"Start Research Project"</strong> to allocate resources.',
      commanderTip: 'Keep your labs active at all times to continually upgrade your military and industrial capabilities.',
      congratsMessage: '🧪 BLUEPRINT CODING INITIALIZED! Your scientists are running simulation models on the selected tech.',
      encouragementQuote: 'Great start! Tech development yields permanent passive buffs for your entire starbase fleet.',
      targetTab: 'research',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 13,
      title: '🏃‍♂️ Research: Warp Thrusters Level 1',
      shortDesc: 'Complete Level 1 of Warp Thrusters (Troops Speed Upgrade) in your Research Center.',
      requirementHtml: 'Research <strong>Troops Speed Upgrade to Level 1 or higher</strong>.',
      hint: 'Go to the RES tab, locate "Troops Speed Upgrade", and research it.',
      howToGetThere: '1. Go to the <strong>RES</strong> tab.<br/>2. Locate the <strong>Troops Speed Upgrade</strong> node.<br/>3. Trigger the upgrade using Water, Plasma, and Fuel.',
      commanderTip: 'Warp Thrusters increase travel velocities, shortening galaxy travel times.',
      congratsMessage: '🏃‍♂️ WARP THRUSTERS LEVEL 1 DEVELOPED! Fleet travel times have been successfully reduced!',
      encouragementQuote: 'Amazing science coordination! Faster flight plans mean more rapid response times across our colonies.',
      targetTab: 'research',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 14,
      title: '🔬 Upgrade Research Center to Level 2',
      shortDesc: 'Upgrade your Research Center to Level 2 to unlock advanced research levels.',
      requirementHtml: 'Upgrade active <strong>Research Center to Level 2 or higher</strong>.',
      hint: 'Find the Research Center in XPL and click Upgrade.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Locate the <strong>Research Center</strong> building.<br/>3. Upgrade it to Level 2.',
      commanderTip: 'Upgraded laboratories reduce research durations and enable advanced tech tiers.',
      congratsMessage: '🔬 LABS UPGRADED! Your scientists have access to brand new high-precision testing chambers.',
      encouragementQuote: 'Outstanding! Higher-level laboratories accelerate our path to top-tier defensive shields.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 15,
      title: '🛡️ Research: Defense Shields Level 2',
      shortDesc: 'Develop Level 2 Defense Shields to secure your colony from orbital raids.',
      requirementHtml: 'Research <strong>Defense Shields to Level 2 or higher</strong>.',
      hint: 'Navigate to the RES tab, select Defense Shields, and upgrade it to Level 2.',
      howToGetThere: '1. Open the <strong>RES</strong> tab.<br/>2. Find the <strong>Defense Shields</strong> technology node.<br/>3. Research it to Level 2.',
      commanderTip: 'Shield systems add direct defensive HP boosts to your stationary fleet units.',
      congratsMessage: '🛡️ PLASMA SHIELD FREQUENCIES RECALIBRATED! Defensive grid HP has successfully scaled!',
      encouragementQuote: 'Strategic foresight, Admiral. Strong deflector shields guarantee safety from aggressive hostile maneuvers.',
      targetTab: 'research',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 16,
      title: '📈 Upgrade All Resource Extractors to Level 3',
      shortDesc: 'Upgrade all 5 of your resource pumps to Level 3 to satisfy advanced raw material requirements.',
      requirementHtml: 'Have <strong>at least one Level 3 or higher extractor</strong> for all 5 resources.',
      hint: 'Under XPL, click Upgrade Extractor on all five resource outpost nodes.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Locate Water, Plasma, Fuel, Food, and Respirant extractors.<br/>3. Upgrade each pump to Level 3.',
      commanderTip: 'As facilities grow, basic upkeep and building costs require high-yield extraction streams.',
      congratsMessage: '📈 HIGH-YIELD PRODUCTION SECURED! Energy siphons are operating at optimal industrial speeds!',
      encouragementQuote: 'Incredible work scaling our colony\\\'s resource supply lines. We now have the economy to back high-tier facilities.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 17,
      title: '🏭 Upgrade Fabricator to Level 5',
      shortDesc: 'Construct the Level 5 Fabricator to expand your structural replication blueprints.',
      requirementHtml: 'Upgrade active <strong>Fabricator to Level 5 or higher</strong>.',
      hint: 'Find the Fabricator in XPL and click Upgrade.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Initiate the Level 5 construction sequence on your Fabricator.',
      commanderTip: 'Fabricator Level 5 prints heavier steel components, reducing base building latency.',
      congratsMessage: '🏭 FABRICATOR LEVEL 5 REINFORCED! Automated pipeline velocities have scaled!',
      encouragementQuote: 'Excellent. Accelerating base build speed allows us to scale construction velocities efficiently.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 18,
      title: '🏭 Upgrade Fabricator to Level 6',
      shortDesc: 'Upgrade your Fabricator to Level 6 to prepare for military shipyard setups.',
      requirementHtml: 'Upgrade active <strong>Fabricator to Level 6 or higher</strong>.',
      hint: 'Initiate the Level 6 construction upgrade on your Fabricator inside the XPL tab.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Trigger the Level 6 upgrade on the Fabricator.',
      commanderTip: 'Level 7 Fabricator is required to unlock the War Room / Army Base, so get to Level 6 first!',
      congratsMessage: '🏭 FABRICATOR LEVEL 6 READY! Heavy industrial plating printers are fully calibrated.',
      encouragementQuote: 'Outstanding! We are almost ready to establish a permanent military shipyard and command deck.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 19,
      title: '🏭 Upgrade Fabricator to Level 7',
      shortDesc: 'Upgrade your Fabricator to Level 7 to unlock the War Room (Army Base).',
      requirementHtml: 'Upgrade active <strong>Fabricator to Level 7 or higher</strong>.',
      hint: 'Bring your Fabricator to Level 7 to unlock military starship construction.',
      howToGetThere: '1. Navigate to the <strong>XPL</strong> tab.<br/>2. Trigger the Level 7 Fabricator upgrade.',
      commanderTip: 'Fabricator Level 7 unlocks the Army Base (War Room) where you can build warships!',
      congratsMessage: '🏭 FABRICATOR LEVEL 7 UNLOCKED! Military blueprints have been uploaded to your station mainframe!',
      encouragementQuote: 'Sensational! A powerful empire needs a powerful fleet. Let\\\'s build the War Room.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 20,
      title: '⚔️ Construct War Room (Army Base) Level 1',
      shortDesc: 'Construct the Army Base (War Room) to command and train defensive and offensive squadrons.',
      requirementHtml: 'Construct or upgrade your <strong>War Room (Army Base) to Level 1 or higher</strong>.',
      hint: 'Under the XPL tab, locate the Army Base building slot and start construction.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Find <strong>Army Base (War Room)</strong> under infrastructure buildings.<br/>3. Click <strong>"Upgrade Building"</strong> to establish the command deck.',
      commanderTip: 'The War Room allows training Interceptors, Drones, and Settlement Ships.',
      congratsMessage: '⚔️ WAR ROOM ONLINE! High-ranking tactical officers have boarded, activating the planetary defense grid!',
      encouragementQuote: 'Magnificent! With our command deck ready, we can now assemble an interplanetary strike force.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 21,
      title: '🛸 Recruit Interceptors (10+)',
      shortDesc: 'Train Interceptors inside your newly constructed War Room to defend your colony from planetary raids.',
      requirementHtml: 'Have <strong>at least 10 active Interceptors</strong> in your fleet.',
      hint: 'Go to the CMD tab, find Interceptors, and train at least 10.',
      howToGetThere: '1. Go to the <strong>CMD</strong> tab.<br/>2. Select the <strong>Interceptor</strong> card.<br/>3. Recruit a total of 10 or more Interceptors.',
      commanderTip: 'Interceptors are rapid-fire spacecrafts that defend your colony during incoming hostile attacks.',
      congratsMessage: '🛸 DEFENSE SQUADRON DEPLOYED! 10 active Interceptors are patrolling the orbit!',
      encouragementQuote: 'Strategic defense is outstanding, Commander. Your base is now secure from rogue raiders.',
      targetTab: 'command',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 22,
      title: '🚀 Recruit Assault Drones (10+)',
      shortDesc: 'Assemble high-firepower Assault Drones to deliver severe kinetic bombardments on rival sectors.',
      requirementHtml: 'Have <strong>at least 10 active Assault Drones</strong> in your fleet.',
      hint: 'Go to the CMD tab, locate Assault Drones, and construct at least 10.',
      howToGetThere: '1. Open the <strong>CMD</strong> tab.<br/>2. Scroll to the <strong>Assault Drone</strong> card.<br/>3. Manufacture at least 10 strike drone units.',
      commanderTip: 'Assault Drones have lower shields but deliver massive offensive kinetic energy.',
      congratsMessage: '🚀 STRIKE FLEET ASSEMBLED! Your Assault Drones are docked in active hangar ports, primed for combat.',
      encouragementQuote: 'Excellent force projection! A strong offensive fleet is the ultimate deterrent in deep space.',
      targetTab: 'command',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 23,
      title: '🤝 Join or Create a Galactic Alliance',
      shortDesc: 'Establish mutual security pacts by joining an existing alliance or founding a new one.',
      requirementHtml: 'Successfully <strong>join or create an alliance</strong>.',
      hint: 'Go to the COMMS tab, navigate to the Alliance section, and join or create one.',
      howToGetThere: '1. Open the <strong>COMMS</strong> tab.<br/>2. Find the <strong>Alliance</strong> board panel.<br/>3. Enter an alliance name to create one, or click <strong>"Join"</strong> on an active alliance.',
      commanderTip: 'Alliances protect you from raids and offer coordinated support from other players.',
      congratsMessage: '🤝 ALLIANCE CHANNELS AUTHORIZED! Your faction is now part of an interplanetary coalition.',
      encouragementQuote: 'Superb diplomacy! Together, our forces will command supreme authority over the galactic quadrants.',
      targetTab: 'communications',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 24,
      title: '💬 Broadcast in Public Holo-Chat',
      shortDesc: 'Send a subspace audio-visual signal to the global public feed to announce your presence.',
      requirementHtml: 'Send at least <strong>one public chat message</strong>.',
      hint: 'Go to the COMMS tab, open Public Chat, type a greeting, and click Send.',
      howToGetThere: '1. Navigate to the <strong>COMMS</strong> tab.<br/>2. Type a message in the <strong>Public Holo-Chat</strong> input field.<br/>3. Click <strong>"Transmit Signal"</strong> to broadcast.',
      commanderTip: 'Keep communication friendly and build trade connections with nearby commanders.',
      congratsMessage: '💬 BROADCAST RELAY COMPLETE! Your coordinate message has been received across the quadrant!',
      encouragementQuote: 'Marvelous signal strength! Communicating with nearby commanders establishes your sector presence.',
      targetTab: 'communications',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 25,
      title: '📬 Send a Private Message Transmission',
      shortDesc: 'Send a secure direct message to another Commander coordinates to coordinate tactical movements.',
      requirementHtml: 'Successfully <strong>send a private message transmission</strong>.',
      hint: 'Go to the GLXY tab, click another player\'s coordinates, click "Send Message", write your text, and submit.',
      howToGetThere: '1. Open the <strong>GLXY</strong> tab.<br/>2. Select any active player node on the map.<br/>3. Click <strong>"Send Message"</strong>.<br/>4. Compose your transmission and click <strong>"Send"</strong>.',
      commanderTip: 'Private transmissions are completely secret, perfect for alliance coordinates planning.',
      congratsMessage: '📬 TRANSMISSION SENT! The target commander\'s communications array has accepted your secure packet!',
      encouragementQuote: 'Sublime tactical coordination. Maintaining direct diplomatic links is key to victory.',
      targetTab: 'galaxy',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 26,
      title: '📦 Upgrade Silo (Repository) to Level 5',
      shortDesc: 'Scale your storage capacity to Level 5 to accommodate high-volume resource mining.',
      requirementHtml: 'Upgrade active <strong>Repository (Silo) to Level 5 or higher</strong>.',
      hint: 'Under XPL, select your Silo building and upgrade it to Level 5.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Find the <strong>Repository (Silo)</strong> under Infrastructure Buildings.<br/>3. Upgrade it to Level 5.',
      commanderTip: 'A level 5 silo ensures high material storage, paving the way for maximum level fabricators.',
      congratsMessage: '📦 COLD STORAGE DEPOTS REINFORCED! Silo capacity has expanded to accommodate massive reserves.',
      encouragementQuote: 'Excellent base management. Your high storage capacity prevents mining loss during idle hours.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 27,
      title: '🏭 Upgrade Fabricator to Level 8',
      shortDesc: 'Upgrade your Fabricator to Level 8 to unlock highly precise nanite printing pipelines.',
      requirementHtml: 'Upgrade active <strong>Fabricator to Level 8 or higher</strong>.',
      hint: 'Trigger the Level 8 upgrade on your Fabricator building under XPL.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Upgrade the <strong>Fabricator</strong> to Level 8.',
      commanderTip: 'High-level fabricators drastically speed up expensive base structures.',
      congratsMessage: '🏭 FABRICATOR LEVEL 8 ONLINE! Nano-assembler throughput has been upgraded.',
      encouragementQuote: 'Excellent. Accelerating base build speed allows us to scale construction velocities efficiently.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 28,
      title: '🏭 Upgrade Fabricator to Level 9',
      shortDesc: 'Upgrade your Fabricator to Level 9 to prepare for the ultimate station configuration.',
      requirementHtml: 'Upgrade active <strong>Fabricator to Level 9 or higher</strong>.',
      hint: 'Initiate the Level 9 upgrade on your Fabricator building.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Select the <strong>Fabricator</strong>.<br/>3. Click <strong>"Upgrade Building"</strong> to start printing advanced machinery.',
      commanderTip: 'Level 9 fabricator represents the pinnacle of human nano-engineering.',
      congratsMessage: '🏭 FABRICATOR LEVEL 9 ENGAGED! Heavy machinery pipelines are running at peak physical bounds!',
      encouragementQuote: 'Incredible speed! We are only one level away from maximum fabrication capabilities.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 29,
      title: '🏭 Upgrade Fabricator to Level 10 (MAX)',
      shortDesc: 'Upgrade your Fabricator to Level 10 to unlock ultimate planetary base construction blueprints.',
      requirementHtml: 'Upgrade active <strong>Fabricator to Level 10</strong>.',
      hint: 'Trigger the final Level 10 upgrade on your Fabricator building.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Bring the <strong>Fabricator</strong> to maximum Level 10.',
      commanderTip: 'Level 10 Fabricator unlocks advanced endgame facilities like the Bunker!',
      congratsMessage: '🏭 FABRICATOR MAXIMIZED! You have successfully mastered planetary building engineering!',
      encouragementQuote: 'Astounding achievement, Commander! Max level fabricators print planetary structures almost instantaneously.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 30,
      title: '🛡️ Construct Bunker Level 1',
      shortDesc: 'Construct a Bunker to protect your stored resources from hostile raids.',
      requirementHtml: 'Construct or upgrade your <strong>Bunker to Level 1 or higher</strong>.',
      hint: 'Now that Fabricator is Level 10, construct the Bunker under Base Infrastructure Buildings inside the XPL tab.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Locate the <strong>Bunker</strong> slot under infrastructure buildings.<br/>3. Click <strong>"Upgrade Building"</strong> to construct the vault.',
      commanderTip: 'Bunkers hide a fixed percentage of your total resources, keeping them safe from looting fleets.',
      congratsMessage: '🛡️ HEAVY BUNKER ACTIVE! Deep core vaults are now online, shielding your hard-earned wealth.',
      encouragementQuote: 'Incredible security foresight. Hostile fleets will return empty-handed even if they penetrate our outer orbital shields.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 31,
      title: '⚔️ Launch a Strike Fleet Attack',
      shortDesc: 'Command your fleet to launch a tactical strike attack mission against an AI or hostile station.',
      requirementHtml: 'Successfully dispatch at least <strong>one attack fleet mission</strong>.',
      hint: 'Go to the GLXY tab, click an active coordinate or AI target, click "Strike Fleet", assign ships, and click dispatch.',
      howToGetThere: '1. Navigate to the <strong>GLXY</strong> tab.<br/>2. Select an active hostile coordinate on the galaxy grid.<br/>3. Click <strong>"Dispatch Fleet"</strong>, select <strong>"Strike Attack"</strong> as the mission type, and send ships.',
      commanderTip: 'Ensure your fleet has sufficient high-attack Assault Drones to overcome enemy defenders!',
      congratsMessage: '⚔️ STRIKE FORCES LAUNCHED! Your heavy bombers have entered hyperdrive coordinates toward the target!',
      encouragementQuote: 'Sector dominance established! Taking the fight to the enemy coordinates earns prestige and wealth.',
      targetTab: 'galaxy',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 32,
      title: '🚀 Settle Your 2nd Colony Station',
      shortDesc: 'Launch a Settlement Ship to habitable planetary coordinates to establish a second colony.',
      requirementHtml: 'Acquire <strong>at least 2 colony stations</strong> under your command.',
      hint: 'First, train a Settlement Ship in the CMD tab. Open the GLXY tab, locate a green dot marked "Habitable Planet", select it, assign the Settlement Ship, and click dispatch. Once arrived, select it in the XPL tab dropdown!',
      howToGetThere: '1. Open the <strong>CMD</strong> tab.<br/>2. Train 1 <strong>Settlement Ship</strong>.<br/>3. Go to the <strong>GLXY</strong> tab map.<br/>4. Locate any green <strong>Habitable Planet</strong>.<br/>5. Click it, select <strong>"Settle on Planet"</strong>, assign your ship, and dispatch!',
      commanderTip: 'This is the final ultimate step of the Academy. Good luck, Admiral!',
      congratsMessage: '👑 GRAND EMPYREAN CONQUEROR! You have settled your second colony, scaled your economy, and finished all training academies!',
      encouragementQuote: 'Magnificent! You are now a fully-fledged galactic sovereign. Rule the stars with wisdom and might!',
      targetTab: 'galaxy',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 1500 }
    }
  ];`;

const startIdx = content.indexOf(startRawTasksMarker);
const endIdx = content.indexOf(endRawTasksMarker, startIdx);
content = content.substring(0, startIdx) + newRawTasksContent + content.substring(endIdx + endRawTasksMarker.length - '  const tasks: TutorialTask[] = rawTasks.map(t => {'.length);


// 2. Identify start and end of checkObjectiveMet function
const startObjectiveMarker = '  const checkObjectiveMet = (task: TutorialTask): boolean => {\n';
const endObjectiveMarker = '  // Find the user\'s current ACTIVE tutorial task';

const startObjIndex = content.indexOf(startObjectiveMarker);
if (startObjIndex === -1) {
  console.error("Could not find startObjectiveMarker!");
  process.exit(1);
}

const endObjIndex = content.indexOf(endObjectiveMarker, startObjIndex);
if (endObjIndex === -1) {
  console.error("Could not find endObjectiveMarker!");
  process.exit(1);
}

const newObjectiveContent = `  const checkObjectiveMet = (task: TutorialTask): boolean => {
    const checkTechLvl = (techId: string, minLvl: number): boolean => {
      return player.planets.some(pl => {
        const techData = localStorage.getItem(\`moonbase_tech_\${player.id}_\${pl.id}\`);
        if (!techData) return false;
        try {
          const parsed = JSON.parse(techData);
          return (parsed[techId] || 0) >= minLvl;
        } catch {
          return false;
        }
      });
    };

    switch (task.id) {
      case 1:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 1;
      case 2:
        return (
          (
            checkTargetPlanet.mines.water?.some((m) => m.level >= 1) &&
            checkTargetPlanet.mines.plasma?.some((m) => m.level >= 1) &&
            checkTargetPlanet.mines.fuel?.some((m) => m.level >= 1) &&
            checkTargetPlanet.mines.food?.some((m) => m.level >= 1) &&
            checkTargetPlanet.mines.respirant?.some((m) => m.level >= 1)
          ) ||
          completedList.includes(2)
        );
      case 3:
        return (checkTargetPlanet.buildings.commsHub?.level || 0) >= 1;
      case 4:
        return (checkTargetPlanet.buildings.repository?.level || 0) >= 1;
      case 5:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 2;
      case 6:
        return (checkTargetPlanet.buildings.radar?.level || 0) >= 1;
      case 7:
        return (
          localStorage.getItem(\`moonbase_scan_\${player.id}\`) === 'true' ||
          completedList.includes(7)
        );
      case 8:
        return (
          (
            checkTargetPlanet.mines.water?.some((m) => m.level >= 2) &&
            checkTargetPlanet.mines.plasma?.some((m) => m.level >= 2) &&
            checkTargetPlanet.mines.fuel?.some((m) => m.level >= 2) &&
            checkTargetPlanet.mines.food?.some((m) => m.level >= 2) &&
            checkTargetPlanet.mines.respirant?.some((m) => m.level >= 2)
          ) ||
          completedList.includes(8)
        );
      case 9:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 3;
      case 10:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 4;
      case 11:
        return (checkTargetPlanet.buildings.researchCenter?.level || 0) >= 1;
      case 12:
        return (
          localStorage.getItem(\`moonbase_activeres_\${player.id}\`) !== null ||
          completedList.includes(12)
        );
      case 13:
        return checkTechLvl('troop_speed', 1) || completedList.includes(13);
      case 14:
        return (checkTargetPlanet.buildings.researchCenter?.level || 0) >= 2;
      case 15:
        return checkTechLvl('defense_shields', 2) || completedList.includes(15);
      case 16:
        return (
          (
            checkTargetPlanet.mines.water?.some((m) => m.level >= 3) &&
            checkTargetPlanet.mines.plasma?.some((m) => m.level >= 3) &&
            checkTargetPlanet.mines.fuel?.some((m) => m.level >= 3) &&
            checkTargetPlanet.mines.food?.some((m) => m.level >= 3) &&
            checkTargetPlanet.mines.respirant?.some((m) => m.level >= 3)
          ) ||
          completedList.includes(16)
        );
      case 17:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 5;
      case 18:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 6;
      case 19:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 7;
      case 20:
        return (checkTargetPlanet.buildings.armyBase?.level || 0) >= 1;
      case 21:
        return (
          (player.planets || []).some(pl => (pl.troops?.defender || 0) >= 10) ||
          (activePlanet.troops?.defender || 0) >= 10 ||
          completedList.includes(21)
        );
      case 22:
        return (
          (player.planets || []).some(pl => (pl.troops?.attacker || 0) >= 10) ||
          (activePlanet.troops?.attacker || 0) >= 10 ||
          completedList.includes(22)
        );
      case 23:
        return (
          (player.allianceId !== null && player.allianceId !== '') ||
          localStorage.getItem(\`moonbase_alliance_joined_\${player.id}\`) === 'true' ||
          completedList.includes(23)
        );
      case 24:
        return (
          chatMessages.some((msg: any) => msg.senderId === player.id) ||
          localStorage.getItem(\`moonbase_chatted_\${player.id}\`) === 'true' ||
          completedList.includes(24)
        );
      case 25:
        return (
          (player.commandMessages && player.commandMessages.some((m) => m.senderId === player.id)) ||
          localStorage.getItem(\`moonbase_msg_sent_\${player.id}\`) === 'true' ||
          completedList.includes(25)
        );
      case 26:
        return (checkTargetPlanet.buildings.repository?.level || 0) >= 5;
      case 27:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 8;
      case 28:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 9;
      case 29:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 10;
      case 30:
        return (checkTargetPlanet.buildings.bunker?.level || 0) >= 1;
      case 31:
        return (
          fleets.some((f) => f.senderId === player.id && f.missionType === 'attack') ||
          localStorage.getItem(\`moonbase_attack_dispatched_\${player.id}\`) === 'true' ||
          completedList.includes(31)
        );
      case 32:
        return player.planets.length >= 2;
      default:
        return false;
    }
  };\n\n`;

content = content.substring(0, startObjIndex) + newObjectiveContent + content.substring(endObjIndex);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated CommanderTutorial.tsx with escaped quotes!");
