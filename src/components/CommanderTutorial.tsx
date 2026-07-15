import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerProfile, ColonyPlanet, ResourceType } from '../types';
import { getTaskResourceReward } from '../gameUtils';

interface CommanderTutorialProps {
  player: PlayerProfile;
  activePlanet: ColonyPlanet;
  fleets: any[];
  onRefreshState: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setActiveTab: (tab: 'explore' | 'army' | 'galaxy' | 'research' | 'settings' | 'chat') => void;
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
  targetTab: 'explore' | 'army' | 'galaxy' | 'research' | 'settings' | 'chat';
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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hasClickedExpandGuide, setHasClickedExpandGuide] = useState(() => {
    return localStorage.getItem(`moonbase_expand_guide_clicked_${player.id}`) === 'true';
  });
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
      title: '🏭 Construct Fabricator to Level 1',
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
      encouragementQuote: 'Perfect! Always keep an eye on your storage limit so your extractor siphons don\'t saturate and waste energy.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 5,
      title: '🏭 Queue/Upgrade Fabricator to Level 2',
      shortDesc: 'Queue a construction upgrade for your main station Fabricator to Level 2, or construct/upgrade it directly.',
      requirementHtml: 'Queue a Fabricator upgrade or have a <strong>Fabricator at Level 2 or higher</strong>.',
      hint: 'Under the XPL tab infrastructure, select your Fabricator and click Queue Upgrade or Upgrade Building.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Find the <strong>Fabricator</strong>.<br/>3. Start the upgrade directly, or if another building is active, use Space Gold to click <strong>"Queue Upgrade"</strong>.',
      commanderTip: 'Upgrading or queuing the Fabricator secures a continuous, high-speed construction grid!',
      congratsMessage: '🏭 FABRICATOR QUEUED OR UPGRADED! Your planetary assembly lines are operating with maximum structural fluidity.',
      encouragementQuote: 'Superb planning! Utilizing the construction queue ensures your base expands even while you command other sectors.',
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
      encouragementQuote: 'Excellent. Let\'s use our newly constructed radar arrays to map out the surrounding galaxy sector.',
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
      title: '🏭 Queue/Upgrade Fabricator to Level 4',
      shortDesc: 'Queue an upgrade for your main station Fabricator to Level 4 to expand your building queues and speed up assembly line structures.',
      requirementHtml: 'Have a <strong>queued upgrade</strong> for your Fabricator or have a <strong>Fabricator at Level 4 or higher</strong>.',
      hint: 'Go to the XPL tab, find the Fabricator under Base Infrastructure Buildings, and click Upgrade or Queue Upgrade to Level 4.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Find the <strong>Fabricator</strong> in the Base Infrastructure Buildings list.<br/>3. Click <strong>"Upgrade Building"</strong> or <strong>"Queue Upgrade"</strong> to upgrade it to Level 4.',
      commanderTip: 'Using the construction queue allows simultaneous planetary building operations!',
      congratsMessage: '🏭 FABRICATOR QUEUED OR UPGRADED TO LEVEL 4! You can now print advanced scientific structures!',
      encouragementQuote: 'Outstanding! The path to advanced science and high-speed research projects is now officially open.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 10,
      title: '📡 Upgrade Communications Hub to Level 2',
      shortDesc: 'Upgrade your Communications Hub to Level 2 to expand orbital frequency bandwidth.',
      requirementHtml: 'Have a <strong>Communications Hub at Level 2 or higher</strong>.',
      hint: 'Go to XPL, find the Communications Hub under Base Infrastructure, and upgrade it to Level 2.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Find the <strong>Communications Hub</strong> under Base Infrastructure Buildings.<br/>3. Click <strong>"Upgrade Building"</strong> to upgrade it to Level 2.',
      commanderTip: 'Upgraded communication hubs increase satellite transmission reach and power.',
      congratsMessage: '📡 COMMUNICATIONS HUB UPGRADED! Your communication array has been boosted, securing better frequencies!',
      encouragementQuote: 'Excellent connection strength! Keep expanding your infrastructure to match our growing colony size.',
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
      encouragementQuote: 'Incredible work scaling our colony\'s resource supply lines. We now have the economy to back high-tier facilities.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 17,
      title: '🏭 Upgrade Fabricator to Level 7',
      shortDesc: 'Upgrade your main station Fabricator to Level 7 to unlock advanced heavy manufacturing capabilities.',
      requirementHtml: 'Have a <strong>Fabricator at Level 7 or higher</strong>.',
      hint: 'Find the Fabricator under XPL and click Upgrade to Level 7.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Find the <strong>Fabricator</strong> in infrastructure buildings.<br/>3. Click <strong>"Upgrade Building"</strong> to raise it to Level 7.',
      commanderTip: 'A Level 7 Fabricator unlocks the Army Base (War Room) where you can build powerful warships!',
      congratsMessage: '🏭 FABRICATOR LEVEL 7 UNLOCKED! Military blueprints have been uploaded to your station mainframe!',
      encouragementQuote: 'Sensational! A powerful empire needs a powerful fleet. Next, let\'s build the War Room.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 18,
      title: '📡 Upgrade Communications Hub to Level 3',
      shortDesc: 'Scale your Communications Hub to Level 3 to unlock deeper subspace frequencies.',
      requirementHtml: 'Have a <strong>Communications Hub at Level 3 or higher</strong>.',
      hint: 'Go to XPL, select the Communications Hub, and upgrade it to Level 3.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Scroll to <strong>Communications Hub</strong> and initiate the Level 3 upgrade sequence.',
      commanderTip: 'Upgrading your Comms Hub improves remote command synchronization across sectors.',
      congratsMessage: '📡 COMMUNICATIONS INTERFACE COMPLETED! Frequencies are completely clean and noise-free.',
      encouragementQuote: 'Amazing subspace coordination. Your station\'s communication range is now highly impressive.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 19,
      title: '🛰️ Upgrade Radar Array to Level 2',
      shortDesc: 'Calibrate your Radar Array to Level 2 to increase deep galaxy sweep scan resolution.',
      requirementHtml: 'Have a <strong>Radar Array at Level 2 or higher</strong>.',
      hint: 'Find your Radar Array under XPL and upgrade it to Level 2.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Find the <strong>Radar Array</strong> under Base Infrastructure.<br/>3. Click <strong>"Upgrade Building"</strong> to raise it to Level 2.',
      commanderTip: 'Better radar arrays provide more precise scans, uncovering hidden planet details.',
      congratsMessage: '🛰️ DEEP SPACE RADAR CALIBRATED! Sweep range and telemetry accuracy have risen!',
      encouragementQuote: 'Marvelous scanning potential, Commander. Our sector charts are looking pristine.',
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
      targetTab: 'army',
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
      targetTab: 'army',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 23,
      title: '⚡ Deploy Extractor Production Boost',
      shortDesc: 'Supercharge your station\'s extraction rates by deploying a tactical overdrive production boost.',
      requirementHtml: 'Activate a <strong>production boost</strong> on any of your extractor pumps, or trigger system-wide overdrive.',
      hint: 'Go to the XPL tab, find any resource extractor outpost category, and click "⚡ Boost", or select the Standalone Production Overdrive Card.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Locate the <strong>RESOURCE EXTRACTOR OUTPOSTS</strong> or the standalone <strong>Production Boost</strong> card.<br/>3. Select <strong>"⚡ Boost"</strong>, choose a duration, and deploy the booster using Space Gold.',
      commanderTip: 'Overdrive boosts multiply resource extraction hourly output by +14%, securing massive reserves rapidly.',
      congratsMessage: '⚡ REFINE MATRICES SUPERCHARGED! Extractor siphons are glowing with active overdrive booster fields!',
      encouragementQuote: 'Incredible initiative, Admiral. Active production boosts give us the economic leverage to fund gargantuan projects.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 24,
      title: '⚡ Boost Extractor Production Yields',
      shortDesc: 'Supercharge your mining rates by activating a tactical overdrive production boost on your extractor outposts.',
      requirementHtml: 'Deploy a <strong>production booster</strong> overdrive on any of your active extractor pumps.',
      hint: 'Go to the XPL tab, find any resource extractor outpost category, and click "⚡ Boost" to supercharge its output.',
      howToGetThere: '1. Open the <strong>XPL</strong> tab.<br/>2. Scroll down to <strong>"RESOURCE EXTRACTOR OUTPOSTS"</strong>.<br/>3. Click the <strong>"⚡ Boost"</strong> button next to any of your extractor pumps and confirm overdrive deployment.',
      commanderTip: 'Overdrive boosts multiply resource extraction hourly output by +14%, securing massive reserves rapidly.',
      congratsMessage: '⚡ EXTRACTION SUPERCHARGED! Your extractor outposts are operating in tactical overdrive!',
      encouragementQuote: 'Fabulous strategy! Maximizing extraction rates provides our colony with vital reserves to build flagship vessels.',
      targetTab: 'explore',
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
      title: '🏭 Upgrade Fabricator to Level 10 (MAX)',
      shortDesc: 'Upgrade your main station Fabricator to Level 10 to unlock ultimate planetary construction blueprints.',
      requirementHtml: 'Have a <strong>Fabricator at Level 10</strong>.',
      hint: 'Bring your Fabricator to maximum Level 10 under the XPL tab.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Find the <strong>Fabricator</strong> and click <strong>"Upgrade Building"</strong> to reach maximum Level 10.',
      commanderTip: 'A maximum Level 10 Fabricator unlocks endgame facilities like the heavy Bunker!',
      congratsMessage: '🏭 FABRICATOR MAXIMIZED! You have successfully mastered planetary building engineering!',
      encouragementQuote: 'Astounding achievement, Commander! Max level fabricators print planetary structures almost instantaneously.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 28,
      title: '⚔️ Upgrade War Room (Army Base) to Level 2',
      shortDesc: 'Upgrade your War Room (Army Base) to Level 2 to expand military command limits.',
      requirementHtml: 'Have a <strong>War Room (Army Base) at Level 2 or higher</strong>.',
      hint: 'Under XPL, find the War Room (Army Base) and upgrade it to Level 2.',
      howToGetThere: '1. Navigate to the <strong>XPL</strong> tab.<br/>2. Find the <strong>Army Base (War Room)</strong> in infrastructure.<br/>3. Click <strong>"Upgrade Building"</strong> to level 2.',
      commanderTip: 'An upgraded War Room allows for heavier ship blueprints and faster training times.',
      congratsMessage: '⚔️ WAR ROOM UPGRADED! Command limits have expanded, offering more workspace for top officers!',
      encouragementQuote: 'Magnificent progress! A stronger command deck establishes immense security for our colonists.',
      targetTab: 'explore',
      rewards: { resources: { water: 5000, plasma: 5000, fuel: 5000, food: 5000, respirant: 5000 }, credits: 50 }
    },
    {
      id: 29,
      title: '🔬 Upgrade Research Center to Level 3',
      shortDesc: 'Upgrade your Research Center to Level 3 to enable ultimate scientific advancements.',
      requirementHtml: 'Have a <strong>Research Center at Level 3 or higher</strong>.',
      hint: 'Go to XPL, select the Research Center, and click Upgrade to Level 3.',
      howToGetThere: '1. Go to the <strong>XPL</strong> tab.<br/>2. Locate the <strong>Research Center</strong> under infrastructure.<br/>3. Click <strong>"Upgrade Building"</strong> to begin constructing Level 3 labs.',
      commanderTip: 'Higher research levels are key to scaling fleet strength and unlock ultimate technologies.',
      congratsMessage: '🔬 RESEARCH CENTER SCALE INITIATED! Advanced laboratories have successfully launched!',
      encouragementQuote: 'Science leads the way, Commander! Excellent work scaling our physical and material research labs.',
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
  ];

  const tasks: TutorialTask[] = rawTasks.map(t => {
    const custom = customTasks?.[t.id] || customTasks?.[String(t.id)];
    let base = t;
    if (custom) {
      base = {
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

    const upgradedResources = getTaskResourceReward(t.id);

    return {
      ...base,
      rewards: {
        resources: upgradedResources,
        credits: 50
      }
    };
  });

  if (DEFAULT_TUTORIAL_TASKS.length === 0 && tasks.length > 0) {
    DEFAULT_TUTORIAL_TASKS = tasks;
  }

  // Tasks must be done on the player's latest planet (the last one in the planets array) and not any earlier planet
  const checkTargetPlanet = player.planets[player.planets.length - 1] || activePlanet;

  // Logic to determine if task objective is met
  const checkObjectiveMet = (task: TutorialTask): boolean => {
    const checkTechLvl = (techId: string, minLvl: number): boolean => {
      return player.planets.some(pl => {
        const techData = localStorage.getItem(`moonbase_tech_${player.id}_${pl.id}`);
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
        return (
          (checkTargetPlanet.buildings.fabricator?.level || 0) >= 2 ||
          checkTargetPlanet.buildings.fabricator?.isUpgrading ||
          (checkTargetPlanet.upgradeQueue || []).some((item: any) => item.type === 'building' && item.key === 'fabricator')
        );
      case 6:
        return (checkTargetPlanet.buildings.radar?.level || 0) >= 1;
      case 7:
        return (
          localStorage.getItem(`moonbase_scan_${player.id}`) === 'true' ||
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
        return (
          (checkTargetPlanet.buildings.fabricator?.level || 0) >= 4 ||
          checkTargetPlanet.buildings.fabricator?.isUpgrading ||
          (checkTargetPlanet.upgradeQueue || []).some((item: any) => item.type === 'building' && item.key === 'fabricator')
        );
      case 10:
        return (checkTargetPlanet.buildings.commsHub?.level || 0) >= 2;
      case 11:
        return (checkTargetPlanet.buildings.researchCenter?.level || 0) >= 1;
      case 12:
        return (
          localStorage.getItem(`moonbase_activeres_${player.id}`) !== null ||
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
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 7;
      case 18:
        return (checkTargetPlanet.buildings.commsHub?.level || 0) >= 3;
      case 19:
        return (checkTargetPlanet.buildings.radar?.level || 0) >= 2;
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
          localStorage.getItem(`moonbase_boosted_${player.id}`) === 'true' ||
          Object.values(checkTargetPlanet.mines || {}).some((list: any) => 
            Array.isArray(list) && list.some((mine: any) => mine.boostedUntil && Number(mine.boostedUntil) > Date.now())
          ) ||
          completedList.includes(23)
        );
      case 24:
        return (
          localStorage.getItem(`moonbase_boosted_${player.id}`) === 'true' ||
          Object.values(checkTargetPlanet.mines || {}).some((list: any) => 
            Array.isArray(list) && list.some((mine: any) => mine.boostedUntil && Number(mine.boostedUntil) > Date.now())
          ) ||
          completedList.includes(24)
        );
      case 25:
        return (
          (player.commandMessages && player.commandMessages.some((m) => m.senderId === player.id)) ||
          localStorage.getItem(`moonbase_msg_sent_${player.id}`) === 'true' ||
          completedList.includes(25)
        );
      case 26:
        return (checkTargetPlanet.buildings.repository?.level || 0) >= 5;
      case 27:
        return (checkTargetPlanet.buildings.fabricator?.level || 0) >= 10;
      case 28:
        return (checkTargetPlanet.buildings.armyBase?.level || 0) >= 2;
      case 29:
        return (checkTargetPlanet.buildings.researchCenter?.level || 0) >= 3;
      case 30:
        return (checkTargetPlanet.buildings.bunker?.level || 0) >= 1;
      case 31:
        return (
          fleets.some((f) => f.senderId === player.id && f.missionType === 'attack') ||
          localStorage.getItem(`moonbase_attack_dispatched_${player.id}`) === 'true' ||
          completedList.includes(31)
        );
      case 32:
        return player.planets.length >= 2;
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
        let errMsg = data.error || 'Failed to claim reward.';
        if (errMsg.toLowerCase().includes('invalid tutorial task id')) {
          const hasCustomBackend = typeof window !== 'undefined' && !!localStorage.getItem('space_station_backend_url');
          if (hasCustomBackend) {
            errMsg += ' (Diagnostic: You are pointing to a custom backend via localStorage. Please click "Reset Terminal Config" on the connection banner, or clear custom gateway in your browser to sync with the latest server update.)';
          } else {
            errMsg += ' (Diagnostic: Please refresh your browser or check sync status under Settings.)';
          }
        }
        showToast(errMsg, 'error');
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
    <div className="bg-gradient-to-b from-[#0F172A] to-[#020617] border border-cyan-500/20 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.05)] overflow-hidden font-mono transition-all duration-300">
      {/* Header bar */}
      <div 
        onClick={() => {
          if (isCollapsed) {
            localStorage.setItem(`moonbase_expand_guide_clicked_${player.id}`, 'true');
            setHasClickedExpandGuide(true);
          }
          setIsCollapsed(!isCollapsed);
        }}
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
              ? `bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-extrabold hover:shadow-[0_0_12px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 ${
                  !hasClickedExpandGuide ? 'animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.85)] border-2 border-cyan-300' : ''
                }`
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
                      Rule the stars! We have configured an epic progressive training program to walk you through the core of your empire's assembly lines, science labs, fleet transponders, text DMs, public chat, and outer coordinate expansions. Grab materials and free **Space Gold** for each task claim!
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
                      🚀 NAVIGATE TO {activeTask.targetTab === 'explore' ? 'XPL' : activeTask.targetTab === 'army' ? 'CMD' : activeTask.targetTab === 'galaxy' ? 'GLXY' : activeTask.targetTab === 'research' ? 'Res' : 'SETTINGS'}
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
                      <span className="text-amber-400">🪙 Space Gold</span>
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
