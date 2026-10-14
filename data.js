// All numbers from the PlotGround paper (arXiv:2610.06825).
window.PLOTGROUND = {
  developers: {
    OpenAI:              { color: "var(--dev-openai)", logo: "assets/logos/providers/openai.svg" },
    Google:              { color: "var(--dev-google)", logo: "assets/logos/providers/gemini.svg" },
    Anthropic:           { color: "var(--dev-anthropic)", logo: "assets/logos/providers/claude.svg" },
    Alibaba:             { color: "var(--dev-alibaba)", logo: "assets/logos/providers/qwen.svg" },
    Moonshot:            { color: "var(--dev-moonshot)", logo: "assets/logos/providers/moonshot.svg" },
    "Z.ai":              { color: "var(--dev-zai)", logo: "assets/logos/providers/zai.svg" },
    MiniMax:             { color: "var(--dev-minimax)", logo: "assets/logos/providers/minimax.svg" },
    DeepSeek:            { color: "var(--dev-deepseek)", logo: "assets/logos/providers/deepseek.svg" },
    "Thinking Machines": { color: "var(--dev-tml)", monogram: "TM" }
  },

  // acc2 / acc5: accuracy (%) at ±2% / ±5% relative tolerance; cost in cents per question.
  models: [
    { name: "GPT-5.6 Sol",         dev: "OpenAI",            acc2: 73.8, acc5: 87.5, cost: 1.013, tokens: 419 },
    { name: "GPT-5.6 Luna",        dev: "OpenAI",            acc2: 69.7, acc5: 83.8, cost: 0.113, tokens: 447 },
    { name: "GPT-5.6 Terra",       dev: "OpenAI",            acc2: 66.6, acc5: 82.1, cost: 0.868, tokens: 231 },
    { name: "Gemini 3.7 Flash",    dev: "Google",            acc2: 65.7, acc5: 81.2, cost: 0.428, tokens: 909 },
    { name: "Gemini 3.8 Flash",    dev: "Google",            acc2: 65.5, acc5: 79.8, cost: 0.933, tokens: 2257 },
    { name: "Qwen3.8 Max",         dev: "Alibaba",           acc2: 57.7, acc5: 77.9, cost: 2.945, tokens: 4269 },
    { name: "Claude Opus 5",       dev: "Anthropic",         acc2: 60.2, acc5: 77.1, cost: 2.724, tokens: 564 },
    { name: "Claude Sonnet 5",     dev: "Anthropic",         acc2: 55.6, acc5: 74.4, cost: 0.631, tokens: 105 },
    { name: "Gemini 3.1 Pro",      dev: "Google",            acc2: 49.9, acc5: 67.6, cost: 4.237, tokens: 3337 },
    { name: "Qwen3.8 Flash",       dev: "Alibaba",           acc2: 42.6, acc5: 64.4, cost: 0.223, tokens: 4111 },
    { name: "Kimi K3",             dev: "Moonshot",          acc2: 38.2, acc5: 62.5, cost: 8.371, tokens: 5545 },
    { name: "GLM-5.3 Flash",       dev: "Z.ai",              acc2: 39.8, acc5: 60.2, cost: 0.105, tokens: 1495 },
    { name: "Inkling",             dev: "Thinking Machines", acc2: 32.0, acc5: 50.3, cost: 0.866, tokens: 1633 },
    { name: "MiniMax M3",          dev: "MiniMax",           acc2: 33.8, acc5: 50.3, cost: 0.102, tokens: 358 },
    { name: "DeepSeek V4.1 Flash", dev: "DeepSeek",          acc2: 29.3, acc5: 47.0, cost: 0.131, tokens: 904 },
    { name: "DeepSeek V4 FV exp",  dev: "DeepSeek",          acc2: 17.0, acc5: 28.6, cost: 0.261, tokens: 3177 }
  ],



  examples: [
    { type: "Bar",      img: "assets/examples/1.png",  q: "In panel B, what is the bar height for the Menadione concentration of 500 ppm? (y-axis: 'Food consumption (g)')", a: "0.098525" },
    { type: "Volcano",  img: "assets/examples/v3.png", q: "In panel B, what is the -log10(FDR) value (y-axis) of the point labeled \"Hk2\" in the volcano plot?", a: "46.860" },
    { type: "Scatter",  img: "assets/examples/3.png",  q: "In panel a, what is the free energy ΔG (kJ mol⁻¹) of the Idealised (gray square) data point at the Mg position?", a: "-14.698" },
    { type: "Box",      img: "assets/examples/4.png",  q: "In panel C, what is the median (center line) of the DESIREE box? (y-axis: 'Pf/Pi')", a: "43.147" },
    { type: "Line",     img: "assets/examples/5.png",  q: "In panel A, what is the Rate (AU/s) of the DosR series at [Protein]/µM = 2?", a: "6.04" },
    { type: "Bubble",   img: "assets/examples/6.png",  q: "In panel A, what is the protein count for the bubble labeled 'Viscus'?", a: "132" },
    { type: "Strip",    img: "assets/examples/7.png",  q: "In panel D, what is the MGL+ probability score for the Donor 2 (red) dot in the Aquamicrobium row?", a: "1.165311" },
    { type: "Survival", img: "assets/examples/8.png",  q: "In panel A, what is the probability of survival at the rightmost end of the PLWH curve?", a: "0.7229" }
  ]
};
