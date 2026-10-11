// EcoScan Waste Taxonomy & Material Database
// Compliant with PRD Section 4 & Section 8

export const PRIMARY_BINS = {
  RECYCLABLE: {
    id: 'RECYCLABLE',
    label: 'BLUE RECYCLING BIN',
    name: 'Curbside Recycling',
    color: '#1D70B8',
    bgClass: 'bg-[#1D70B8]',
    borderClass: 'border-[#1D70B8]',
    textClass: 'text-[#1D70B8]',
    badgeBg: 'bg-blue-900/30 text-blue-300 border-blue-500/40',
    icon: 'Recycle',
    description: 'Clean rigid plastics, clean paper, metal cans & glass containers.'
  },
  COMPOST: {
    id: 'COMPOST',
    label: 'GREEN COMPOST BIN',
    name: 'Organics & Food Waste',
    color: '#15803D',
    bgClass: 'bg-[#15803D]',
    borderClass: 'border-[#15803D]',
    textClass: 'text-[#15803D]',
    badgeBg: 'bg-emerald-900/30 text-emerald-300 border-emerald-500/40',
    icon: 'Leaf',
    description: 'Food scraps, yard waste, and food-soiled unlined paper items.'
  },
  NON_RECYCLABLE: {
    id: 'NON_RECYCLABLE',
    label: 'GRAY LANDFILL BIN',
    name: 'General Trash / Landfill',
    color: '#334155',
    bgClass: 'bg-[#334155]',
    borderClass: 'border-[#334155]',
    textClass: 'text-[#334155]',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
    icon: 'Trash2',
    description: 'Non-recyclable plastics, dirty wrappers, composite trash & residual waste.'
  },
  HAZARDOUS: {
    id: 'HAZARDOUS',
    label: 'ORANGE HAZMAT / E-WASTE',
    name: 'Hazardous & Special E-Waste',
    color: '#EA580C',
    bgClass: 'bg-[#EA580C]',
    borderClass: 'border-[#EA580C]',
    textClass: 'text-[#EA580C]',
    badgeBg: 'bg-orange-900/30 text-orange-300 border-orange-500/40',
    icon: 'AlertTriangle',
    description: 'Lithium batteries, electronics, chemicals, & fire hazard items. NEVER IN CURBSIDE.'
  }
};

export const SAMPLE_ITEMS = [
  {
    id: 'pet_bottle',
    name: 'Clear PET Water Bottle',
    material_subtype: 'PLASTIC_RIGID',
    resin_code: '#1 PET',
    primary_bin: 'RECYCLABLE',
    confidence_score: 0.965,
    is_composite: false,
    prep_instructions: [
      'Empty all liquid completely',
      'Flatten bottle to reduce bin volume',
      'Keep cap screwed on or separate if required locally'
    ],
    imageSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#0f172a"/><path d="M85 30h30v15H85z" fill="#38bdf8"/><path d="M75 45h50v20H75z" fill="#0284c7"/><path d="M65 65h70v100c0 10-5 15-15 15H80c-10 0-15-5-15-15V65z" fill="#0369a1" stroke="#38bdf8" stroke-width="4"/><path d="M75 80h50v70H75z" fill="#0284c7" opacity="0.6"/><text x="100" y="120" text-anchor="middle" fill="#ffffff" font-weight="bold" font-size="16">PET 1</text></svg>`,
    notes: 'High recyclability. Curbside accepted in almost all municipalities.'
  },
  {
    id: 'lithium_battery',
    name: 'Dead Lithium-Ion Battery',
    material_subtype: 'E_WASTE',
    primary_bin: 'HAZARDOUS',
    confidence_score: 0.982,
    is_composite: false,
    is_hazard: true,
    hazard_alert: 'HIGH FIRE HAZARD: Lithium batteries can spark and cause severe waste facility fires when crushed in garbage trucks.',
    prep_instructions: [
      'Tape battery terminals with clear electrical tape',
      'Store in a cool dry container until drop-off',
      'Take to a designated retail or municipal e-waste depot'
    ],
    imageSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#0f172a"/><rect x="60" y="50" width="80" height="110" rx="8" fill="#ea580c" stroke="#f97316" stroke-width="4"/><rect x="85" y="38" width="30" height="12" rx="2" fill="#fdba74"/><path d="M90 75h20v40H90z" fill="#ffffff"/><path d="M80 95h40v0" stroke="#ea580c" stroke-width="6"/><path d="M100 85v20" stroke="#ea580c" stroke-width="6"/><text x="100" y="145" text-anchor="middle" fill="#ffffff" font-weight="bold" font-size="12">Li-Ion 3.7V</text></svg>`,
    notes: 'US-02 Hazard Prevention Persona B match.'
  },
  {
    id: 'greasy_pizza_box',
    name: 'Food-Soiled Pizza Box',
    material_subtype: 'FOOD_SOILED_PAPER',
    primary_bin: 'COMPOST',
    confidence_score: 0.910,
    is_composite: true,
    food_soiled: true,
    grease_confidence: 0.84,
    soiled_warning: 'Paper fiber degradation: Cardboard contaminated with cheese or oil cannot be processed into recycled paper pulp.',
    prep_instructions: [
      'Tear off the clean top lid -> Place in Blue Recycling Bin',
      'Place grease-drenched bottom box into Green Compost or Landfill Bin',
      'Remove all plastic cheese saver props into Landfill'
    ],
    composite_split: {
      part1: { name: 'Clean Top Lid', bin: 'RECYCLABLE', color: '#1D70B8' },
      part2: { name: 'Greasy Bottom Base', bin: 'COMPOST', color: '#15803D' }
    },
    imageSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#0f172a"/><path d="M40 70l60-30 60 30v70l-60 30-60-30V70z" fill="#b45309" stroke="#d97706" stroke-width="4"/><path d="M40 70l60 30 60-30" stroke="#d97706" stroke-width="3"/><ellipse cx="100" cy="120" rx="35" ry="20" fill="#78350f" opacity="0.8"/><text x="100" y="125" text-anchor="middle" fill="#fef08a" font-weight="bold" font-size="12">GREASE SOILED</text></svg>`,
    notes: 'FR-08 Food-Soiled Paper Items Edge Case & US-03 Contamination Guard.'
  },
  {
    id: 'bakery_box_window',
    name: 'Windowed Bakery Pastry Box',
    material_subtype: 'COMPOSITE_PACKAGING',
    primary_bin: 'RECYCLABLE',
    confidence_score: 0.895,
    is_composite: true,
    composite_directive: 'Tear clear plastic window into Trash; place cardboard tray into Blue Bin.',
    prep_instructions: [
      'Peel away and detach clear plastic window film',
      'Discard plastic window film into Gray Landfill Bin',
      'Flatten clean cardboard tray and place in Blue Recycling Bin'
    ],
    composite_split: {
      part1: { name: 'Cardboard Box Outer', bin: 'RECYCLABLE', color: '#1D70B8' },
      part2: { name: 'Clear Plastic Window Film', bin: 'NON_RECYCLABLE', color: '#334155' }
    },
    imageSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#0f172a"/><rect x="45" y="45" width="110" height="110" rx="8" fill="#854d0e" stroke="#ca8a04" stroke-width="4"/><rect x="70" y="70" width="60" height="60" rx="4" fill="#38bdf8" opacity="0.5" stroke="#e0f2fe" stroke-width="2"/><text x="100" y="105" text-anchor="middle" fill="#ffffff" font-weight="bold" font-size="11">WINDOW FILM</text></svg>`,
    notes: 'FR-08 Composite Material Packaging Edge Case.'
  },
  {
    id: 'ldpe_grocery_bag',
    name: 'Soft Plastic LDPE Grocery Bag',
    material_subtype: 'PLASTIC_FILM',
    resin_code: '#4 LDPE',
    primary_bin: 'NON_RECYCLABLE',
    confidence_score: 0.920,
    is_composite: false,
    special_note: 'Store Drop-Off Only: Soft films tangle sorting machinery at curbside municipal facilities.',
    prep_instructions: [
      'Do NOT place in standard curbside blue bin',
      'Collect clean soft plastics together',
      'Return to supermarket plastic film drop-off depot'
    ],
    imageSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#0f172a"/><path d="M60 70c0-15 15-25 40-25s40 10 40 25v15H60V70z" fill="none" stroke="#94a3b8" stroke-width="6"/><path d="M50 85h100v75c0 10-10 15-20 15H70c-10 0-20-5-20-15V85z" fill="#475569" stroke="#94a3b8" stroke-width="4"/><text x="100" y="130" text-anchor="middle" fill="#e2e8f0" font-weight="bold" font-size="12">LDPE FILM #4</text></svg>`,
    notes: 'Persona A Emma match. Soft plastic LDPE grocery bag.'
  },
  {
    id: 'aluminum_can',
    name: 'Aluminium Beverage Can',
    material_subtype: 'METAL_CAN',
    primary_bin: 'RECYCLABLE',
    confidence_score: 0.978,
    is_composite: false,
    prep_instructions: [
      'Rinse out remaining liquid',
      'Do not crush completely if local automated optical sorters require shape',
      'Place directly into Blue Recycling Bin'
    ],
    imageSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#0f172a"/><rect x="65" y="45" width="70" height="110" rx="12" fill="#94a3b8" stroke="#cbd5e1" stroke-width="4"/><ellipse cx="100" cy="45" rx="35" ry="10" fill="#cbd5e1"/><path d="M75 75h50v50H75z" fill="#0284c7" opacity="0.7"/><text x="100" y="105" text-anchor="middle" fill="#ffffff" font-weight="bold" font-size="14">ALU CAN</text></svg>`,
    notes: 'Standard curbside infinite recyclability.'
  },
  {
    id: 'uncertain_unknown_wrapper',
    name: 'Ambiguous Metallic Foil Wrapper',
    material_subtype: 'UNKNOWN_COMPOSITE',
    primary_bin: 'NON_RECYCLABLE',
    confidence_score: 0.48, // Low confidence trigger!
    is_composite: true,
    low_confidence: true,
    cautionary_warning: 'Uncertain item (Confidence < 60%). When in doubt, place in General Trash to avoid contaminating recycled batches.',
    prep_instructions: [
      'If metallic shiny layer does not stay folded when crinkled, it contains plastic film',
      'Place in Gray Landfill Bin to protect recycling stream',
      'Tap "Wrong category?" if you know the exact composition'
    ],
    imageSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#0f172a"/><path d="M50 60l40-20 60 30-20 70-70 20z" fill="#64748b" stroke="#f59e0b" stroke-width="4" stroke-dasharray="6 4"/><text x="100" y="105" text-anchor="middle" fill="#f59e0b" font-weight="bold" font-size="22">?</text><text x="100" y="130" text-anchor="middle" fill="#cbd5e1" font-size="10">UNCERTAIN (48%)</text></svg>`,
    notes: 'PRD Section 8 Low Confidence Score edge case.'
  },
  {
    id: 'multiple_items',
    name: 'Multiple Discarded Items',
    material_subtype: 'MULTIPLE_OBJECTS',
    primary_bin: 'NON_RECYCLABLE',
    confidence_score: 0.72,
    multiple_objects_detected: true,
    multiple_warning: 'Multiple items found in frame (> 2 foreground objects). Please isolate and focus on a single product for accuracy.',
    prep_instructions: [
      'Move single object closer to the reticle center',
      'Avoid scanning cluttered sorting tables with multiple items',
      'Scan items individually one by one'
    ],
    imageSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#0f172a"/><rect x="40" y="60" width="50" height="80" rx="4" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/><circle cx="135" cy="110" r="30" fill="#ea580c" stroke="#f97316" stroke-width="2"/><text x="100" y="170" text-anchor="middle" fill="#f59e0b" font-weight="bold" font-size="11">2+ OBJECTS DETECTED</text></svg>`,
    notes: 'PRD Section 8 Multiple Items in Frame edge case.'
  }
];
