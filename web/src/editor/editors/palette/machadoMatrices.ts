// The Machado, Oliveira and Fernandes (2009) color-vision-deficiency matrices, one copy for the
// palette editor's vision panel and the badge-similarity report. See NOTICE.md.

/** Machado et al. 2009, Table 1, severity 1.0 (rows give linear R, G, B out). */
export const MACHADO = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
} as const;
