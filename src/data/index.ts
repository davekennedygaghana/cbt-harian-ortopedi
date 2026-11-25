import type { FactTable } from '../lib/types';

/**
 * SAMPLE data. Versi lengkap (±1.500 soal dari 30+ tabel) ada di repo asli
 * (folder src/data/ branch claude/cbt-harian-ortopedi-app-3jva7v).
 * Salin folder itu ke sini untuk mengganti sample ini.
 */
export const TABLES: FactTable[] = [
  {
    id: 'garden',
    domain: 'Trauma',
    topic: 'Klasifikasi Garden (fraktur femoral neck)',
    f: 'Pada klasifikasi Garden, {k} adalah:',
    r: 'Pada klasifikasi Garden, deskripsi berikut sesuai dengan: “{v}”',
    ord: true,
    pairs: [
      ['tipe I', 'Fraktur inkomplet, valgus impacted'],
      ['tipe II', 'Fraktur komplet tanpa displacement'],
      ['tipe III', 'Fraktur komplet dengan displacement parsial; trabekula femoral head tidak sejajar acetabulum'],
      ['tipe IV', 'Fraktur komplet dengan displacement total; trabekula femoral head kembali sejajar acetabulum'],
    ],
  },
  {
    id: 'gustilo',
    domain: 'Trauma',
    topic: 'Klasifikasi Gustilo-Anderson (fraktur terbuka)',
    f: 'Pada klasifikasi Gustilo-Anderson, {k} adalah:',
    r: 'Pada klasifikasi Gustilo-Anderson, deskripsi berikut sesuai dengan: “{v}”',
    ord: true,
    note: 'Tipe final sebaiknya ditentukan saat debridement di kamar operasi.',
    pairs: [
      ['tipe I', 'Luka <1 cm, bersih, kontaminasi dan kominusi minimal'],
      ['tipe II', 'Luka 1–10 cm tanpa kerusakan soft tissue yang ekstensif'],
      ['tipe IIIA', 'Luka >10 cm/high-energy, tetapi soft tissue masih cukup menutup tulang'],
      ['tipe IIIB', 'Periosteal stripping ekstensif dengan tulang terekspos; memerlukan flap coverage'],
      ['tipe IIIC', 'Fraktur terbuka dengan cedera arteri yang memerlukan repair'],
    ],
  },
  {
    id: 'eponim',
    domain: 'Trauma',
    topic: 'Fraktur & lesi eponim',
    f: 'Deskripsi yang paling tepat untuk {k} adalah:',
    r: 'Cedera berikut paling tepat disebut: “{v}”',
    pairs: [
      ['Colles fracture', 'Fraktur distal radius ekstra-artikular dengan dorsal displacement/angulation', 'dr'],
      ['Smith fracture', 'Fraktur distal radius ekstra-artikular dengan volar displacement/angulation', 'dr'],
      ['Barton fracture', 'Fraktur rim artikular distal radius dengan subluksasi radiocarpal', 'dr'],
      ['Chauffeur fracture', 'Fraktur intra-artikular radial styloid'],
      ['Galeazzi fracture', 'Fraktur shaft radius sepertiga distal dengan disrupsi DRUJ'],
      ['Monteggia fracture', 'Fraktur ulna proksimal dengan dislokasi radial head'],
      ['Bennett fracture', 'Fraktur-dislokasi intra-artikular dua fragmen pada basis metacarpal I', 'mc1'],
      ['Rolando fracture', 'Fraktur intra-artikular kominutif (pola Y/T) pada basis metacarpal I', 'mc1'],
      ['Boxer fracture', 'Fraktur neck metacarpal V'],
      ['Jones fracture', 'Fraktur metaphyseal-diaphyseal junction metatarsal V (zona 2)'],
      ['Lisfranc injury', 'Fraktur-dislokasi pada tarsometatarsal joint complex'],
      ['Pilon fracture', 'Fraktur intra-artikular plafond distal tibia akibat axial loading'],
      ['Bankart lesion', 'Avulsi labrum anteroinferior dari glenoid'],
      ['Hill-Sachs lesion', 'Impaction fracture posterolateral humeral head pada dislokasi anterior shoulder', 'hs'],
      ['Jefferson fracture', 'Burst fracture ring C1 akibat axial loading'],
      ['Hangman fracture', 'Traumatic spondylolisthesis C2 (fraktur pars interarticularis bilateral)'],
      ['Mallet finger', 'Ruptur/avulsi terminal extensor tendon pada DIP joint'],
      ['Jersey finger', 'Avulsi tendon FDP dari basis distal phalanx'],
    ],
  },
];
