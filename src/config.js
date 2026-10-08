// World layout for a stylised Monrovia, Liberia.
// Coordinates are metres. +x is east, +z is south (towards the Atlantic), -z is north
// (towards the Mesurado River and Bushrod Island).

export const ROAD_HALF = 7; // half width of a two-lane street
export const SIDEWALK = 4; // sidewalk width beyond the road edge
export const LOT_MARGIN = ROAD_HALF + SIDEWALK + 0.4; // buildings start this far from a street centre line
export const LANE_OFFSET = 3.4; // AI drives on the right, this far from the centre line

export const WATER_LEVEL = -1.1;

export const LAND = [
  { x0: -370, x1: 600, z0: -150, z1: 150, type: 'ground' }, // the Monrovia peninsula
  { x0: -335, x1: 600, z0: 140, z1: 178, type: 'sand' }, // Atlantic beach
  { x0: -260, x1: 180, z0: -430, z1: -300, type: 'ground' }, // Bushrod Island / Freeport
  { x0: -105, x1: -15, z0: -252, z1: -205, type: 'ground' }, // Providence Island
  { x0: -68, x1: -52, z0: -310, z1: -140, type: 'bridge' }, // Gabriel Tucker Bridge
];

// East-west streets. `names` maps an x threshold to a street name (first match where x <= limit).
export const EW_STREETS = [
  { z: -120, x0: -200, x1: 160, names: [[Infinity, 'Water Street']] },
  { z: -75, x0: -330, x1: 240, names: [[Infinity, 'Carey Street']] },
  { z: -25, x0: -330, x1: 560, names: [[165, 'Broad Street'], [Infinity, 'Tubman Boulevard']] },
  { z: 25, x0: -330, x1: 240, names: [[Infinity, 'Ashmun Street']] },
  { z: 75, x0: -330, x1: 560, names: [[Infinity, 'Capitol Bypass']] },
  { z: 125, x0: -330, x1: 560, names: [[-180, 'UN Drive'], [Infinity, 'Coastal Road']] },
  { z: -320, x0: -200, x1: 80, names: [[Infinity, 'Freeport Road']] },
  { z: -390, x0: -200, x1: 80, names: [[Infinity, 'Bushrod Highway']] },
];

// North-south streets. `names` maps a z threshold to a street name (first match where z <= limit).
export const NS_STREETS = [
  { x: -330, z0: -75, z1: 125, names: [[Infinity, 'Mamba Point Road']] },
  { x: -270, z0: -75, z1: 125, names: [[Infinity, 'Randall Street']] },
  { x: -200, z0: -120, z1: 125, names: [[Infinity, 'Mechlin Street']] },
  { x: -130, z0: -120, z1: 125, names: [[Infinity, 'Buchanan Street']] },
  {
    x: -60, z0: -390, z1: 125,
    names: [[-305, 'Somalia Drive'], [-145, 'Gabriel Tucker Bridge'], [Infinity, 'Center Street']],
  },
  { x: 10, z0: -120, z1: 125, names: [[Infinity, 'Gurley Street']] },
  { x: 80, z0: -120, z1: 125, names: [[Infinity, 'Lynch Street']] },
  { x: 160, z0: -120, z1: 125, names: [[Infinity, 'Camp Johnson Road']] },
  { x: 240, z0: -75, z1: 125, names: [[Infinity, '12th Street']] },
  { x: 320, z0: -25, z1: 125, names: [[Infinity, '15th Street']] },
  { x: 400, z0: -25, z1: 125, names: [[Infinity, '19th Street']] },
  { x: 480, z0: -25, z1: 125, names: [[Infinity, '24th Street']] },
  { x: 560, z0: -25, z1: 125, names: [[Infinity, 'Red Light Road']] },
  { x: -200, z0: -390, z1: -320, names: [[Infinity, 'Vai Town Road']] },
  { x: 80, z0: -390, z1: -320, names: [[Infinity, 'Freeport Gate Road']] },
];

// Districts, first match wins.
export const DISTRICTS = [
  { name: 'Providence Island', x0: -105, x1: -15, z0: -252, z1: -205 },
  { name: 'Mesurado River', x0: -400, x1: 600, z0: -300, z1: -150 },
  { name: 'Freeport of Monrovia', x0: -20, x1: 200, z0: -440, z1: -300 },
  { name: 'Bushrod Island', x0: -280, x1: 200, z0: -440, z1: -300 },
  { name: 'West Point', x0: -280, x1: -200, z0: -150, z1: -90 },
  { name: 'Waterside', x0: -200, x1: 20, z0: -150, z1: -100 },
  { name: 'Mamba Point', x0: -400, x1: -255, z0: -150, z1: 150 },
  { name: 'Snapper Hill', x0: -255, x1: -150, z0: -150, z1: 150 },
  { name: 'Downtown Monrovia', x0: -150, x1: 60, z0: -150, z1: 150 },
  { name: 'Capitol Hill', x0: 60, x1: 250, z0: -150, z1: 150 },
  { name: 'Sinkor', x0: 250, x1: 470, z0: -150, z1: 150 },
  { name: 'Paynesville', x0: 470, x1: 620, z0: -150, z1: 150 },
  { name: 'Atlantic Beach', x0: -400, x1: 620, z0: 150, z1: 200 },
];

// Landmarks: `reserve` keeps procedural buildings away; `pos` is where HUD/minimap label it.
export const LANDMARKS = [
  { id: 'ducor', name: 'Ducor Hotel', pos: [-300, -115], reserve: [-328, -270, -148, -88] },
  { id: 'lighthouse', name: 'Cape Mesurado Lighthouse', pos: [-355, -135], reserve: [-370, -340, -150, -120] },
  { id: 'westpoint', name: 'West Point Township', pos: [-235, -125], reserve: [-268, -205, -150, -88] },
  { id: 'waterside', name: 'Waterside Market', pos: [-130, -137], reserve: [-195, -68, -150, -128] },
  { id: 'masonic', name: 'Masonic Temple', pos: [-235, 0], reserve: [-258, -212, -13, 13] },
  { id: 'police', name: 'LNP Headquarters', pos: [-95, -50], reserve: [-118, -72, -63, -37] },
  { id: 'cityhall', name: 'Monrovia City Hall', pos: [-25, 50], reserve: [-48, -2, 37, 63] },
  { id: 'capitol', name: 'Capitol Building', pos: [120, 50], reserve: [93, 147, 37, 63] },
  { id: 'mansion', name: 'Executive Mansion', pos: [200, 100], reserve: [172, 228, 87, 113] },
  { id: 'jfk', name: 'JFK Medical Center', pos: [280, 50], reserve: [253, 307, 37, 63] },
  { id: 'stadium', name: 'SKD Sports Complex', pos: [440, 25], reserve: [412, 468, -13, 63] },
  { id: 'redlight', name: 'Red Light Market', pos: [520, 25], reserve: [492, 548, -13, 63] },
  { id: 'providence', name: 'Providence Island', pos: [-30, -228], reserve: [-105, -15, -252, -205] },
  { id: 'freeport', name: 'Freeport Docks', pos: [120, -360], reserve: [93, 180, -430, -300] },
  { id: 'spray_sinkor', name: 'Sinkor Spray & Fix', pos: [360, 98], reserve: [340, 380, 87, 113] },
  { id: 'spray_bushrod', name: 'Vai Town Garage', pos: [-160, -356], reserve: [-185, -135, -378, -334] },
];

// Places that matter to gameplay.
export const SPAWN = { x: -60, z: 0, heading: Math.PI };
export const HOSPITAL_SPAWN = { x: 280, z: 30 };
export const POLICE_SPAWN = { x: -95, z: -32 };
export const SPRAY_SHOPS = [
  { x: 360, z: 104, r: 6, name: 'Sinkor Spray & Fix' },
  { x: -160, z: -346, r: 6, name: 'Vai Town Garage' },
];

export const DAY_LENGTH_SECONDS = 600; // a full in-game day lasts 10 real minutes
